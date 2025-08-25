/**
 * URL Models and Interfaces
 * Learning: TypeScript interfaces, data modeling, API contracts
 */

// =====================================
// DATABASE RECORD INTERFACES
// =====================================

export interface URLRecord {
  id: number;
  shortCode: string;
  originalUrl: string;
  customAlias?: string;
  userId?: number;
  clickCount: number;
  lastAccessed?: Date;
  createdAt: string;
  updatedAt: Date;
  expiresAt?: string;
  isActive: boolean;
  title?: string;
  description?: string;
  favicon?: string;
}

// =====================================
// SERVICE LAYER INTERFACES
// =====================================

export interface ShortenUrlRequest {
  originalUrl: string;
  customAlias?: string;
  userId?: number;
  expiresAt?: Date;
}

// ✅ FIXED: Added missing 'id' property and made dates strings for API responses
export interface ShortenUrlResponse {
  id: number;                    // ← ADDED: Required for API responses
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  customAlias?: string;
  expiresAt?: string;           // ← CHANGED: String for API consistency
  createdAt: string;            // ← CHANGED: String for API consistency
}

// ✅ FIXED: Made dates strings for API consistency
export interface UrlAnalytics {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;            // ← CHANGED: String for API consistency
  lastAccessed?: string;        // ← CHANGED: String for API consistency
}

// =====================================
// API RESPONSE WRAPPER
// =====================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;             // ← ADDED: Optional message field
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;           // ← ADDED: Optional details field
  };
  meta: {
    timestamp: string;
    version?: string;
    requestId?: string;         // ← ADDED: Request tracking
  };
}

// =====================================
// ADDITIONAL UTILITY INTERFACES
// =====================================

export interface ClickTrackingData {
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
  timestamp?: string;
}

export interface UrlMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: 'created' | 'clicks' | 'updated';
  sortOrder?: 'asc' | 'desc';
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

// =====================================
// INTERNAL SERVICE INTERFACES
// =====================================

export interface DatabaseUrlRecord {
  id: number;
  short_code: string;           // Database uses snake_case
  original_url: string;
  custom_alias?: string;
  user_id?: number;
  click_count: number;
  last_accessed?: string;       // SQLite returns string dates
  created_at: string;           // SQLite returns string dates
  updated_at: string;           // SQLite returns string dates
  expires_at?: string;          // SQLite returns string dates
  is_active: number;            // SQLite uses 0/1 for boolean
  title?: string;
  description?: string;
  favicon?: string;
}

// =====================================
// VALIDATION INTERFACES
// =====================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface CreateUrlValidation {
  url: string;
  customAlias?: string;
  expiresAt?: string;
  description?: string;
}

// =====================================
// DATABASE SCHEMA
// =====================================

// ✅ FIXED: Corrected SQL syntax and added proper constraints
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
    favicon VARCHAR(255),
    
    -- Add constraints
    CONSTRAINT chk_short_code_length CHECK (length(short_code) >= 4),
    CONSTRAINT chk_original_url_length CHECK (length(original_url) <= 2048),
    CONSTRAINT chk_custom_alias_length CHECK (length(custom_alias) >= 3)
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
  CREATE INDEX IF NOT EXISTS idx_custom_alias ON urls(custom_alias);
  CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);
  CREATE INDEX IF NOT EXISTS idx_created_at ON urls(created_at);
  CREATE INDEX IF NOT EXISTS idx_expires_at ON urls(expires_at);
  CREATE INDEX IF NOT EXISTS idx_is_active ON urls(is_active);
  
  -- Composite indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_short_code_active ON urls(short_code, is_active);
  CREATE INDEX IF NOT EXISTS idx_user_active ON urls(user_id, is_active);
`;

// =====================================
// HELPER FUNCTIONS FOR TYPE CONVERSION
// =====================================

/**
 * Convert database record to service response format
 */
export function dbRecordToResponse(dbRecord: DatabaseUrlRecord): ShortenUrlResponse {
  return {
    id: dbRecord.id,
    shortCode: dbRecord.short_code,
    shortUrl: `${process.env.BASE_URL}/${dbRecord.short_code}`,
    originalUrl: dbRecord.original_url,
    customAlias: dbRecord.custom_alias || undefined,
    createdAt: new Date(dbRecord.created_at).toISOString(),
    expiresAt: dbRecord.expires_at ? new Date(dbRecord.expires_at).toISOString() : undefined
  };
}

/**
 * Convert database record to analytics format
 */
export function dbRecordToAnalytics(dbRecord: DatabaseUrlRecord): UrlAnalytics {
  return {
    shortCode: dbRecord.short_code,
    originalUrl: dbRecord.original_url,
    clickCount: dbRecord.click_count,
    createdAt: new Date(dbRecord.created_at).toISOString(),
    lastAccessed: dbRecord.last_accessed ? new Date(dbRecord.last_accessed).toISOString() : undefined
  };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate short code format
 */
export function isValidShortCode(shortCode: string): boolean {
  return /^[a-zA-Z0-9-_]{4,10}$/.test(shortCode);
}

/**
 * Validate custom alias format
 */
export function isValidCustomAlias(alias: string): boolean {
  return /^[a-zA-Z0-9-_]{3,50}$/.test(alias);
}

// =====================================
// CONSTANTS
// =====================================

export const URL_CONSTRAINTS = {
  MAX_URL_LENGTH: 2048,
  MIN_SHORT_CODE_LENGTH: 4,
  MAX_SHORT_CODE_LENGTH: 10,
  MIN_CUSTOM_ALIAS_LENGTH: 3,
  MAX_CUSTOM_ALIAS_LENGTH: 50,
  DEFAULT_EXPIRATION_DAYS: 365,
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 500
} as const;

export const ERROR_CODES = {
  URL_NOT_FOUND: 'URL_NOT_FOUND',
  URL_EXPIRED: 'URL_EXPIRED',
  ALIAS_ALREADY_EXISTS: 'ALIAS_ALREADY_EXISTS',
  INVALID_URL_FORMAT: 'INVALID_URL_FORMAT',
  INVALID_ALIAS_FORMAT: 'INVALID_ALIAS_FORMAT',
  URL_TOO_LONG: 'URL_TOO_LONG',
  GENERATION_FAILED: 'GENERATION_FAILED'
} as const;

// =====================================
// TYPE GUARDS
// =====================================

export function isShortenUrlRequest(obj: any): obj is ShortenUrlRequest {
  return typeof obj === 'object' 
    && obj !== null 
    && typeof obj.originalUrl === 'string'
    && isValidUrl(obj.originalUrl);
}

export function isDatabaseUrlRecord(obj: any): obj is DatabaseUrlRecord {
  return typeof obj === 'object' 
    && obj !== null 
    && typeof obj.id === 'number'
    && typeof obj.short_code === 'string'
    && typeof obj.original_url === 'string';
}

// =====================================
// EXPORT TYPES FOR EXTERNAL USE
// =====================================

export type CreateUrlRequest = ShortenUrlRequest;
export type CreateUrlResponse = ShortenUrlResponse;
export type GetAnalyticsResponse = UrlAnalytics;
export type UrlListResponse = PaginatedResponse<ShortenUrlResponse>;

// Export for backward compatibility
export type { URLRecord as UrlRecord };
