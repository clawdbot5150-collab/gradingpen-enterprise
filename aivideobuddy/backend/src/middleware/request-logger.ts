import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId?: string;
  startTime?: number;
}

// Enhanced request logging middleware
export function requestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.set('X-Request-ID', req.requestId);

  // Extract useful request information
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString(),
  };

  // Log the incoming request
  logger.info('Request started', requestInfo);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const endTime = Date.now();
    const duration = endTime - req.startTime!;

    const responseInfo = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString(),
    };

    // Log response based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', { ...requestInfo, ...responseInfo });
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', { ...requestInfo, ...responseInfo });
    } else if (duration > 5000) {
      logger.warn('Slow request completed', { ...requestInfo, ...responseInfo });
    } else {
      logger.info('Request completed', { ...requestInfo, ...responseInfo });
    }

    return originalJson.call(this, body);
  };

  // Override res.send to log response
  const originalSend = res.send;
  res.send = function(body: any) {
    const endTime = Date.now();
    const duration = endTime - req.startTime!;

    const responseInfo = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString(),
    };

    // Log response based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', { ...requestInfo, ...responseInfo });
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', { ...requestInfo, ...responseInfo });
    } else if (duration > 5000) {
      logger.warn('Slow request completed', { ...requestInfo, ...responseInfo });
    } else {
      logger.info('Request completed', { ...requestInfo, ...responseInfo });
    }

    return originalSend.call(this, body);
  };

  next();
}

// Security logging middleware
export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  const securityEvents = [];

  // Check for potential security issues
  const userAgent = req.get('User-Agent');
  const xForwardedFor = req.get('X-Forwarded-For');
  const authorization = req.get('Authorization');

  // Detect potential bot traffic
  if (userAgent && isSuspiciousUserAgent(userAgent)) {
    securityEvents.push('suspicious_user_agent');
  }

  // Detect potential proxy/VPN usage
  if (xForwardedFor && hasMultipleIPs(xForwardedFor)) {
    securityEvents.push('multiple_forwarded_ips');
  }

  // Detect brute force attempts
  if (req.path.includes('/auth/') && req.method === 'POST') {
    securityEvents.push('auth_attempt');
  }

  // Check for SQL injection patterns
  const queryString = JSON.stringify(req.query);
  if (hasSQLInjectionPattern(queryString) || hasSQLInjectionPattern(JSON.stringify(req.body))) {
    securityEvents.push('sql_injection_attempt');
    logger.error('Potential SQL injection attempt', {
      ip: req.ip,
      path: req.path,
      query: req.query,
      body: req.body,
      userAgent,
    });
  }

  // Check for XSS patterns
  if (hasXSSPattern(queryString) || hasXSSPattern(JSON.stringify(req.body))) {
    securityEvents.push('xss_attempt');
    logger.error('Potential XSS attempt', {
      ip: req.ip,
      path: req.path,
      query: req.query,
      body: req.body,
      userAgent,
    });
  }

  // Log security events
  if (securityEvents.length > 0) {
    logger.warn('Security events detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      events: securityEvents,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

// Performance monitoring middleware
export function performanceLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    const performanceInfo = {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', performanceInfo);
    } else if (duration > 500) {
      logger.info('Moderate request duration', performanceInfo);
    }

    // Log high memory usage
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      logger.warn('High memory usage detected', {
        requestId: req.requestId,
        memoryUsage,
        path: req.path,
      });
    }
  });

  next();
}

// Error tracking middleware
export function errorTracker(req: RequestWithId, res: Response, next: NextFunction): void {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Track error responses
    if (res.statusCode >= 400 && body?.error) {
      logger.error('Error response sent', {
        requestId: req.requestId,
        statusCode: res.statusCode,
        errorCode: body.error.code,
        errorMessage: body.error.message,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    return originalJson.call(this, body);
  };

  next();
}

// User activity logging middleware
export function userActivityLogger(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  
  if (user) {
    res.on('finish', () => {
      // Only log successful operations
      if (res.statusCode < 400) {
        logger.info('User activity', {
          userId: user.id,
          action: `${req.method} ${req.path}`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  next();
}

// Helper functions
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /ruby/i,
    /go-http-client/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

function hasMultipleIPs(xForwardedFor: string): boolean {
  return xForwardedFor.split(',').length > 2;
}

function hasSQLInjectionPattern(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /'[^']*'|--|\|\|/,
    /\b(OR|AND)\s+\w+\s*=\s*\w+/i,
    /';\s*(DROP|DELETE|UPDATE)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

function hasXSSPattern(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=\s*['"][^'"]*['"]/i,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

// API usage tracking middleware
export function apiUsageTracker(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  const apiKey = (req as any).apiKey;

  res.on('finish', () => {
    if (res.statusCode < 400) {
      const usageInfo = {
        userId: user?.id,
        apiKeyId: apiKey?.id,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      };

      // Log API usage for analytics
      logger.info('API usage', usageInfo);
    }
  });

  next();
}

// Combine all logging middlewares
export function setupLogging() {
  return [
    requestLogger,
    securityLogger,
    performanceLogger,
    errorTracker,
    userActivityLogger,
    apiUsageTracker,
  ];
}