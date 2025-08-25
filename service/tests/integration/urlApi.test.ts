/**
 * URL API Integration Tests
 * Learning: End-to-end API testing with supertest
 */

import request from 'supertest';
import { Server } from '../../src/index';

describe('URL API Integration Tests', () => {
  let server: Server;
  const baseUrl = '/api/v1/urls';

  beforeAll(async () => {
    // Initialize test server
    process.env.NODE_ENV = 'test';
    server = new Server();
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/v1/urls', () => {
    it('should create a short URL successfully', async () => {
      const response = await request(server.app)
        .post(baseUrl)
        .send({
          url: 'https://example.com/very-long-url-that-needs-shortening'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Short URL created successfully',
        data: {
          shortCode: expect.any(String),
          shortUrl: expect.stringContaining('http'),
          originalUrl: 'https://example.com/very-long-url-that-needs-shortening'
        }
      });
    });

    it('should reject invalid URLs', async () => {
      const response = await request(server.app)
        .post(baseUrl)
        .send({
          url: 'not-a-valid-url'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create URL with custom alias', async () => {
      const customAlias = 'my-custom-link';
      
      const response = await request(server.app)
        .post(baseUrl)
        .send({
          url: 'https://example.com/custom-alias-test',
          customAlias
        })
        .expect(201);

      expect(response.body.data.customAlias).toBe(customAlias);
    });
  });

  describe('GET /:shortCode', () => {
    let testShortCode: string;

    beforeEach(async () => {
      // Create a URL for testing redirects
      const createResponse = await request(server.app)
        .post(baseUrl)
        .send({
          url: 'https://example.com/redirect-test'
        });
      
      testShortCode = createResponse.body.data.shortCode;
    });

    it('should redirect to original URL', async () => {
      const response = await request(server.app)
        .get(`/${testShortCode}`)
        .expect(301);

      expect(response.headers.location).toBe('https://example.com/redirect-test');
    });

    it('should return 404 for non-existent short code', async () => {
      await request(server.app)
        .get('/nonexistent')
        .expect(404);
    });
  });

  describe('GET /api/v1/urls/:shortCode/analytics', () => {
    let testShortCode: string;

    beforeEach(async () => {
      const createResponse = await request(server.app)
        .post(baseUrl)
        .send({
          url: 'https://example.com/analytics-test'
        });
      
      testShortCode = createResponse.body.data.shortCode;
    });

    it('should return analytics data', async () => {
      const response = await request(server.app)
        .get(`${baseUrl}/${testShortCode}/analytics`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          shortCode: testShortCode,
          originalUrl: 'https://example.com/analytics-test',
          totalClicks: expect.any(Number),
          createdAt: expect.any(String)
        }
      });
    });
  });

  describe('GET /api/v1/urls/health', () => {
    it('should return health status', async () => {
      const response = await request(server.app)
        .get(`${baseUrl}/health`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Service is healthy',
        data: {
          status: 'healthy',
          uptime: expect.any(Number)
        }
      });
    });
  });
});
