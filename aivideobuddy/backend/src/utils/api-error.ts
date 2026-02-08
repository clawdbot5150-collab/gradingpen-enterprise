export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    // Ensure the stack trace points to where the error was created
    Error.captureStackTrace(this, this.constructor);
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  // Static factory methods for common errors
  static badRequest(message: string = 'Bad request', details?: any): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: any): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message, details);
  }

  static forbidden(message: string = 'Forbidden', details?: any): ApiError {
    return new ApiError(403, 'FORBIDDEN', message, details);
  }

  static notFound(message: string = 'Resource not found', details?: any): ApiError {
    return new ApiError(404, 'NOT_FOUND', message, details);
  }

  static conflict(message: string = 'Conflict', details?: any): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static unprocessableEntity(message: string = 'Unprocessable entity', details?: any): ApiError {
    return new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static tooManyRequests(message: string = 'Too many requests', details?: any): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message, details);
  }

  static internalServerError(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message, details);
  }

  static serviceUnavailable(message: string = 'Service unavailable', details?: any): ApiError {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message, details);
  }

  // Business logic specific errors
  static subscriptionRequired(message: string = 'Subscription upgrade required', details?: any): ApiError {
    return new ApiError(402, 'SUBSCRIPTION_REQUIRED', message, details);
  }

  static insufficientCredits(message: string = 'Insufficient credits', details?: any): ApiError {
    return new ApiError(402, 'INSUFFICIENT_CREDITS', message, details);
  }

  static resourceLimitExceeded(message: string = 'Resource limit exceeded', details?: any): ApiError {
    return new ApiError(429, 'RESOURCE_LIMIT_EXCEEDED', message, details);
  }

  static processingError(message: string = 'Processing error', details?: any): ApiError {
    return new ApiError(422, 'PROCESSING_ERROR', message, details);
  }

  static aiModelError(message: string = 'AI model error', details?: any): ApiError {
    return new ApiError(503, 'AI_MODEL_ERROR', message, details);
  }

  static videoGenerationFailed(message: string = 'Video generation failed', details?: any): ApiError {
    return new ApiError(422, 'VIDEO_GENERATION_FAILED', message, details);
  }

  static uploadFailed(message: string = 'Upload failed', details?: any): ApiError {
    return new ApiError(422, 'UPLOAD_FAILED', message, details);
  }

  static paymentFailed(message: string = 'Payment failed', details?: any): ApiError {
    return new ApiError(402, 'PAYMENT_FAILED', message, details);
  }

  static externalServiceError(message: string = 'External service error', details?: any): ApiError {
    return new ApiError(503, 'EXTERNAL_SERVICE_ERROR', message, details);
  }

  static validationError(message: string = 'Validation error', details?: any): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  // Method to check if error is operational (expected) or programming error
  static isOperational(error: Error): boolean {
    if (error instanceof ApiError) {
      return error.isOperational;
    }
    return false;
  }
}

// Error code constants
export const ERROR_CODES = {
  // Generic HTTP errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // Business Logic
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT_FORMAT: 'INVALID_INPUT_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',

  // Processing
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  VIDEO_GENERATION_FAILED: 'VIDEO_GENERATION_FAILED',
  AUDIO_GENERATION_FAILED: 'AUDIO_GENERATION_FAILED',
  IMAGE_PROCESSING_FAILED: 'IMAGE_PROCESSING_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  ENCODING_FAILED: 'ENCODING_FAILED',

  // External Services
  AI_MODEL_ERROR: 'AI_MODEL_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EMAIL_DELIVERY_FAILED: 'EMAIL_DELIVERY_FAILED',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN_KEY_CONSTRAINT',
  DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  CONCURRENT_LIMIT_EXCEEDED: 'CONCURRENT_LIMIT_EXCEEDED',

  // Content Moderation
  CONTENT_REJECTED: 'CONTENT_REJECTED',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  COPYRIGHT_VIOLATION: 'COPYRIGHT_VIOLATION',
  MODERATION_REQUIRED: 'MODERATION_REQUIRED',
} as const;

// Helper function to create standardized error responses
export function createErrorResponse(error: ApiError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  };
}

// Helper function to handle async errors
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      if (ApiError.isOperational(error)) {
        throw error;
      }
      
      // Convert non-operational errors to operational ones
      throw new ApiError(
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred',
        { originalError: error.message }
      );
    });
  };
}

// Helper to create validation error from Joi/Zod
export function createValidationError(details: any): ApiError {
  return new ApiError(
    400,
    ERROR_CODES.VALIDATION_ERROR,
    'Validation failed',
    details
  );
}

// Helper to create not found error for resources
export function createResourceNotFoundError(resource: string, id?: string): ApiError {
  const message = id 
    ? `${resource} with id '${id}' not found`
    : `${resource} not found`;
    
  return new ApiError(404, ERROR_CODES.NOT_FOUND, message);
}

// Helper to create permission error
export function createPermissionError(action: string, resource: string): ApiError {
  return new ApiError(
    403,
    ERROR_CODES.INSUFFICIENT_PERMISSIONS,
    `You don't have permission to ${action} ${resource}`
  );
}