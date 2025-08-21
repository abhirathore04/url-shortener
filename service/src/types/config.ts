/**
 * Type definitions for application configuration and API responses
 */

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface LogContext {
  [key: string]: any;
}

export interface RequestContext {
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  remoteAddr?: string;
  query?: any;
}

export interface AppConfig {
  PORT: string;
  NODE_ENV: string;
  LOG_LEVEL: string;
  MONGO_URI?: string;  // Made optional with ?
  JWT_SECRET: string;
  CORS_ORIGINS: string;
  OTEL_SERVICE_VERSION: string;
  ENABLE_DEBUG_ROUTES?: string;  // Made optional with ?
  ENABLE_METRICS_ENDPOINT?: string;  // Made optional with ?
}
