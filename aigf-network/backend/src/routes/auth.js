const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const DatabaseService = require('../services/DatabaseService');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authMiddleware 
} = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: {
    error: 'Too many failed attempts',
    message: 'Account temporarily locked. Please try again in 1 hour.'
  }
});

/**
 * POST /api/auth/register
 * User registration
 */
router.post('/register', 
  authLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
    body('firstName')
      .optional()
      .isLength({ max: 100 })
      .trim(),
    body('lastName')
      .optional()
      .isLength({ max: 100 })
      .trim(),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Valid date of birth required (YYYY-MM-DD)'),
    body('timezone')
      .optional()
      .isLength({ max: 50 }),
    body('goals')
      .optional()
      .isArray()
      .custom((goals) => {
        if (goals && goals.length > 10) {
          throw new Error('Maximum 10 goals allowed');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        email,
        password,
        username,
        firstName,
        lastName,
        dateOfBirth,
        timezone = 'UTC',
        goals = [],
        preferences = {}
      } = req.body;

      // Check if user already exists
      const existingUser = await DatabaseService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }

      // Check username uniqueness
      const existingUsername = await DatabaseService.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      if (existingUsername.rows.length > 0) {
        return res.status(409).json({
          error: 'Username taken',
          message: 'This username is already in use'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const userData = {
        email,
        passwordHash,
        username,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || null,
        timezone,
        goals,
        preferences: {
          ...preferences,
          emailVerificationToken
        }
      };

      const newUser = await DatabaseService.createUser(userData);

      // Create initial user progress record
      await DatabaseService.updateUserProgress(newUser.id, {
        overall_confidence_score: 0,
        category_scores: {},
        current_level: 1,
        experience_points: 0
      });

      // Generate tokens
      const accessToken = generateToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Log successful registration
      logger.info(`New user registered: ${newUser.email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          subscriptionType: 'free',
          emailVerified: false
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'Internal server error during registration'
      });
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
  authLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, rememberMe = false } = req.body;

      // Find user
      const user = await DatabaseService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Check account status
      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'Account unavailable',
          message: 'Account is not active. Please contact support.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Update last login
      await DatabaseService.updateUser(user.id, {
        last_login: new Date()
      });

      // Generate tokens
      const expiresIn = rememberMe ? '30d' : '7d';
      const accessToken = generateToken(user, expiresIn);
      const refreshToken = generateRefreshToken(user);

      logger.info(`User logged in: ${user.email}`);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          subscriptionType: user.subscription_type,
          emailVerified: user.email_verified,
          profilePicture: user.profile_picture_url
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'Internal server error during login'
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Get user
      const user = await DatabaseService.findUserById(decoded.userId);
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const newAccessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.json({
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        message: 'Invalid or expired refresh token'
      });
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password',
  strictAuthLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email } = req.body;

      const user = await DatabaseService.findUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token
      await DatabaseService.updateUser(user.id, {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires
      });

      // TODO: Send email with reset link
      // For now, log the token (in production, this would be sent via email)
      logger.info(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password',
  strictAuthLimiter,
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { token, password } = req.body;

      // Find user with valid reset token
      const result = await DatabaseService.query(
        'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          error: 'Invalid token',
          message: 'Password reset token is invalid or expired'
        });
      }

      const user = result.rows[0];

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update password and clear reset token
      await DatabaseService.updateUser(user.id, {
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null
      });

      logger.info(`Password reset successful for user: ${user.email}`);

      res.json({
        message: 'Password reset successful. You can now login with your new password.'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
router.post('/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { token } = req.body;

      // Find user with verification token
      const result = await DatabaseService.query(
        'SELECT * FROM users WHERE email_verification_token = $1',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          error: 'Invalid token',
          message: 'Email verification token is invalid'
        });
      }

      const user = result.rows[0];

      // Update email verification status
      await DatabaseService.updateUser(user.id, {
        email_verified: true,
        email_verification_token: null
      });

      logger.info(`Email verified for user: ${user.email}`);

      res.json({
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        error: 'Email verification failed',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user (invalidate token - client-side mostly)
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);
    
    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await DatabaseService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Get user progress
    const progress = await DatabaseService.getUserProgress(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        subscriptionType: user.subscription_type,
        emailVerified: user.email_verified,
        profilePicture: user.profile_picture_url,
        bio: user.bio,
        goals: user.goals,
        timezone: user.timezone,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      progress: progress || {
        overall_confidence_score: 0,
        current_level: 1,
        experience_points: 0,
        sessions_completed: 0
      }
    });

  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: 'Internal server error'
    });
  }
});

module.exports = router;