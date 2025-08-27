/**
 * URL API Integration Tests
 * Learning: End-to-end API testing with real HTTP requests
 */

import request from 'supertest';
import { Application } from 'express'; // ✅ FIXED: Use Application instead of Express
import { createApp } from '../../src/app';
import { TestDatabaseManager } from '../helpers/testDatabase';

describe('URL API Integration Tests', () => {
  let app: Application; // ✅ FIXED: Changed from Express to Application
  let testDb: TestDatabaseManager;

  beforeAll(async () => {
    app = createApp();
    testDb = TestDatabaseManager.getInstance();
    await testDb.connect();
  });

  beforeEach(async () => {
    await testDb.clearData();
    await testDb.seedTestData(); // We'll add this method below
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('POST /api/v1/urls', () => {
    it('should create a short URL successfully', async () => {
      const payload = {
        url: 'https://example.com/test-create'
      };

      const response = await request(app)
        .post('/api/v1/urls')
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Short URL created successfully',
        data: {
          id: expect.any(Number),
          shortCode: expect.any(String),
          shortUrl: expect.stringContaining('http'),
          originalUrl: payload.url,
          createdAt: expect.any(String)
        },
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });

      // Verify short code format (Base62)
      expect(response.body.data.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
    });

    it('should create URL with custom alias', async () => {
      const payload = {
        url: 'https://example.com/custom-test',
        customAlias: 'my-custom-link'
      };

      const response = await request(app)
        .post('/api/v1/urls')
        .send(payload)
        .expect(201);

      expect(response.body.data).toMatchObject({
        shortCode: 'my-custom-link',
        customAlias: 'my-custom-link',
        originalUrl: payload.url
      });
    });

    it('should reject invalid URLs', async () => {
      const payload = {
        url: 'not-a-valid-url'
      };

      const response = await request(app)
        .post('/api/v1/urls')
        .send(payload)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR'
        }
      });
    });

    it('should reject duplicate custom alias', async () => {
      const payload = {
        url: 'https://example.com/duplicate-test',
        customAlias: 'github' // Already exists in seed data
      };

      const response = await request(app)
        .post('/api/v1/urls')
        .send(payload)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Custom alias already taken'
      });
    });
  });

  describe('GET /:shortCode (Redirect)', () => {
    it('should redirect to original URL', async () => {
      const response = await request(app)
        .get('/test123')
        .expect(301);

      expect(response.headers.location).toBe('https://example.com/test1');
    });

    it('should handle custom aliases', async () => {
      const response = await request(app)
        .get('/github')
        .expect(301);

      expect(response.headers.location).toBe('https://github.com');
    });

    it('should return 404 for non-existent URLs', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Short URL not found',
        error: {
          code: 'URL_NOT_FOUND'
        }
      });
    });
  });

  describe('GET /api/v1/urls/:shortCode/analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/v1/urls/github/analytics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Analytics retrieved successfully',
        data: {
          shortCode: 'github',
          originalUrl: 'https://github.com',
          totalClicks: expect.any(Number),
          createdAt: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent URLs', async () => {
      const response = await request(app)
        .get('/api/v1/urls/nonexistent/analytics')
        .expect(404);

      expect(response.body.error.code).toBe('URL_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/urls/:shortCode', () => {
    it('should delete URL successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/urls/test123')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'URL deleted successfully'
      });

      // Verify URL is no longer accessible
      await request(app)
        .get('/test123')
        .expect(404);
    });
  });
});
