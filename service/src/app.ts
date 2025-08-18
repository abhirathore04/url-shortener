/**
 * Express application configuration
 * Sets up middleware, routes, and error handling in the correct order
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogging, debugLogging } from '@/middleware/logging';
import { errorHandler, notFoundHandler } from '@/middleware/error';
import healthRouter from '@/routes/health';
import { logInfo } from '@/utils/logger';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy headers (important for deployment behind load balancers)
  app.set('trust proxy', true);

  // Security middleware - should be first
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false // Allow embedding for development
  }));

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:8080'];
    
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (corsOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Compression middleware
  app.use(compression({
    filter: (req, res) => {
      // Don't compress if no-transform cache-control header is set
      if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
        return false;
      }
      // Use default compression filter
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
    threshold: 1024 // Only compress responses larger than 1KB
  }));

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    type: ['application/json', 'text/plain'] 
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Custom middleware
  app.use(requestLogging);
  if (process.env.LOG_LEVEL === 'debug') {
    app.use(debugLogging);
  }

  // Routes
  app.use('/health', healthRouter);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        service: 'URL Shortener',
        version: process.env.OTEL_SERVICE_VERSION || '0.1.0',
        status: 'running',
        endpoints: {
          health: '/health',
          ready: '/health/ready',
          live: '/health/live'
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  });

  // Debug routes (only in development)
  if (process.env.ENABLE_DEBUG_ROUTES === 'true') {
    app.get('/debug/config', (req, res) => {
      // Only show safe configuration values
      const safeConfig = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        LOG_LEVEL: process.env.LOG_LEVEL,
        OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
        OTEL_SERVICE_VERSION: process.env.OTEL_SERVICE_VERSION,
        ENABLE_DEBUG_ROUTES: process.env.ENABLE_DEBUG_ROUTES,
        CORS_ORIGINS: process.env.CORS_ORIGINS,
        timestamp: new Date().toISOString()
      };
      res.json({ config: safeConfig });
    });

    app.get('/debug/env', (req, res) => {
      // Show all environment variables (excluding secrets)
      const envVars = Object.keys(process.env)
        .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY'))
        .reduce((obj, key) => {
          obj[key] = process.env[key];
          return obj;
        }, {} as Record<string, string | undefined>);
      
      res.json({ env: envVars });
    });
  }

  // Error handling (MUST be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  logInfo('Express application configured successfully', {
    event: 'app_configured',
    corsOrigins: corsOrigins.length,
    debugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true'
  });

  return app;
}
