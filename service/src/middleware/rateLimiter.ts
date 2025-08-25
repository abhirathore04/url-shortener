/**
 * Rate Limiting Middleware with Proper Trust Proxy Configuration
 * Learning: API protection against abuse with security considerations
 */

import rateLimit from 'express-rate-limit';

export const createRateLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: 'You have exceeded the maximum number of requests allowed'
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'rate-limited'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ FIX: Secure key generator for development
  keyGenerator: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return req.ip || 'unknown';
    }
    // In production, use more sophisticated key generation
    return `${req.ip}-${req.get('User-Agent')}` || 'unknown';
  },
  // ✅ FIX: Skip rate limiting for health checks
  skip: (req) => {
    return req.path.includes('/health');
  }
});

export const redirectRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 redirects per minute per IP
  message: {
    success: false,
    message: 'Too many redirect requests, please slow down',
    error: {
      code: 'REDIRECT_RATE_LIMIT_EXCEEDED'
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: 'rate-limited'
    }
  },
  skip: (req) => {
    return req.path.includes('/analytics');
  }
});
