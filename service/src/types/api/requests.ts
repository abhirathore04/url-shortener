/**
 * API Request Types
 * Learning: HTTP request interfaces for type safety
 */

export interface CreateUrlRequest {
  url: string;
  customAlias?: string;
  expiresAt?: string;
  description?: string;
}

export interface UrlAnalyticsQuery {
  startDate?: string;
  endDate?: string;
  includeClicks?: boolean;
}

export interface GetUrlsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'created' | 'clicks' | 'updated';
  sortOrder?: 'asc' | 'desc';
}
