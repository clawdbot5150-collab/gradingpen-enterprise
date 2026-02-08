import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { CacheService } from '../config/redis';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

const cache = CacheService.getInstance();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    subscription: string;
    credits: number;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  static generateTokens(user: { id: string; email: string }): { accessToken: string; refreshToken: string } {
    const sessionId = `session_${user.id}_${Date.now()}`;

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        sessionId,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        sessionId,
        type: 'refresh',
      },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  static async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      
      // Check if session is still valid in cache
      const sessionData = await cache.getSession(decoded.sessionId);
      if (!sessionData) {
        logger.warn('Token verification failed: Session not found in cache', { sessionId: decoded.sessionId });
        return null;
      }

      return decoded;
    } catch (error) {
      logger.warn('Token verification failed:', error);
      return null;
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        return null;
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return null;
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      logger.warn('Refresh token verification failed:', error);
      return null;
    }
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await cache.deleteSession(sessionId);
  }

  static async revokeAllUserSessions(userId: string): Promise<void> {
    await cache.deletePattern(`session:*_${userId}_*`);
  }
}

// Main authentication middleware
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Access token required');
    }

    const decoded = await AuthService.verifyToken(token);
    
    if (!decoded) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    // Get user from cache first, then database
    let user = await cache.get(`user:${decoded.userId}`);
    
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          subscription: true,
          credits: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'User not found');
      }

      if (!user.isActive) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Account disabled');
      }

      // Cache user data for 5 minutes
      await cache.set(`user:${user.id}`, user, 300);
    }

    // Attach user to request
    req.user = user;
    
    // Update last activity
    await cache.set(`user_activity:${user.id}`, Date.now(), 3600);

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    
    logger.error('Authentication error:', error);
    next(new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Authentication service error'));
  }
}

// Optional authentication middleware (for public endpoints that can benefit from user context)
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromRequest(req);
    
    if (token) {
      const decoded = await AuthService.verifyToken(token);
      
      if (decoded) {
        const user = await cache.get(`user:${decoded.userId}`);
        if (user || (user = await getUserFromDatabase(decoded.userId))) {
          req.user = user;
          if (!await cache.exists(`user:${user.id}`)) {
            await cache.set(`user:${user.id}`, user, 300);
          }
        }
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we continue even if authentication fails
    logger.debug('Optional authentication failed:', error);
    next();
  }
}

// Subscription tier authorization middleware
export function requireSubscription(minTier: string) {
  const tierHierarchy = {
    'FREE': 0,
    'PRO': 1,
    'BUSINESS': 2,
    'ENTERPRISE': 3,
  };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    const userTierLevel = tierHierarchy[req.user.subscription as keyof typeof tierHierarchy];
    const requiredTierLevel = tierHierarchy[minTier as keyof typeof tierHierarchy];

    if (userTierLevel < requiredTierLevel) {
      return next(new ApiError(403, 'SUBSCRIPTION_REQUIRED', `${minTier} subscription or higher required`));
    }

    next();
  };
}

// API key authentication middleware
export async function apiKeyAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new ApiError(401, 'UNAUTHORIZED', 'API key required');
    }

    // Check cache first
    let apiKeyData = await cache.get(`apikey:${apiKey}`);
    
    if (!apiKeyData) {
      // Hash the API key and look it up in database
      const crypto = require('crypto');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const dbApiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              subscription: true,
              credits: true,
              isActive: true,
            },
          },
        },
      });

      if (!dbApiKey || !dbApiKey.isActive || (dbApiKey.expiresAt && dbApiKey.expiresAt < new Date())) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired API key');
      }

      if (!dbApiKey.user.isActive) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Account disabled');
      }

      apiKeyData = {
        id: dbApiKey.id,
        permissions: dbApiKey.permissions,
        user: dbApiKey.user,
      };

      // Cache for 10 minutes
      await cache.set(`apikey:${apiKey}`, apiKeyData, 600);
      
      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: dbApiKey.id },
        data: { lastUsedAt: new Date() },
      });
    }

    req.user = apiKeyData.user;
    (req as any).apiKey = apiKeyData;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    
    logger.error('API key authentication error:', error);
    next(new ApiError(500, 'INTERNAL_SERVER_ERROR', 'API key authentication service error'));
  }
}

// Permission check middleware
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const apiKey = (req as any).apiKey;
    
    if (!apiKey || !apiKey.permissions.includes(permission)) {
      return next(new ApiError(403, 'INSUFFICIENT_PERMISSIONS', `Permission '${permission}' required`));
    }

    next();
  };
}

// Helper functions
function extractTokenFromRequest(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  const tokenFromCookie = req.cookies?.accessToken;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  return null;
}

async function getUserFromDatabase(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      subscription: true,
      credits: true,
      isActive: true,
    },
  });
}

// Logout middleware
export async function logoutMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromRequest(req);
    
    if (token) {
      const decoded = await AuthService.verifyToken(token);
      if (decoded) {
        await AuthService.revokeSession(decoded.sessionId);
      }
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    next();
  } catch (error) {
    logger.error('Logout error:', error);
    next();
  }
}

// Rate limiting based on user
export function userRateLimit(maxRequests: number, windowMs: number) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next();
    }

    const key = `rate_limit:user:${req.user.id}`;
    const result = await cache.rateLimitCheck(key, maxRequests, Math.floor(windowMs / 1000));

    if (!result.allowed) {
      return next(new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests', {
        resetTime: result.resetTime,
        remaining: result.remaining,
      }));
    }

    next();
  };
}