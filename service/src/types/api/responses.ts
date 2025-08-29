/**
 * API Response Types
 * Learning: Standardized response interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface CreateUrlResponse {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  customAlias?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UrlAnalyticsResponse {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  createdAt: string;
  lastAccessed?: string;
}

export interface ClickHistory {
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
