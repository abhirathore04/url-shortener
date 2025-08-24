/**
 * Global error handling middleware
 */
import { Request, Response, NextFunction } from 'express';

import { ApiResponse } from '../types/config';
import { logError } from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(statusCode: number, code: string, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Main error handler middleware
export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  logError(error, {
    method: req.method,
    path: req.path,
  });

  const isApiError = error instanceof ApiError;
  const statusCode = isApiError ? error.statusCode : 500;

  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: isApiError ? error.code : 'INTERNAL_ERROR',
      message: isApiError ? error.message : 'An internal error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.OTEL_SERVICE_VERSION || '0.1.0',
    },
  };

  res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.OTEL_SERVICE_VERSION || '0.1.0',
    },
  };

  res.status(404).json(response);
};

// Async error wrapper
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
