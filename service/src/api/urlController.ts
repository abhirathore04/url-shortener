/**
 * URL API Controllers
 * Learning: HTTP request handlers with business logic integration
 */

import { Request, Response, NextFunction } from 'express';

import { UrlService } from '../services/url.service';
import { CreateUrlRequest } from '../types/api/requests';
import { CreateUrlResponse, UrlAnalyticsResponse } from '../types/api/responses';

export class UrlController {
  private urlService: UrlService;

  constructor() {
    this.urlService = new UrlService();
  }

  /**
   * Create Short URL
   * POST /api/v1/urls
   */
  createShortUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestData: CreateUrlRequest = {
        url: req.body.url,
        customAlias: req.body.customAlias,
        expiresAt: req.body.expiresAt,
        description: req.body.description
      };

      const result = await this.urlService.shortenUrl({
        originalUrl: requestData.url,
        customAlias: requestData.customAlias,
        expiresAt: requestData.expiresAt ? new Date(requestData.expiresAt) : undefined
      });

      // ✅ FIXED: Direct assignment since service now returns strings
      const response: CreateUrlResponse = {
        id: result.id,
        shortCode: result.shortCode,
        shortUrl: result.shortUrl,
        originalUrl: result.originalUrl,
        customAlias: result.customAlias,
        createdAt: result.createdAt,    // ← Already string from service
        expiresAt: result.expiresAt     // ← Already string from service
      };

      res.status(201).json({
        success: true,
        message: 'Short URL created successfully',
        data: response,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Redirect to Original URL
   * GET /:shortCode
   */
  redirectToOriginal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      
      // Track the click for analytics
      await this.urlService.trackClick(shortCode, {
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer'),
        ipAddress: req.ip
      });

      const originalUrl = await this.urlService.expandUrl(shortCode);
      
      // Redirect with 301 (permanent) status
      res.redirect(301, originalUrl);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get URL Analytics
   * GET /api/v1/urls/:shortCode/analytics
   */
  getUrlAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      const analytics = await this.urlService.getAnalytics(shortCode);

      // ✅ FIXED: Direct assignment since service now returns strings  
      const response: UrlAnalyticsResponse = {
        shortCode: analytics.shortCode,
        originalUrl: analytics.originalUrl,
        totalClicks: analytics.clickCount,
        createdAt: analytics.createdAt,      // ← Already string from service
        lastAccessed: analytics.lastAccessed // ← Already string from service
      };

      res.status(200).json({
        success: true,
        message: 'Analytics retrieved successfully',
        data: response,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete URL
   * DELETE /api/v1/urls/:shortCode
   */
  deleteUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      await this.urlService.deleteUrl(shortCode);

      res.status(200).json({
        success: true,
        message: 'URL deleted successfully',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Health Check
   * GET /api/v1/urls/health
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: 'connected'
    };

    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: healthData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  };
}
