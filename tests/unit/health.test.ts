/**
 * Unit tests for health check functionality
 */
import request from 'supertest';
import express from 'express';

// Mock health router
const createHealthRouter = () => {
  const router = express.Router();
  
  router.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      uptime: process.uptime()
    });
  });
  
  router.get('/ready', (_req, res) => {
    res.json({
      success: true,
      data: { status: 'ready' },
      meta: {
        timestamp: new Date().toISOString(),
        version: '0.1.0'
      }
    });
  });
  
  router.get('/live', (_req, res) => {
    res.json({
      success: true,
      data: { 
        status: 'alive',
        uptime: process.uptime()
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '0.1.0'
      }
    });
  });
  
  return router;
};

describe('Health Check Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/health', createHealthRouter());
  });

  describe('GET /health', () => {
    it('should return health status with 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should return consistent response structure', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const requiredFields = ['status', 'timestamp', 'version', 'uptime'];
      requiredFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'alive');
      expect(response.body.data).toHaveProperty('uptime');
      expect(typeof response.body.data.uptime).toBe('number');
    });
  });
});
