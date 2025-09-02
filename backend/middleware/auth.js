import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'CONFIG_ERROR'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};
