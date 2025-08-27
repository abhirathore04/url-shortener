/**
 * Server Entry Point with Database Initialization
 * Learning: Production-ready server startup with database connection
 */

import http from 'http';

import dotenv from 'dotenv';
import express from 'express';

import { createApp } from './app';
import { DatabaseManager } from './database/connection';
import { logError, logInfo, logStartup } from './utils/logger';

// Load environment variables first
dotenv.config();

class Server {
  private server: http.Server;
  public app: express.Application;
  private port: number;
  private isShuttingDown = false;
  private dbManager: DatabaseManager;

  constructor() {
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.app = createApp();
    this.server = http.createServer(this.app);
    this.dbManager = DatabaseManager.getInstance();
    this.setupGracefulShutdown();
  }

  public async start(): Promise<void> {
    try {
      // ✅ INITIALIZE DATABASE FIRST
      logInfo('Initializing database connection...');
      await this.dbManager.connect();
      logInfo('Database initialized successfully');

      return new Promise((resolve, reject) => {
        this.server.listen(this.port, (error?: Error) => {
          if (error) {
            logError(error, { event: 'server_start_failed', port: this.port });
            return reject(error);
          }

          const environment = process.env.NODE_ENV || 'development';
          const version = process.env.npm_package_version || '1.0.0';

          logStartup(this.port, environment, version);

          // eslint-disable-next-line no-console
          console.info(`
🚀 URL Shortener API Server Started Successfully!

📍 Server Details:
   • Port: ${this.port}
   • Environment: ${environment}
   • Version: ${version}
   • Process ID: ${process.pid}
   • Base URL: ${process.env.BASE_URL || `http://localhost:${this.port}`}

💾 Database:
   • Status: Connected ✅
   • Path: ${process.env.DB_PATH || './data/shortener.db'}
   • Type: SQLite

🔗 API Endpoints:
   • POST /api/v1/urls              - Create short URL
   • GET  /:shortCode               - Redirect to original URL
   • GET  /api/v1/urls/:shortCode/analytics - Get analytics
   • DELETE /api/v1/urls/:shortCode - Delete URL
   • GET  /health                   - Health check

📊 Ready to handle millions of URL shortening requests!
          `);

          resolve();
        });

        // Handle server errors
        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            logError(new Error(`Port ${this.port} is already in use`), {
              event: 'port_in_use',
              port: this.port,
            });
          } else {
            logError(error, { event: 'server_error' });
          }
          reject(error);
        });
      });
    } catch (error) {
      logError(error as Error, { event: 'startup_failed' });
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;

    signals.forEach((signal) => {
      process.on(signal, () => {
        if (this.isShuttingDown) {
          logInfo(`${signal} received again, forcing shutdown...`);
          process.exit(1);
        }

        this.isShuttingDown = true;
        logInfo(`${signal} signal received, initiating graceful shutdown...`);
        this.shutdown(signal);
      });
    });

    process.on('uncaughtException', (error: Error) => {
      logError(error, { event: 'uncaught_exception' });
      // eslint-disable-next-line no-console
      console.error('Uncaught Exception:', error);
      this.shutdown('uncaughtException', 1);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      const error = new Error(`Unhandled Rejection: ${reason}`);
      logError(error, { event: 'unhandled_rejection', promise: promise.toString() });
      // eslint-disable-next-line no-console
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection', 1);
    });
  }

  private async shutdown(signal: string, exitCode = 0): Promise<void> {
    const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT || '10000', 10);

    logInfo(`Shutting down server due to ${signal}...`, {
      event: 'shutdown_initiated',
      signal,
      timeout: shutdownTimeout,
    });

    const forceShutdownTimer = setTimeout(() => {
      logError(new Error('Forced shutdown due to timeout'), {
        event: 'forced_shutdown',
        timeout: shutdownTimeout,
      });
      process.exit(1);
    }, shutdownTimeout);

    try {
      // ✅ CLOSE DATABASE CONNECTION GRACEFULLY
      await this.dbManager.close();

      // Close HTTP server
      this.server.close((error) => {
        clearTimeout(forceShutdownTimer);
        if (error) {
          logError(error, { event: 'shutdown_error' });
          process.exit(1);
        } else {
          logInfo('Server and database closed successfully', { event: 'shutdown_complete' });
          process.exit(exitCode);
        }
      });
    } catch (error) {
      clearTimeout(forceShutdownTimer);
      logError(error as Error, { event: 'shutdown_error' });
      process.exit(1);
    }
  }

  public getServer(): http.Server {
    return this.server;
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the server
async function startServer(): Promise<void> {
  try {
    const server = new Server();
    await server.start();
    logInfo('Application startup completed successfully', {
      event: 'application_ready',
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    });
  } catch (error) {
    logError(error as Error, { event: 'startup_failed' });
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { Server };
export default Server;
