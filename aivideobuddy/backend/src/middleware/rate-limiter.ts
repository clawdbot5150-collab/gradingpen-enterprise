import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../config/redis';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

const cache = CacheService.getInstance();

// Custom rate limiting store using Redis
class RedisStore {
  constructor(private windowMs: number) {}

  async increment(key: string): Promise<{ totalHits: number; timeToExpire?: number }> {
    try {
      const result = await cache.rateLimitCheck(key, Number.MAX_SAFE_INTEGER, this.windowMs / 1000);
      const totalHits = Number.MAX_SAFE_INTEGER - result.remaining + 1;
      const timeToExpire = Math.max(0, result.resetTime - Date.now());
      
      return { totalHits, timeToExpire };
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      return { totalHits: 1 };
    }
  }

  async decrement(key: string): Promise<void> {
    // Redis automatically handles expiration, no need to decrement
  }

  async resetKey(key: string): Promise<void> {
    await cache.delete(`ratelimit:${key}`);
  }
}

// General rate limiter configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  keyGenerator: (req) => {
    // Use IP address as the key, but consider X-Forwarded-For for proxy setups
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `auth:${req.ip}`,
});

// API rate limiter for external API calls
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // 10,000 requests per hour for API
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key if available, otherwise IP
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey ? `api:${apiKey}` : `api:${req.ip}`;
  },
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 uploads per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many uploads, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `upload:${req.ip}`,
});

// AI generation rate limiter
const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI generations per hour for free users
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'AI generation rate limit exceeded, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ai:${req.ip}`,
});

// Custom rate limiter based on subscription tier
export function createSubscriptionBasedLimiter(
  freeLimit: number,
  proLimit: number,
  businessLimit: number,
  enterpriseLimit: number,
  windowMs: number = 60 * 60 * 1000
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      let limit = freeLimit; // Default for non-authenticated users
      
      if (user) {
        switch (user.subscription) {
          case 'PRO':
            limit = proLimit;
            break;
          case 'BUSINESS':
            limit = businessLimit;
            break;
          case 'ENTERPRISE':
            limit = enterpriseLimit;
            break;
          default:
            limit = freeLimit;
        }
      }

      const key = user ? `user:${user.id}` : `ip:${req.ip}`;
      const result = await cache.rateLimitCheck(key, limit, windowMs / 1000);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      });

      if (!result.allowed) {
        throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', {
          resetTime: result.resetTime,
          remaining: result.remaining,
          limit,
        });
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      
      logger.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to proceed
      next();
    }
  };
}

// Resource-specific rate limiters
export function createResourceRateLimiter(
  resource: string,
  limit: number,
  windowMs: number = 60 * 60 * 1000
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const key = user ? `${resource}:user:${user.id}` : `${resource}:ip:${req.ip}`;
      
      const result = await cache.rateLimitCheck(key, limit, windowMs / 1000);

      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      });

      if (!result.allowed) {
        throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', `${resource} rate limit exceeded`, {
          resetTime: result.resetTime,
          remaining: result.remaining,
          limit,
        });
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      
      logger.error(`${resource} rate limiting error:`, error);
      next();
    }
  };
}

// Burst rate limiter for short-term limits
export function createBurstLimiter(
  limit: number,
  windowMs: number = 60 * 1000 // 1 minute default
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const key = user ? `burst:user:${user.id}` : `burst:ip:${req.ip}`;
      
      const result = await cache.rateLimitCheck(key, limit, windowMs / 1000);

      if (!result.allowed) {
        throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests in a short time', {
          resetTime: result.resetTime,
          remaining: result.remaining,
          limit,
        });
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      
      logger.error('Burst rate limiting error:', error);
      next();
    }
  };
}

// Sliding window rate limiter
export function createSlidingWindowLimiter(
  limit: number,
  windowMs: number = 60 * 60 * 1000
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const key = user ? `sliding:user:${user.id}` : `sliding:ip:${req.ip}`;
      const now = Date.now();
      
      // Use Redis sorted set for sliding window
      const windowStart = now - windowMs;
      
      // Remove expired entries
      await cache.increment(key); // This is a placeholder - would need proper sliding window implementation
      
      const count = await cache.listLength(key);
      
      if (count > limit) {
        throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Sliding window rate limit exceeded');
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      
      logger.error('Sliding window rate limiting error:', error);
      next();
    }
  };
}

// Rate limiter for specific IP addresses (whitelist/blacklist)
export function createIPBasedLimiter(
  whitelist: string[] = [],
  blacklist: string[] = [],
  defaultLimit: number = 1000,
  windowMs: number = 60 * 60 * 1000
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clientIP = req.ip;

    // Check blacklist
    if (blacklist.includes(clientIP)) {
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'IP address is blocked');
    }

    // Skip rate limiting for whitelisted IPs
    if (whitelist.includes(clientIP)) {
      return next();
    }

    // Apply default rate limiting
    const result = await cache.rateLimitCheck(`ip:${clientIP}`, defaultLimit, windowMs / 1000);

    if (!result.allowed) {
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded for IP');
    }

    next();
  };
}

// Adaptive rate limiter that adjusts based on system load
export function createAdaptiveLimiter(
  baseLimit: number,
  windowMs: number = 60 * 60 * 1000
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get system load (simplified - would integrate with monitoring)
      const systemLoad = await getSystemLoad();
      
      // Adjust limit based on system load
      let adjustedLimit = baseLimit;
      if (systemLoad > 0.8) {
        adjustedLimit = Math.floor(baseLimit * 0.5);
      } else if (systemLoad > 0.6) {
        adjustedLimit = Math.floor(baseLimit * 0.75);
      }

      const user = (req as any).user;
      const key = user ? `adaptive:user:${user.id}` : `adaptive:ip:${req.ip}`;
      
      const result = await cache.rateLimitCheck(key, adjustedLimit, windowMs / 1000);

      res.set({
        'X-RateLimit-Limit': adjustedLimit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
        'X-System-Load': systemLoad.toFixed(2),
      });

      if (!result.allowed) {
        throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Adaptive rate limit exceeded');
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      
      logger.error('Adaptive rate limiting error:', error);
      next();
    }
  };
}

// Helper function to get system load (placeholder)
async function getSystemLoad(): Promise<number> {
  // This would integrate with actual system monitoring
  // For now, return a random value between 0 and 1
  return Math.random();
}

// Export the configured limiters
export {
  generalLimiter as rateLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  aiGenerationLimiter,
};