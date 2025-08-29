/**
 * URL shortening routes
 */
import fs from 'fs';
import path from 'path';

import { Router, Request, Response } from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

import { asyncHandler, ApiError } from '../middleware/error';
import { ApiResponse } from '../types/config';
import { generateShortCode, validateUrl, sanitizeInput } from '../utils/helpers';
import { logInfo, logError } from '../utils/logger';

const router = Router();

// Initialize SQLite database
let db: any;

const initDB = async () => {
  if (!db) {
    try {
      // Ensure data directory exists
      const dbPath = process.env.DB_PATH || './data/shortener.db';
      const dbDir = path.dirname(dbPath);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logInfo('Created data directory', { path: dbDir });
      }

      // Open database connection
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      logInfo('Database connection opened', { path: dbPath });

      // Create urls table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS urls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shortCode TEXT UNIQUE NOT NULL,
          originalUrl TEXT NOT NULL,
          customAlias TEXT,
          clickCount INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          expiresAt DATETIME,
          lastAccessed DATETIME
        )
      `);

      logInfo('Database table initialized successfully');
    } catch (error: any) {
      // ✅ Fixed: Added type annotation
      logError(new Error('Database initialization failed'), { error: error.message });
      throw error;
    }
  }
  return db;
};

// POST /api/v1/urls - Create short URL
router.post(
  '/urls',
  asyncHandler(async (req: Request, res: Response) => {
    const { originalUrl, customAlias, expiresAt } = req.body;

    // Validate required fields
    if (!originalUrl) {
      throw new ApiError(400, 'MISSING_URL', 'originalUrl is required');
    }

    // Sanitize and validate URL
    const cleanUrl = sanitizeInput(originalUrl);
    if (!validateUrl(cleanUrl)) {
      throw new ApiError(400, 'INVALID_URL', 'Please provide a valid URL');
    }

    // Generate or use custom short code
    let shortCode: string;
    if (customAlias) {
      const cleanAlias = sanitizeInput(customAlias);
      if (cleanAlias.length < 3) {
        throw new ApiError(400, 'INVALID_ALIAS', 'Custom alias must be at least 3 characters');
      }
      shortCode = cleanAlias;
    } else {
      shortCode = generateShortCode(7);
    }

    try {
      const database = await initDB();

      // Check if short code already exists
      const existing = await database.get('SELECT shortCode FROM urls WHERE shortCode = ?', [
        shortCode,
      ]);

      if (existing) {
        // If auto-generated, try again with different code
        if (!customAlias) {
          shortCode = generateShortCode(8);
          const existingRetry = await database.get(
            'SELECT shortCode FROM urls WHERE shortCode = ?',
            [shortCode]
          );
          if (existingRetry) {
            throw new ApiError(409, 'GENERATION_FAILED', 'Unable to generate unique short code');
          }
        } else {
          throw new ApiError(
            409,
            'ALIAS_EXISTS',
            'Short code already exists. Please choose a different alias.'
          );
        }
      }

      // Insert new URL
      const result = await database.run(
        `INSERT INTO urls (shortCode, originalUrl, customAlias, expiresAt) 
       VALUES (?, ?, ?, ?)`,
        [shortCode, cleanUrl, customAlias || null, expiresAt || null]
      );

      const shortUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/${shortCode}`;

      const response: ApiResponse<any> = {
        success: true,
        data: {
          id: result.lastID,
          shortCode,
          shortUrl,
          originalUrl: cleanUrl,
          customAlias: customAlias || null,
          clickCount: 0,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt || null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: process.env.OTEL_SERVICE_VERSION || '0.1.0',
        },
      };

      logInfo('URL shortened successfully', {
        shortCode,
        originalUrl: cleanUrl,
        customAlias: customAlias || null,
      });

      res.status(201).json(response);
    } catch (error: any) {
      // ✅ Fixed: Added type annotation
      // Log the actual database error for debugging
      logError(new Error('Database operation failed'), {
        originalError: error.message,
        stack: error.stack,
        shortCode,
        originalUrl: cleanUrl,
      });

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'DATABASE_ERROR', `Failed to create short URL: ${error.message}`);
    }
  })
);

// GET /api/v1/urls/:shortCode/analytics - Get URL analytics
router.get(
  '/urls/:shortCode/analytics',
  asyncHandler(async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    if (!shortCode) {
      throw new ApiError(400, 'MISSING_CODE', 'Short code is required');
    }

    try {
      const database = await initDB();
      const urlData = await database.get('SELECT * FROM urls WHERE shortCode = ?', [shortCode]);

      if (!urlData) {
        throw new ApiError(404, 'URL_NOT_FOUND', 'Short URL not found');
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          shortCode: urlData.shortCode,
          originalUrl: urlData.originalUrl,
          clickCount: urlData.clickCount,
          createdAt: urlData.createdAt,
          lastAccessed: urlData.lastAccessed || null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: process.env.OTEL_SERVICE_VERSION || '0.1.0',
        },
      };

      res.json(response);
    } catch (error: any) {
      // ✅ Fixed: Added type annotation
      logError(new Error('Analytics fetch failed'), {
        originalError: error.message,
        shortCode,
      });

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'DATABASE_ERROR', 'Failed to get analytics');
    }
  })
);

// GET /:shortCode - Redirect to original URL
router.get(
  '/:shortCode',
  asyncHandler(async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    try {
      const database = await initDB();
      const urlData = await database.get('SELECT * FROM urls WHERE shortCode = ?', [shortCode]);

      if (!urlData) {
        throw new ApiError(404, 'URL_NOT_FOUND', 'Short URL not found');
      }

      // Check if expired
      if (urlData.expiresAt && new Date() > new Date(urlData.expiresAt)) {
        throw new ApiError(410, 'URL_EXPIRED', 'This short URL has expired');
      }

      // Update click count and last accessed time
      await database.run(
        'UPDATE urls SET clickCount = clickCount + 1, lastAccessed = CURRENT_TIMESTAMP WHERE shortCode = ?',
        [shortCode]
      );

      logInfo('URL redirect', { shortCode, originalUrl: urlData.originalUrl });

      // Redirect to original URL
      res.redirect(urlData.originalUrl);
    } catch (error: any) {
      // ✅ Fixed: Added type annotation
      logError(new Error('Redirect failed'), {
        originalError: error.message,
        shortCode,
      });

      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'DATABASE_ERROR', 'Failed to redirect');
    }
  })
);

export default router;
