import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redis: RedisClientType;

export async function initializeRedis(): Promise<RedisClientType> {
  try {
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
      },
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
    });

    redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    redis.on('ready', () => {
      logger.info('Redis client ready');
    });

    redis.on('end', () => {
      logger.info('Redis client connection ended');
    });

    redis.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    await redis.connect();
    
    // Test the connection
    await redis.ping();
    logger.info('Redis connection test successful');

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect Redis:', error);
    }
  }
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redis || !redis.isOpen) {
      return false;
    }
    
    const response = await redis.ping();
    return response === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

// Cache helper functions
export class CacheService {
  private static instance: CacheService;
  
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await redis.setEx(key, ttlSeconds, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const deleted = await redis.del(key);
      return deleted > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await redis.del(keys);
    } catch (error) {
      logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.incrBy(key, by);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, seconds);
      return result;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await redis.hGet(key, field);
    } catch (error) {
      logger.error(`Cache hGet error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      const result = await redis.hSet(key, field, value);
      return result >= 0;
    } catch (error) {
      logger.error(`Cache hSet error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await redis.hGetAll(key);
    } catch (error) {
      logger.error(`Cache hGetAll error for key ${key}:`, error);
      return {};
    }
  }

  async listPush(key: string, value: string): Promise<number> {
    try {
      return await redis.lPush(key, value);
    } catch (error) {
      logger.error(`Cache listPush error for key ${key}:`, error);
      return 0;
    }
  }

  async listPop(key: string): Promise<string | null> {
    try {
      return await redis.lPop(key);
    } catch (error) {
      logger.error(`Cache listPop error for key ${key}:`, error);
      return null;
    }
  }

  async listLength(key: string): Promise<number> {
    try {
      return await redis.lLen(key);
    } catch (error) {
      logger.error(`Cache listLength error for key ${key}:`, error);
      return 0;
    }
  }

  // Session management
  async setSession(sessionId: string, userData: any, ttlSeconds: number = 86400): Promise<boolean> {
    return this.set(`session:${sessionId}`, userData, ttlSeconds);
  }

  async getSession(sessionId: string): Promise<any> {
    return this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.delete(`session:${sessionId}`);
  }

  // Rate limiting
  async rateLimitCheck(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const current = await this.increment(`ratelimit:${key}`);
      
      if (current === 1) {
        await this.expire(`ratelimit:${key}`, windowSeconds);
      }
      
      const ttl = await redis.ttl(`ratelimit:${key}`);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
    } catch (error) {
      logger.error(`Rate limit check error for key ${key}:`, error);
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }
}

export { redis };