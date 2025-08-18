/**
 * Application entry point
 * Handles startup, configuration loading, graceful shutdown, and error handling
 */

// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { validateEnvironment } from '../configs/env-validator';
import { createApp } from './app';
import { logStartup, logShutdown, logError, logInfo } from '@/utils/logger';

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
    logInfo('🔍 Validating environment configuration...');
    const config = validateEnvironment();
    
    // 2. Create Express application
    logInfo('⚙️ Creating Express application...');
    const app = createApp();
    
    // 3. Start HTTP server
    const port = parseInt(config.PORT, 10);
    const server = app.listen(port, () => {
      logStartup(port, config.NODE_ENV, config.OTEL_SERVICE_VERSION);
      
      // Log available endpoints
      logInfo('📡 Service endpoints available', {
        event: 'endpoints_ready',
        endpoints: [
          `http://localhost:${port}/`,
          `http://localhost:${port}/health`,
          `http://localhost:${port}/health/ready`,
          `http://localhost:${port}/health/live`,
          ...(config.ENABLE_DEBUG_ROUTES ? [
            `http://localhost:${port}/debug/config`,
            `http://localhost:${port}/debug/env`
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
      
      // Perform additional cleanup here if needed
      // - Close database connections
      // - Flush logs
      // - Clean up resources
      
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
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logError(error, {
      event: 'startup_error'
    });
    process.exit(1);
  });
}

// Export for testing
export { startServer };
