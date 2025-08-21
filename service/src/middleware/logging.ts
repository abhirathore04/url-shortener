/**
 * HTTP request logging middleware
 */
import { Request, Response, NextFunction } from 'express';

import { logApiRequest } from '../utils/logger';

export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture response timing
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = Date.now() - startTime;

    // Extract useful request info
    const context = {
      userAgent: req.get('User-Agent'),
      remoteAddr: req.ip || req.connection?.remoteAddress,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
    };

    // Log the request
    logApiRequest(req.method, req.path, res.statusCode, duration, context);

    // Call the original end function with all arguments
    return originalEnd.apply(this, args as any);
  } as any;

  next();
};

// Additional middleware for detailed request logging in debug mode
export const debugLogging = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.LOG_LEVEL === 'debug') {
    // eslint-disable-next-line no-console
    console.log('🔍 Debug Request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
    });
  }
  next();
};
