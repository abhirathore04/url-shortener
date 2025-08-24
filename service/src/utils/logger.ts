/**
 * Structured logging utility using Pino
 */
import pino from 'pino';

// Create transport configuration conditionally
const createTransport = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    };
  }
  return undefined;
};

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: createTransport(),
  }),
});

export default logger;

export const logApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Record<string, unknown>
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  const logData = { method, path, statusCode, duration };

  // Safely merge context to avoid object injection
  if (context && typeof context === 'object') {
    Object.assign(logData, context);
  }

  logger[level](logData, `${method} ${path} - ${statusCode} (${duration}ms)`);
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  const logData: Record<string, unknown> = { err: error };

  // Safely merge context to avoid object injection
  if (context && typeof context === 'object') {
    Object.assign(logData, context);
  }

  logger.error(logData, error.message);
};

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(context && typeof context === 'object' ? context : {}, message);
};

export const logStartup = (port: number, env: string, version: string) => {
  logInfo('🚀 Server started successfully', { port, env, version });
};

export const logShutdown = (signal: string) => {
  logInfo('👋 Server shutting down gracefully', { signal });
};
