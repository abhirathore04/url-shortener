/**
 * Global Error Handling Middleware
 * Learning: Centralized error handling for consistent API responses
 */

import { NextFunction, Request, Response } from 'express';

import { logError } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error for debugging
  logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.message === 'Short URL not found') {
    statusCode = 404;
    code = 'URL_NOT_FOUND';
  } else if (err.message === 'Custom alias already taken') {
    statusCode = 409;
    code = 'ALIAS_CONFLICT';
  } else if (err.message === 'Short URL has expired') {
    statusCode = 410;
    code = 'URL_EXPIRED';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  });
};

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: {
      code: 'NOT_FOUND',
      details: `The endpoint ${req.method} ${req.path} does not exist`
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  });
};
