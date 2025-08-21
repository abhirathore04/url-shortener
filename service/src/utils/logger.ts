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
        ignore: 'pid,hostname'
      }
    };
  }
  return undefined;
};

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: createTransport()
  })
});

export default logger;

export const logApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: any
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level]({ method, path, statusCode, duration, ...context },
    `${method} ${path} - ${statusCode} (${duration}ms)`);
};

export const logError = (error: Error, context?: any) => {
  logger.error({ err: error, ...context }, error.message);
};

export const logInfo = (message: string, context?: any) => {
  logger.info(context, message);
};

export const logStartup = (port: number, env: string, version: string) => {
  logInfo('🚀 Server started successfully', { port, env, version });
};

export const logShutdown = (signal: string) => {
  logInfo('👋 Server shutting down gracefully', { signal });
};
