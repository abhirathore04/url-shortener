/**
 * HTTP request logging middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logApiRequest } from '@/utils/logger';

export const requestLogging = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end.bind(res);
  
  // Simple override using any casting to avoid complex type issues
  (res as any).end = (...args: any[]) => {
    const duration = Date.now() - startTime;
    
    // Extract useful request info
    const context = {
      userAgent: req.get('User-Agent'),
      remoteAddr: req.ip || req.connection?.remoteAddress,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    };
    
    // Log the request
    logApiRequest(req.method, req.path, res.statusCode, duration, context);
    
    // Call the original end function
    return originalEnd(...args);
  };
  
  next();
};

// Additional middleware for detailed request logging in debug mode
export const debugLogging = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.LOG_LEVEL === 'debug') {
    console.log('🔍 Debug Request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query
    });
  }
  next();
};
