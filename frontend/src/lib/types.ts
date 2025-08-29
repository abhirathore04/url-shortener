export interface ShortenedUrl {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  customAlias?: string;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateUrlRequest {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface UrlAnalytics {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
  lastAccessed?: string;
}
