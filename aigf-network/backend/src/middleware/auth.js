const jwt = require('jsonwebtoken');
const DatabaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No valid token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await DatabaseService.findUserById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'User not found'
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Account is not active'
        });
      }

      // Add user info to request object
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionType: user.subscription_type,
        status: user.status
      };

      next();
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please login again'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Token is malformed'
        });
      }
      
      throw jwtError;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Adds user info if token is provided, but doesn't require it
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user info
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await DatabaseService.findUserById(decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          subscriptionType: user.subscription_type,
          status: user.status
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
      logger.debug('Optional auth failed, continuing without user:', jwtError.message);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Admin Only Middleware
 */
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login first'
      });
    }

    // Check if user has admin privileges (you can modify this logic)
    if (req.user.subscriptionType !== 'enterprise') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({
      error: 'Authorization error',
      message: 'Internal server error during authorization'
    });
  }
};

/**
 * Premium Feature Middleware
 */
const premiumMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login first'
      });
    }

    if (req.user.subscriptionType === 'free') {
      return res.status(403).json({
        error: 'Premium feature',
        message: 'This feature requires a premium subscription',
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    logger.error('Premium middleware error:', error);
    res.status(500).json({
      error: 'Authorization error',
      message: 'Internal server error during authorization'
    });
  }
};

/**
 * Rate Limiting by User
 */
const userRateLimit = (maxRequests = 60, windowMinutes = 1) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated users
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    requests.set(userId, validRequests);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMinutes} minute(s)`,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(userId, validRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      const cutoff = now - windowMs;
      for (const [key, timestamps] of requests) {
        const filtered = timestamps.filter(t => t > cutoff);
        if (filtered.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, filtered);
        }
      }
    }

    next();
  };
};

/**
 * Generate JWT Token
 */
const generateToken = (user, expiresIn = '7d') => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    subscriptionType: user.subscription_type
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: 'aigf-network',
    audience: 'aigf-users'
  });
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    issuer: 'aigf-network',
    audience: 'aigf-users'
  });
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  premiumMiddleware,
  userRateLimit,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};