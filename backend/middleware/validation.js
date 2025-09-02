import { body, param, query, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

// Chat validation rules
export const validateChatStart = [
  body('initialMessage')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Initial message must be between 1 and 1000 characters')
    .trim()
    .escape()
];

export const validateChatMessage = [
  body('chatId')
    .notEmpty()
    .withMessage('Chat ID is required')
    .isUUID()
    .withMessage('Invalid chat ID format'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .trim()
    .escape()
];

export const validateChatHistory = [
  param('chatId')
    .notEmpty()
    .withMessage('Chat ID is required')
    .isUUID()
    .withMessage('Invalid chat ID format')
];

export const validateLegalResources = [
  body('query')
    .notEmpty()
    .withMessage('Query is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Query must be between 3 and 500 characters')
    .trim()
    .escape()
];

// Voice validation rules
export const validateVoiceProcess = [
  body('chatId')
    .optional()
    .isUUID()
    .withMessage('Invalid chat ID format')
];

// General sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs in body
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};
