/**
 * Application entry point
 * Handles startup, configuration loading, graceful shutdown, and error handling
 */
import { Server } from 'http';

import dotenv from 'dotenv';

import { createApp } from './app';
import { validateEnvironment } from './configs/env-validator';
import { logStartup, logShutdown, logError, logInfo } from './utils/logger';

// Global error handlers for uncaught exceptions
const setupGlobalErrorHandlers = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logError(new Error('Unhandled Rejection'), {
      event: 'unhandled_rejection',
      reason: reason instanceof Error ? reason.message : String(reason),
      promise: String(promise),
    });
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logError(error, {
      event: 'uncaught_exception',
    });
    process.exit(1);
  });
};

// Graceful shutdown handling
const setupGracefulShutdown = (server: Server) => {
  const gracefulShutdown = (signal: string) => {
    logShutdown(signal);

    server.close((err: Error | undefined) => {
      if (err) {
        logError(err, {
          event: 'shutdown_error',
        });
        process.exit(1);
      }

      logInfo('✅ Server closed successfully', {
        event: 'server_closed',
      });
      process.exit(0);
    });

    // Force shutdown after timeout
    const shutdownTimeout = setTimeout(() => {
      logError(new Error('❌ Forced shutdown after 30 seconds timeout'), {
        event: 'forced_shutdown',
      });
      process.exit(1);
    }, 30000);

    shutdownTimeout.unref();
  };

  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
};

// Main startup function
const startServer = async (): Promise<Server> => {
  try {
    // Load environment variables in non-production
    if (process.env.NODE_ENV !== 'production') {
      try {
        dotenv.config();
        // eslint-disable-next-line no-console
        console.log('✅ .env file loaded');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('⚠️ .env file not found, using environment variables from container');
      }
    }

    // 1. Validate environment configuration
    const config = validateEnvironment();

    // 2. Create Express application
    const app = createApp();

    // 3. Start HTTP server
    const port = parseInt(config.PORT, 10);

    const server = app.listen(port, '0.0.0.0', () => {
      logStartup(port, config.NODE_ENV, config.OTEL_SERVICE_VERSION);

      // Log available endpoints
      logInfo('📡 Service endpoints available', {
        event: 'endpoints_ready',
        endpoints: [
          `http://localhost:${port}/`,
          `http://localhost:${port}/health`,
          `http://localhost:${port}/health/ready`,
          `http://localhost:${port}/health/live`,
          ...(config.ENABLE_METRICS_ENDPOINT === 'true'
            ? [`http://localhost:${port}/metrics`]
            : []),
        ],
      });
    });

    // 4. Set up graceful shutdown
    setupGracefulShutdown(server);

    // 5. Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

      switch (error.code) {
        case 'EACCES':
          logError(new Error(`${bind} requires elevated privileges`));
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logError(new Error(`${bind} is already in use`));
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    return server;
  } catch (error) {
    logError(error as Error, {
      event: 'startup_failed',
    });
    process.exit(1);
  }
};

// Initialize application
const main = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('🚀 Starting URL Shortener server...');

    setupGlobalErrorHandlers();
    await startServer();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Critical startup error:', error);
    logError(error as Error, {
      event: 'startup_error',
    });
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('❌ Application failed to start:', error);
    process.exit(1);
  });
}

export { startServer, main };
