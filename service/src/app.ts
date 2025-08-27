/**
 * Express Application Configuration with Swagger Documentation
 * Learning: Modular Express app setup with API documentation
 */

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { setupSwagger } from './docs/api/swagger.config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createRateLimiter } from './middleware/rateLimiter';
import healthRoutes from './routes/health';
import redirectRoutes from './routes/redirectRoutes';
import urlRoutes from './routes/urlRoutes';
import { logInfo } from './utils/logger';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy headers (important for deployment behind load balancers)
  app.set('trust proxy', true);

  // Security middleware - should be first
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for development
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  const corsOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5173'];

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Requested-With'],
  }));

  // Compression middleware
  app.use(compression({
    filter: (req, res) => {
      // Don't compress if no-transform cache-control header is set
      if (req.headers['cache-control']?.includes('no-transform')) {
        return false;
      }
      // Use default compression filter
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses larger than 1KB
  }));

  // Body parsing middleware
  app.use(express.json({
    limit: '10mb',
    type: ['application/json', 'text/plain'],
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '10mb',
  }));

  // Request ID middleware for tracing
  app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.headers['x-request-id'] = requestId;
    res.set('X-Request-ID', requestId);
    next();
  });

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      logInfo(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        requestId: req.headers['x-request-id'],
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        contentLength: res.get('Content-Length')
      });
    });

    next();
  });

  // Debug logging for development
  if (process.env.LOG_LEVEL === 'debug') {
    app.use((req, res, next) => {
      logInfo('Request details', {
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    });
  }

  // Rate limiting
  app.use(createRateLimiter);

  // Setup API Documentation
  setupSwagger(app);

  // Health check routes
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/v1/urls', urlRoutes);

  // Redirect routes (short URLs) - should be last
  app.use('/', redirectRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'URL Shortener API',
      data: {
        service: 'URL Shortener Service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        status: 'running',
        container: {
          hostname: process.env.HOSTNAME || 'localhost',
          platform: process.platform,
          nodeVersion: process.version,
        },
        endpoints: {
          health: '/health',
          ready: '/health/ready',
          live: '/health/live',
          api: '/api/v1/urls',
          documentation: '/api/docs',
          metrics: '/metrics',
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      }
    });
  });

  // Prometheus metrics endpoint
  if (process.env.ENABLE_METRICS_ENDPOINT === 'true') {
    app.get('/metrics', (req, res) => {
      const cpuUsage = process.cpuUsage();
      const memoryUsage = process.memoryUsage();
      
      const metrics = [
        '# HELP nodejs_version_info Node.js version info',
        '# TYPE nodejs_version_info gauge',
        `nodejs_version_info{version="${process.version}",major="${process.versions.node.split('.')[0]}"} 1`,
        '',
        '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds',
        '# TYPE process_cpu_user_seconds_total counter',
        `process_cpu_user_seconds_total ${cpuUsage.user / 1000000}`,
        '',
        '# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds',
        '# TYPE process_cpu_system_seconds_total counter',
        `process_cpu_system_seconds_total ${cpuUsage.system / 1000000}`,
        '',
        '# HELP process_resident_memory_bytes Resident memory size in bytes',
        '# TYPE process_resident_memory_bytes gauge',
        `process_resident_memory_bytes ${memoryUsage.rss}`,
        '',
        '# HELP process_heap_bytes Heap memory size in bytes',
        '# TYPE process_heap_bytes gauge',
        `process_heap_bytes ${memoryUsage.heapUsed}`,
        '',
        '# HELP process_start_time_seconds Start time of the process since unix epoch',
        '# TYPE process_start_time_seconds gauge',
        `process_start_time_seconds ${Math.floor(Date.now() / 1000) - Math.floor(process.uptime())}`,
        '',
        '# HELP process_uptime_seconds Process uptime in seconds',
        '# TYPE process_uptime_seconds gauge',
        `process_uptime_seconds ${process.uptime()}`,
        ''
      ].join('\n');

      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
    });
  }

  // Error handling middleware (MUST be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  logInfo('Express application configured successfully', {
    event: 'app_configured',
    corsOrigins: corsOrigins.length,
    environment: process.env.NODE_ENV,
    metricsEnabled: process.env.ENABLE_METRICS_ENDPOINT === 'true',
    debugMode: process.env.LOG_LEVEL === 'debug',
    documentationEnabled: true
  });

  return app;
}

export default createApp;
