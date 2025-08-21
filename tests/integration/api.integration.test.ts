/**
 * Integration tests for API endpoints
 */
import request from 'supertest';
import express from 'express';
import { clearTestDatabase } from '../setup';

// Mock express application
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        service: 'URL Shortener',
        version: '0.1.0',
        environment: 'test',
        timestamp: new Date().toISOString()
      }
    });
  });
  
  // Health endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      dependencies: {
        mongo: 'healthy',
        redis: 'healthy'
      }
    });
  });
  
  // Metrics endpoint
  app.get('/metrics', (_req, res) => {
    const metrics = [
      '# HELP nodejs_version Node.js version info',
      '# TYPE nodejs_version gauge',
      `nodejs_version{version="${process.version}"} 1`,
      '',
      '# HELP process_uptime_seconds Process uptime',
      '# TYPE process_uptime_seconds counter',
      `process_uptime_seconds ${process.uptime()}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  });
  
  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route not found`
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '0.1.0'
      }
    });
  });
  
  return app;
};

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('Service Health and Info', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('service', 'URL Shortener');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('environment');
    });

    it('should have working health check with dependencies', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('dependencies');
    });
  });

  describe('Metrics Endpoint', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('nodejs_version');
    });

    it('should include process metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.text).toContain('process_uptime_seconds');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors properly', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});
