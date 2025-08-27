/**
 * Health Check API Integration Tests
 * Learning: Testing service monitoring endpoints
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { TestDatabaseManager } from '../helpers/testDatabase';

describe('Health Check API Integration Tests', () => {
  let app: Application;
  let testDb: TestDatabaseManager;

  beforeAll(async () => {
    app = createApp();
    testDb = TestDatabaseManager.getInstance();
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.close();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // ✅ FIXED: Updated to match actual response format
      expect(response.body).toMatchObject({
        success: true,
        message: 'Service is healthy',
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        }
      });

      // Verify timestamp format (ISO 8601)
      expect(new Date(response.body.data.timestamp).toISOString())
        .toBe(response.body.data.timestamp);

      // Verify uptime is positive
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });

    it('should include proper response headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Verify security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-request-id']).toBeTruthy();

      // Verify content type
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should respond quickly (performance test)', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/health')
        .expect(200);
      const responseTime = Date.now() - startTime;

      // Health check should respond in under 100ms
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('GET / (Root endpoint)', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'URL Shortener API',
        data: {
          service: 'URL Shortener Service',
          version: expect.any(String),
          environment: 'test',
          status: 'running',
          endpoints: {
            health: '/health',
            api: '/api/v1/urls',
            documentation: '/api/docs'
          }
        }
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should return 404 for unknown endpoints', async () => {
      // ✅ FIXED: Use a clearly invalid endpoint that won't match URL patterns
      const response = await request(app)
        .get('/api/v1/this-endpoint-does-not-exist')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Endpoint not found',
        error: {
          code: 'NOT_FOUND'
        }
      });
    });
  });
});
