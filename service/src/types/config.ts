/**
 * Type definitions for application configuration and API responses
 */

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface LogContext {
  [key: string]: unknown;
}

export interface RequestContext {
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  remoteAddr?: string;
  query?: Record<string, unknown>;
}

export interface AppConfig {
  PORT: string;
  NODE_ENV: string;
  LOG_LEVEL: string;
  MONGO_URI?: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string;
  OTEL_SERVICE_VERSION: string;
  ENABLE_DEBUG_ROUTES?: string;
  ENABLE_METRICS_ENDPOINT?: string;
}
