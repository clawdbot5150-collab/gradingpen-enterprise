import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define log format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Define log format for files
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define log format for structured logging (e.g., ELK stack)
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    return JSON.stringify({
      ...info,
      service: 'aivideobuddy-backend',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define transports
const transports: winston.transport[] = [];

// Console transport
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true') {
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug',
      format: consoleFormat,
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 5,
    })
  );

  // HTTP access log
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
    })
  );
}

// Add external logging service if configured
if (process.env.LOG_SERVICE_URL) {
  transports.push(
    new winston.transports.Http({
      host: process.env.LOG_SERVICE_HOST,
      port: parseInt(process.env.LOG_SERVICE_PORT || '80'),
      path: process.env.LOG_SERVICE_PATH || '/logs',
      format: structuredFormat,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format: fileFormat,
  defaultMeta: {
    service: 'aivideobuddy-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat,
    }),
  ],
  exitOnError: false,
});

// Create specialized loggers
export const securityLogger = winston.createLogger({
  level: 'warn',
  format: structuredFormat,
  defaultMeta: {
    service: 'aivideobuddy-security',
    type: 'security',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      format: fileFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export const auditLogger = winston.createLogger({
  level: 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'aivideobuddy-audit',
    type: 'audit',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 100 * 1024 * 1024,
      maxFiles: 20,
    }),
  ],
});

export const performanceLogger = winston.createLogger({
  level: 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'aivideobuddy-performance',
    type: 'performance',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Helper functions for structured logging
export const loggerHelpers = {
  // Log user actions with context
  logUserAction: (userId: string, action: string, resource?: string, metadata?: any) => {
    auditLogger.info('User action', {
      userId,
      action,
      resource,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },

  // Log API calls with performance metrics
  logApiCall: (endpoint: string, method: string, duration: number, statusCode: number, userId?: string) => {
    performanceLogger.info('API call', {
      endpoint,
      method,
      duration,
      statusCode,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Log security events
  logSecurityEvent: (eventType: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
    securityLogger.warn('Security event', {
      eventType,
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Log business events
  logBusinessEvent: (eventType: string, data: any, userId?: string) => {
    logger.info('Business event', {
      eventType,
      data,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Log external service interactions
  logExternalService: (service: string, operation: string, success: boolean, duration?: number, error?: string) => {
    logger.info('External service interaction', {
      service,
      operation,
      success,
      duration,
      error,
      timestamp: new Date().toISOString(),
    });
  },

  // Log database operations
  logDatabaseOperation: (operation: string, table: string, duration?: number, error?: string) => {
    logger.debug('Database operation', {
      operation,
      table,
      duration,
      error,
      timestamp: new Date().toISOString(),
    });
  },

  // Log video processing events
  logVideoProcessing: (videoId: string, stage: string, status: 'started' | 'completed' | 'failed', details?: any) => {
    logger.info('Video processing', {
      videoId,
      stage,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Log payment events
  logPaymentEvent: (eventType: string, userId: string, amount?: number, currency?: string, details?: any) => {
    auditLogger.info('Payment event', {
      eventType,
      userId,
      amount,
      currency,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Log rate limiting events
  logRateLimit: (type: string, identifier: string, limit: number, current: number, blocked: boolean) => {
    logger.warn('Rate limit event', {
      type,
      identifier,
      limit,
      current,
      blocked,
      timestamp: new Date().toISOString(),
    });
  },
};

// Middleware for Express to add request context to logs
export const addRequestContext = (req: any, res: any, next: any) => {
  const requestId = req.requestId || 'unknown';
  const userId = req.user?.id || 'anonymous';
  
  // Add request context to all log messages within this request
  logger.defaultMeta = {
    ...logger.defaultMeta,
    requestId,
    userId,
  };
  
  next();
};

// Function to create child logger with specific context
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

// Health check for logging system
export const checkLoggerHealth = (): boolean => {
  try {
    logger.info('Logger health check');
    return true;
  } catch (error) {
    console.error('Logger health check failed:', error);
    return false;
  }
};

// Graceful shutdown for logging system
export const closeLogger = async (): Promise<void> => {
  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
};

// Export the main logger as default
export default logger;