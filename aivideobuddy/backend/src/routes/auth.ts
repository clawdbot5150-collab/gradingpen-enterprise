import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { CacheService } from '../config/redis';
import { ApiError } from '../utils/api-error';
import { AuthService, authMiddleware, logoutMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limiter';
import { asyncHandler } from '../middleware/error-handler';
import { loggerHelpers } from '../utils/logger';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();
const cache = CacheService.getInstance();

// Email service configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('displayName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Display name is required and must be 1-50 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', errors.array());
  }
  next();
};

// Register new user
router.post('/register', authLimiter, registerValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, username, password, displayName } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username },
      ],
    },
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    throw new ApiError(409, 'ALREADY_EXISTS', `User with this ${field} already exists`);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName,
      passwordHash,
      subscription: 'FREE',
      credits: 100, // Free credits for new users
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      subscription: true,
      credits: true,
      createdAt: true,
    },
  });

  // Store verification token in cache (expires in 24 hours)
  await cache.set(`email_verification:${verificationToken}`, user.id, 86400);

  // Send verification email
  if (process.env.NODE_ENV === 'production') {
    try {
      await emailTransporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Welcome to AIVideoBuddy - Verify Your Email',
        html: `
          <h1>Welcome to AIVideoBuddy!</h1>
          <p>Hi ${displayName},</p>
          <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The AIVideoBuddy Team</p>
        `,
      });
    } catch (error) {
      // Don't fail registration if email fails
      console.error('Failed to send verification email:', error);
    }
  }

  // Generate tokens
  const { accessToken, refreshToken } = AuthService.generateTokens(user);

  // Store session
  await cache.setSession(`session_${user.id}_${Date.now()}`, {
    userId: user.id,
    email: user.email,
    loginAt: new Date().toISOString(),
  });

  // Log user registration
  loggerHelpers.logUserAction(user.id, 'register', 'user', { email, username });

  res.status(201).json({
    success: true,
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}));

// Login user
router.post('/login', authLimiter, loginValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      passwordHash: true,
      subscription: true,
      credits: true,
      isActive: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(401, 'ACCOUNT_DISABLED', 'Your account has been disabled');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const { accessToken, refreshToken } = AuthService.generateTokens(user);

  // Store session
  const sessionId = `session_${user.id}_${Date.now()}`;
  const sessionData = {
    userId: user.id,
    email: user.email,
    loginAt: new Date().toISOString(),
    rememberMe: !!rememberMe,
  };
  
  const sessionTTL = rememberMe ? 604800 : 86400; // 7 days or 1 day
  await cache.setSession(sessionId, sessionData, sessionTTL);

  // Remove password hash from response
  const { passwordHash, ...userResponse } = user;

  // Set secure cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: rememberMe ? 604800000 : 86400000, // 7 days or 1 day in milliseconds
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, { 
    ...cookieOptions, 
    maxAge: 604800000, // Refresh token always lasts 7 days
  });

  // Log successful login
  loggerHelpers.logUserAction(user.id, 'login', 'user', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent'),
    rememberMe 
  });

  res.json({
    success: true,
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const refreshTokenFromCookie = req.cookies?.refreshToken;

  const token = refreshToken || refreshTokenFromCookie;
  
  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Refresh token required');
  }

  const tokens = await AuthService.refreshToken(token);
  
  if (!tokens) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
  }

  // Update cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 86400000 });
  res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 604800000 });

  res.json({
    success: true,
    data: {
      tokens,
    },
  });
}));

// Logout user
router.post('/logout', authMiddleware, logoutMiddleware, asyncHandler(async (req, res) => {
  const user = (req as any).user;

  // Log logout
  if (user) {
    loggerHelpers.logUserAction(user.id, 'logout', 'user', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
  }

  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
}));

// Logout from all devices
router.post('/logout-all', authMiddleware, asyncHandler(async (req, res) => {
  const user = (req as any).user;

  // Revoke all sessions for this user
  await AuthService.revokeAllUserSessions(user.id);

  // Log logout from all devices
  loggerHelpers.logUserAction(user.id, 'logout_all', 'user', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    data: {
      message: 'Logged out from all devices successfully',
    },
  });
}));

// Get current user profile
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = (req as any).user;

  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      subscription: true,
      credits: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: {
      user: userProfile,
    },
  });
}));

// Forgot password
router.post('/forgot-password', authLimiter, forgotPasswordValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, displayName: true },
  });

  // Always return success to prevent email enumeration
  const successResponse = {
    success: true,
    data: {
      message: 'If the email exists, a password reset link has been sent',
    },
  };

  if (!user) {
    return res.json(successResponse);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Store reset token in cache (expires in 1 hour)
  await cache.set(`password_reset:${resetToken}`, user.id, 3600);

  // Send password reset email
  if (process.env.NODE_ENV === 'production') {
    try {
      await emailTransporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'AIVideoBuddy - Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${user.displayName},</p>
          <p>You requested a password reset for your AIVideoBuddy account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The AIVideoBuddy Team</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  // Log password reset request
  loggerHelpers.logUserAction(user.id, 'forgot_password', 'user', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });

  res.json(successResponse);
}));

// Reset password
router.post('/reset-password', authLimiter, resetPasswordValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Get user ID from token
  const userId = await cache.get(`password_reset:${token}`);
  
  if (!userId) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Invalid or expired reset token');
  }

  // Hash new password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Remove reset token
  await cache.delete(`password_reset:${token}`);

  // Revoke all sessions for security
  await AuthService.revokeAllUserSessions(userId);

  // Log password reset
  loggerHelpers.logUserAction(userId, 'reset_password', 'user', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });

  res.json({
    success: true,
    data: {
      message: 'Password reset successfully',
    },
  });
}));

// Change password (authenticated)
router.post('/change-password', authMiddleware, changePasswordValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  // Get user with password hash
  const userWithPassword = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!userWithPassword) {
    throw new ApiError(404, 'NOT_FOUND', 'User not found');
  }

  // Check current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'INVALID_CREDENTIALS', 'Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Log password change
  loggerHelpers.logUserAction(user.id, 'change_password', 'user', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });

  res.json({
    success: true,
    data: {
      message: 'Password changed successfully',
    },
  });
}));

// Verify email
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Verification token is required');
  }

  // Get user ID from token
  const userId = await cache.get(`email_verification:${token}`);
  
  if (!userId) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Invalid or expired verification token');
  }

  // Update user as verified
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });

  // Remove verification token
  await cache.delete(`email_verification:${token}`);

  // Log email verification
  loggerHelpers.logUserAction(userId, 'verify_email', 'user', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });

  res.json({
    success: true,
    data: {
      message: 'Email verified successfully',
    },
  });
}));

export default router;