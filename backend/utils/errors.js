// Custom error classes for better error handling
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error response formatter
export const formatErrorResponse = (error) => {
  const response = {
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // Add details for validation errors
  if (error.details) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
};

// Global error handler middleware
export const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let response = formatErrorResponse(error);

  // Log the error
  const { logger } = require('./logger.js');
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    response = formatErrorResponse(new ValidationError('Validation failed', error.errors));
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    response = formatErrorResponse(new ValidationError('Invalid data format'));
  }

  if (error.code === 11000) {
    statusCode = 409;
    response = formatErrorResponse(new ConflictError('Duplicate entry'));
  }

  res.status(statusCode).json(response);
};
