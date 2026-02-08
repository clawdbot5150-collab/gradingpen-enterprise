import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { sendWelcomeEmail } from '../services/emailService';
import { createInitialUserData } from '../services/userService';

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        emailVerified: new Date(), // In production, implement email verification
      }
    });

    // Create initial user data (preferences, baseline assessment, etc.)
    await createInitialUserData(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      logger.error('Failed to send welcome email', emailError);
      // Don't fail registration if email fails
    }

    logger.info(`New user registered: ${user.email}`, { userId: user.id });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        currentLevel: user.currentLevel,
        confidenceScore: user.confidenceScore
      },
      token
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user account'
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      // Increment failed login attempts
      const newAttempts = user.loginAttempts + 1;
      const lockDuration = newAttempts >= 5 ? 30 * 60 * 1000 : null; // 30 minutes
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: lockDuration ? new Date(Date.now() + lockDuration) : null
        }
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        currentLevel: user.currentLevel,
        confidenceScore: user.confidenceScore,
        totalSessions: user.totalSessions,
        streakDays: user.streakDays,
        preferences: user.preferences,
        subscription: user.subscriptions[0] || null
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate user'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        error: 'Token required',
        message: 'Refresh token is required'
      });
    }

    // Verify existing token (even if expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', {
      ignoreExpiration: true
    }) as any;

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Failed to refresh token'
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist tokens
    // For now, we just acknowledge the logout
    
    logger.info('User logged out', { 
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout'
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    if (user) {
      // In production, implement password reset email
      logger.info(`Password reset requested for: ${email}`, { userId: user.id });
      // TODO: Send password reset email with secure token
    }

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process password reset request'
    });
  }
});

export default router;