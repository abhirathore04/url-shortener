/**
 * Request Validation Middleware
 * Learning: Input validation and sanitization for API security
 */

import { Request, Response, NextFunction } from 'express';

import { validateUrl } from '../utils/helpers';

interface ValidationError {
  field: string;
  message: string;
}

// ✅ FIXED: Removed explicit return type and simplified control flow
export const validateCreateUrl = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { url, customAlias, expiresAt } = req.body;

  // URL validation
  if (!url) {
    errors.push({ field: 'url', message: 'URL is required' });
  } else if (typeof url !== 'string') {
    errors.push({ field: 'url', message: 'URL must be a string' });
  } else if (!validateUrl(url)) {
    errors.push({ field: 'url', message: 'Invalid URL format' });
  } else if (url.length > 2048) {
    errors.push({ field: 'url', message: 'URL too long (max 2048 characters)' });
  }

  // Custom alias validation
  if (customAlias) {
    if (typeof customAlias !== 'string') {
      errors.push({ field: 'customAlias', message: 'Custom alias must be a string' });
    } else if (customAlias.length < 3) {
      errors.push({ field: 'customAlias', message: 'Custom alias must be at least 3 characters' });
    } else if (customAlias.length > 50) {
      errors.push({ field: 'customAlias', message: 'Custom alias too long (max 50 characters)' });
    } else if (!/^[a-zA-Z0-9-_]+$/.test(customAlias)) {
      errors.push({ field: 'customAlias', message: 'Custom alias can only contain letters, numbers, hyphens, and underscores' });
    }
  }

  // Expiration date validation
  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    if (isNaN(expirationDate.getTime())) {
      errors.push({ field: 'expiresAt', message: 'Invalid expiration date format' });
    } else if (expirationDate <= new Date()) {
      errors.push({ field: 'expiresAt', message: 'Expiration date must be in the future' });
    }
  }

  // ✅ FIXED: Send error response and return (no explicit return type needed)
  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: 'Please check the provided data'
      },
      data: { errors },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
    return; // ✅ Early return after sending response
  }

  // Continue to next middleware
  next();
};

// ✅ FIXED: Removed explicit return type and simplified control flow
export const validateShortCode = (req: Request, res: Response, next: NextFunction) => {
  const { shortCode } = req.params;

  if (!shortCode) {
    res.status(400).json({
      success: false,
      message: 'Short code is required',
      error: {
        code: 'MISSING_SHORT_CODE'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
    return; // ✅ Early return after sending response
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(shortCode)) {
    res.status(400).json({
      success: false,
      message: 'Invalid short code format',
      error: {
        code: 'INVALID_SHORT_CODE'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
    return; // ✅ Early return after sending response
  }

  // Continue to next middleware
  next();
};
