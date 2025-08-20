/**
 * Application entry point
 * Handles startup, configuration loading, graceful shutdown, and error handling
 */

console.log('🔄 Container starting up...');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('Process ID:', process.pid);

// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';

// In containers, environment variables come from docker-compose
// Only try to load .env file in development
if (process.env.NODE_ENV !== 'production') {
  try {
    dotenv.config();
    console.log('✅ .env file loaded');
  } catch (error) {
    console.log('⚠️ .env file not found, using environment variables from container');
  }
}

// Log initial environment state
console.log('🔍 Initial environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGO_URI present:', !!process.env.MONGO_URI);
console.log('- JWT_SECRET present:', !!process.env.JWT_SECRET);
console.log('- OTEL_SERVICE_VERSION:', process.env.OTEL_SERVICE_VERSION);

try {
  // Import modules after environment setup
  console.log('📦 Loading application modules...');
  
  const { validateEnvironment } = require('./configs/env-validator');
  const { createApp } = require('./app');
  const { logStartup, logShutdown, logError, logInfo } = require('./utils/logger');

  console.log('✅ All imports successful');

  // Global error handlers for uncaught exceptions
  process.on('unhandledRejection', (reason, promise) => {
    logError(new Error('Unhandled Rejection'), {
      event: 'unhandled_rejection',
      reason: reason instanceof Error ? reason.message : String(reason),
      promise: String(promise)
    });
    // Exit gracefully
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logError(error, {
      event: 'uncaught_exception'
    });
    // Exit immediately - uncaught exceptions are dangerous
    process.exit(1);
  });

  // Main startup function
  async function startServer() {
    try {
      // 1. Validate environment configuration
      console.log('🔍 Starting environment validation...');
      const config = validateEnvironment();

      // 2. Create Express application
      console.log('⚙️ Creating Express application...');
      const app = createApp();

      // 3. Start HTTP server
      const port = parseInt(config.PORT, 10);
      console.log(`🚀 Starting server on port ${port}...`);
      
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
            ...(config.ENABLE_METRICS_ENDPOINT === 'true' ? [
              `http://localhost:${port}/metrics`
            ] : [])
          ]
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
      console.error('❌ Server startup failed:', error);
      logError(error as Error, {
        event: 'startup_failed'
      });
      process.exit(1);
    }
  }

  // Graceful shutdown handling
  function setupGracefulShutdown(server: any) {
    const gracefulShutdown = (signal: string) => {
      logShutdown(signal);

      // Stop accepting new connections
      server.close((err: Error) => {
        if (err) {
          logError(err, {
            event: 'shutdown_error'
          });
          process.exit(1);
        }

        logInfo('✅ Server closed successfully', {
          event: 'server_closed'
        });

        process.exit(0);
      });

      // Force shutdown after timeout
      const shutdownTimeout = setTimeout(() => {
        logError(new Error('❌ Forced shutdown after 30 seconds timeout'), {
          event: 'forced_shutdown'
        });
        process.exit(1);
      }, 30000);

      // Clear timeout if shutdown completes normally
      shutdownTimeout.unref();
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kubernetes/Docker stop
    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
  }

  // Start the server
  if (require.main === module) {
    console.log('🚀 Starting URL Shortener server...');
    startServer().catch((error) => {
      console.error('❌ Critical startup error:', error);
      logError(error, {
        event: 'startup_error'
      });
      process.exit(1);
    });
  }

} catch (error) {
  console.error('❌ Critical import or initialization error:', error);
  console.error('Stack trace:', (error as Error).stack);
  process.exit(1);
}
