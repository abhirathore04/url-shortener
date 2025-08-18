/**
 * Configuration type definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  checks?: {
    database?: 'ok' | 'down' | 'unknown';
    redis?: 'ok' | 'down' | 'unknown';
    [key: string]: string | undefined;
  };
}

export interface LogContext {
  event?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}
