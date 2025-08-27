/**
 * Enhanced URL Service with API Integration
 * Learning: Extended business logic for API requirements
 */

import { DatabaseManager } from '../database/connection';
import { ShortenUrlRequest, ShortenUrlResponse, UrlAnalytics } from '../models/url.model';
import { EncodingService } from './encoding.service';
import { validateUrl } from '../utils/helpers';
import { logError, logInfo } from '../utils/logger';

interface ClickTrackingData {
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
}

export class UrlService {
  private dbManager: DatabaseManager;
  private encodingService: EncodingService;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.encodingService = new EncodingService();
  }

  async shortenUrl(request: ShortenUrlRequest): Promise<ShortenUrlResponse> {
    // Validate URL first - before any database operations
    if (!validateUrl(request.originalUrl)) {
      throw new Error('Invalid URL provided');
    }

    const db = this.dbManager.getDatabase();
    
    try {
      // Check for existing URL
      const existingUrl = await db.get(
        'SELECT * FROM urls WHERE original_url = ? AND is_active = 1',
        [request.originalUrl]
      );

      if (existingUrl) {
        return {
          id: existingUrl.id,
          shortCode: existingUrl.short_code,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${existingUrl.short_code}`,
          originalUrl: existingUrl.original_url,
          customAlias: existingUrl.custom_alias,
          createdAt: new Date(existingUrl.created_at).toISOString(),
          expiresAt: existingUrl.expires_at ? new Date(existingUrl.expires_at).toISOString() : undefined
        };
      }

      // Check if custom alias is taken
      if (request.customAlias) {
        const existingAlias = await db.get(
          'SELECT id FROM urls WHERE (short_code = ? OR custom_alias = ?) AND is_active = 1',
          [request.customAlias, request.customAlias]
        );
        
        if (existingAlias) {
          throw new Error('Custom alias already taken');
        }
      }

      // Generate new short code with collision detection
      let shortCode: string;
      let attempts = 0;
      const maxAttempts = 5;

      do {
        shortCode = request.customAlias || this.encodingService.generateShortCode();
        const existing = await db.get(
          'SELECT id FROM urls WHERE short_code = ? OR custom_alias = ?',
          [shortCode, shortCode]
        );
        
        if (!existing) break;
        
        if (request.customAlias) {
          throw new Error('Custom alias already taken');
        }
        
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique short code');
      }

      // Insert new URL
      const result = await db.run(`
        INSERT INTO urls (short_code, original_url, custom_alias, expires_at, created_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 1)
      `, [
        shortCode,
        request.originalUrl,
        request.customAlias || null,
        request.expiresAt ? new Date(request.expiresAt).toISOString() : null
      ]);

      logInfo('Short URL created', {
        shortCode,
        originalUrl: request.originalUrl,
        id: result.lastID
      });

      return {
        id: result.lastID!,
        shortCode,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${shortCode}`,
        originalUrl: request.originalUrl,
        customAlias: request.customAlias,
        createdAt: new Date().toISOString(),
        expiresAt: request.expiresAt 
          ? (request.expiresAt instanceof Date 
              ? request.expiresAt.toISOString() 
              : request.expiresAt)
          : undefined
      };

    } catch (error) {
      logError(error as Error, { originalUrl: request.originalUrl });
      throw error;
    }
  }

  async expandUrl(shortCode: string): Promise<string> {
    const db = this.dbManager.getDatabase();
    
    try {
      const urlRecord = await db.get(`
        SELECT * FROM urls 
        WHERE (short_code = ? OR custom_alias = ?) 
        AND is_active = 1
      `, [shortCode, shortCode]);

      if (!urlRecord) {
        throw new Error('Short URL not found');
      }

      // Check expiration
      if (urlRecord.expires_at && new Date(urlRecord.expires_at) < new Date()) {
        throw new Error('Short URL has expired');
      }

      return urlRecord.original_url;
    } catch (error) {
      logError(error as Error, { shortCode });
      throw error;
    }
  }

  async trackClick(shortCode: string, trackingData: ClickTrackingData): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    try {
      // Update click count and last accessed time
      await db.run(`
        UPDATE urls 
        SET click_count = click_count + 1, 
            last_accessed = datetime('now'),
            updated_at = datetime('now')
        WHERE (short_code = ? OR custom_alias = ?) AND is_active = 1
      `, [shortCode, shortCode]);

      logInfo('Click tracked', {
        shortCode,
        userAgent: trackingData.userAgent?.substring(0, 100),
        referrer: trackingData.referrer
      });
      
    } catch (error) {
      logError(error as Error, { shortCode, trackingData });
      // Don't throw error for analytics - shouldn't block redirect
    }
  }

  async getAnalytics(shortCode: string): Promise<UrlAnalytics> {
    const db = this.dbManager.getDatabase();
    
    try {
      const urlRecord = await db.get(`
        SELECT * FROM urls 
        WHERE (short_code = ? OR custom_alias = ?) 
        AND is_active = 1
      `, [shortCode, shortCode]);

      if (!urlRecord) {
        throw new Error('Short URL not found');
      }

      return {
        shortCode: urlRecord.short_code,
        originalUrl: urlRecord.original_url,
        clickCount: urlRecord.click_count || 0,
        createdAt: new Date(urlRecord.created_at).toISOString(),
        lastAccessed: urlRecord.last_accessed ? new Date(urlRecord.last_accessed).toISOString() : undefined
      };
    } catch (error) {
      logError(error as Error, { shortCode });
      throw error;
    }
  }

  async deleteUrl(shortCode: string): Promise<void> {
    const db = this.dbManager.getDatabase();
    
    try {
      const result = await db.run(`
        UPDATE urls 
        SET is_active = 0, updated_at = datetime('now')
        WHERE (short_code = ? OR custom_alias = ?) AND is_active = 1
      `, [shortCode, shortCode]);

      if (result.changes === 0) {
        throw new Error('Short URL not found');
      }

      logInfo('URL deleted', { shortCode });
    } catch (error) {
      logError(error as Error, { shortCode });
      throw error;
    }
  }
}
