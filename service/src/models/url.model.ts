/**
 * URL Models and Interfaces
 * Learning: TypeScript interfaces, data modeling, API contracts
 */

export interface URLRecord {
  id: number;
  shortCode: string;
  originalUrl: string;
  customAlias?: string;
  userId?: number;
  clickCount: number;
  lastAccessed?: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  title?: string;
  description?: string;
  favicon?: string;
}

export interface ShortenUrlRequest {
  originalUrl: string;
  customAlias?: string;
  userId?: number;
  expiresAt?: Date;
}

export interface ShortenUrlResponse {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  customAlias?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface UrlAnalytics {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: Date;
  lastAccessed?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    version?: string;
  };
}

// Fixed SQL syntax
export const CREATE_URL_TABLE = `
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    custom_alias VARCHAR(50) UNIQUE,
    user_id INTEGER,
    click_count INTEGER DEFAULT 0,
    last_accessed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    title VARCHAR(255),
    description TEXT,
    favicon VARCHAR(255)
  );

  CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
  CREATE INDEX IF NOT EXISTS idx_custom_alias ON urls(custom_alias);
  CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);
  CREATE INDEX IF NOT EXISTS idx_created_at ON urls(created_at);
`;
