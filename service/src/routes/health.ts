/**
 * Health Check Routes
 * Learning: Service health monitoring endpoints
 */

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Service is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

router.get('/ready', (req, res) => {
  res.json({
    success: true,
    message: 'Service is ready',
    data: {
      status: 'ready',
      timestamp: new Date().toISOString(),
    },
  });
});

router.get('/live', (req, res) => {
  res.json({
    success: true,
    message: 'Service is live',
    data: {
      status: 'live',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
