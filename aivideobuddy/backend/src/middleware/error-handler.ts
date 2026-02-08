import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { ValidationError } from 'joi';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Don't log client errors (4xx) as errors, only as warnings
  const isClientError = error instanceof ApiError && error.statusCode < 500;
  
  if (isClientError) {
    logger.warn('Client error:', {
      error: error.message,
      statusCode: (error as ApiError).statusCode,
      code: (error as ApiError).code,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    logger.error('Server error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  // Handle different types of errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle Joi validation errors
  if (error instanceof ValidationError || error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.message,
      },
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'A record with this information already exists',
            details: prismaError.meta?.target,
          },
        });
      
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
          },
        });
      
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_CONSTRAINT',
            message: 'Invalid reference to related resource',
          },
        });
      
      default:
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
          },
        });
    }
  }

  // Handle Multer errors (file upload)
  if (error.name === 'MulterError') {
    const multerError = error as any;
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds the maximum allowed limit',
          },
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: 'Too many files uploaded',
          },
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNEXPECTED_FILE',
            message: 'Unexpected file field',
          },
        });
      
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'File upload failed',
          },
        });
    }
  }

  // Handle syntax errors
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
    });
  }

  // Handle Redis errors
  if (error.message?.includes('Redis') || error.message?.includes('ECONNREFUSED')) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cache service temporarily unavailable',
      },
    });
  }

  // Handle rate limiting errors
  if (error.message?.includes('rate limit') || error.message?.includes('Too Many Requests')) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
    },
  });
}

// Async error wrapper
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

// Validation error handler
export function validationErrorHandler(errors: any[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (errors.length > 0) {
      const errorMessages = errors.map(error => error.msg).join(', ');
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessages,
          details: errors,
        },
      });
    }
    next();
  };
}