/**
 * URL Service - Core Business Logic (CLEAN VERSION)
 * Learning: Service layer patterns, business rules, database operations
 */

import { DatabaseManager } from '../database/connection';
import {
  URLRecord,
  ShortenUrlRequest,
  ShortenUrlResponse,
  UrlAnalytics,
} from '../models/url.model';

import { EncodingService } from './encoding.service';
import { logInfo, logError } from '../utils/logger';

export class UrlService {
  private db = DatabaseManager.getInstance().getDatabase();
  private encodingService = new EncodingService();

  /**
   * Shorten a URL with collision detection and validation
   */
  async shortenUrl(request: ShortenUrlRequest): Promise<ShortenUrlResponse> {
    const { originalUrl, customAlias, userId, expiresAt } = request;

    // Validate URL format
    if (!this.isValidUrl(originalUrl)) {
      throw new Error('Invalid URL provided');
    }

    // Check for existing URL
    const existing = await this.findExistingUrl(originalUrl, userId);
    if (existing) {
      return this.formatResponse(existing);
    }

    // Handle custom alias validation
    if (customAlias) {
      if (!this.encodingService.isValidAlias(customAlias)) {
        throw new Error('Invalid custom alias format');
      }

      const aliasExists = await this.checkAliasExists(customAlias);
      if (aliasExists) {
        throw new Error('Custom alias already taken');
      }
    }

    // Generate unique short code
    const shortCode = await this.generateUniqueShortCode();

    // Create URL record
    const now = new Date();
    const result = await this.db.run(
      `INSERT INTO urls (
        short_code, original_url, custom_alias, user_id, expires_at,
        click_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shortCode,
        originalUrl,
        customAlias || null,
        userId || null,
        expiresAt?.toISOString() || null,
        0,
        1,
        now.toISOString(),
        now.toISOString(),
      ]
    );

    const urlRecord: URLRecord = {
      id: result.lastID as number,
      shortCode,
      originalUrl,
      customAlias,
      userId,
      expiresAt,
      clickCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    logInfo('URL shortened successfully', {
      shortCode,
      id: result.lastID,
      originalUrl: originalUrl.substring(0, 50) + '...',
    });

    return this.formatResponse(urlRecord);
  }

  /**
   * Expand short URL and track analytics
   */
  async expandUrl(shortCode: string): Promise<string> {
    if (
      !this.encodingService.isValidShortCode(shortCode) &&
      !this.encodingService.isValidAlias(shortCode)
    ) {
      throw new Error('Invalid short code format');
    }

    // Find URL record (database uses snake_case)
    const urlRecord = await this.db.get<any>(
      `SELECT * FROM urls 
       WHERE (short_code = ? OR custom_alias = ?) 
       AND is_active = 1`,
      [shortCode, shortCode]
    );

    if (!urlRecord) {
      throw new Error('Short URL not found');
    }

    // Check expiration
    if (urlRecord.expires_at && new Date() > new Date(urlRecord.expires_at)) {
      throw new Error('Short URL has expired');
    }

    // Update analytics asynchronously
    this.updateAnalytics(urlRecord.id).catch((error) => {
      logError(error, { shortCode, event: 'analytics_update_failed' });
    });

    return urlRecord.original_url;
  }

  /**
   * Get URL analytics
   */
  async getAnalytics(shortCode: string): Promise<UrlAnalytics> {
    const urlRecord = await this.db.get<any>(
      `SELECT * FROM urls 
       WHERE (short_code = ? OR custom_alias = ?) 
       AND is_active = 1`,
      [shortCode, shortCode]
    );

    if (!urlRecord) {
      throw new Error('Short URL not found');
    }

    return {
      shortCode: urlRecord.short_code,
      originalUrl: urlRecord.original_url,
      clickCount: urlRecord.click_count,
      createdAt: new Date(urlRecord.created_at),
      lastAccessed: urlRecord.last_accessed ? new Date(urlRecord.last_accessed) : undefined,
    };
  }

  /**
   * Generate unique short code with collision detection
   */
  private async generateUniqueShortCode(): Promise<string> {
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const shortCode = this.encodingService.generateShortCode();

      const existing = await this.db.get('SELECT id FROM urls WHERE short_code = ?', [shortCode]);

      if (!existing) {
        return shortCode;
      }

      logInfo('Short code collision detected, retrying', { shortCode, attempt });
    }

    throw new Error('Unable to generate unique short code after maximum retries');
  }

  /**
   * Update analytics for URL access
   */
  private async updateAnalytics(urlId: number): Promise<void> {
    await this.db.run(
      `UPDATE urls 
       SET click_count = click_count + 1, 
           last_accessed = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [urlId]
    );
  }

  /**
   * Helper methods
   */
  private async findExistingUrl(
    originalUrl: string,
    userId?: number
  ): Promise<URLRecord | undefined> {
    const result = await this.db.get<any>(
      `SELECT * FROM urls 
       WHERE original_url = ? 
       AND user_id ${userId ? '= ?' : 'IS NULL'} 
       AND is_active = 1`,
      userId ? [originalUrl, userId] : [originalUrl]
    );

    if (!result) return undefined;

    // Map database snake_case to TypeScript camelCase
    return {
      id: result.id,
      shortCode: result.short_code,
      originalUrl: result.original_url,
      customAlias: result.custom_alias,
      userId: result.user_id,
      clickCount: result.click_count,
      lastAccessed: result.last_accessed ? new Date(result.last_accessed) : undefined,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
      expiresAt: result.expires_at ? new Date(result.expires_at) : undefined,
      isActive: result.is_active === 1,
    };
  }

  private async checkAliasExists(alias: string): Promise<boolean> {
    const result = await this.db.get('SELECT id FROM urls WHERE custom_alias = ?', [alias]);
    return !!result;
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  private formatResponse(urlRecord: URLRecord): ShortenUrlResponse {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    return {
      shortCode: urlRecord.shortCode,
      shortUrl: `${baseUrl}/${urlRecord.customAlias || urlRecord.shortCode}`,
      originalUrl: urlRecord.originalUrl,
      customAlias: urlRecord.customAlias,
      expiresAt: urlRecord.expiresAt,
      createdAt: urlRecord.createdAt,
    };
  }
}
