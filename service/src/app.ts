/**
 * Express application configuration
 * Sets up middleware, routes, and error handling in the correct order
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogging, debugLogging } from './middleware/logging';
import { errorHandler, notFoundHandler } from './middleware/error';
import healthRouter from './routes/health';
import { logInfo } from './utils/logger';

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
        environment: process.env.NODE_ENV,
        container: {
          hostname: process.env.HOSTNAME || 'localhost',
          platform: process.platform,
          nodeVersion: process.version
        },
        endpoints: {
          health: '/health',
          ready: '/health/ready',
          live: '/health/live',
          metrics: '/metrics'
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  });

  // Prometheus metrics endpoint
  if (process.env.ENABLE_METRICS_ENDPOINT === 'true') {
    app.get('/metrics', (req, res) => {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      const metrics = [
        '# HELP nodejs_version_info Node.js version info',
        '# TYPE nodejs_version_info gauge',
        `nodejs_version_info{version="${process.version}",major="${process.versions.node.split('.')[0]}"} 1`,
        '',
        '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds',
        '# TYPE process_cpu_user_seconds_total counter',
        `process_cpu_user_seconds_total ${process.cpuUsage().user / 1000000}`,
        '',
        '# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds',
        '# TYPE process_cpu_system_seconds_total counter',
        `process_cpu_system_seconds_total ${process.cpuUsage().system / 1000000}`,
        '',
        '# HELP process_resident_memory_bytes Resident memory size in bytes',
        '# TYPE process_resident_memory_bytes gauge',
        `process_resident_memory_bytes ${process.memoryUsage().rss}`,
        '',
        '# HELP process_heap_bytes Heap memory size in bytes',
        '# TYPE process_heap_bytes gauge',
        `process_heap_bytes ${process.memoryUsage().heapUsed}`,
        '',
        '# HELP process_start_time_seconds Start time of the process since unix epoch',
        '# TYPE process_start_time_seconds gauge',
        `process_start_time_seconds ${Math.floor(Date.now() / 1000) - Math.floor(process.uptime())}`,
        ''
      ].join('\n');

      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
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
