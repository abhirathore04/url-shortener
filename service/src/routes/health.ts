/**
 * Health check endpoint
 */

import { Router, Request, Response } from 'express';
import { HealthCheck, ApiResponse } from '../types/config';
import { logInfo, logError } from '../utils/logger';
import { asyncHandler } from '../middleware/error';

const router = Router();
const startTime = Date.now();
const version = process.env.OTEL_SERVICE_VERSION || '0.1.0';

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthData: HealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
    uptime: Math.round((Date.now() - startTime) / 1000 * 100) / 100
  };

  res.status(200).json(healthData);
}));

router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    data: { status: 'ready' },
    meta: {
      timestamp: new Date().toISOString(),
      version
    }
  };

  res.status(200).json(response);
}));

router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; uptime: number }> = {
    success: true,
    data: {
      status: 'alive',
      uptime: Math.round((Date.now() - startTime) / 1000 * 100) / 100
    },
    meta: {
      timestamp: new Date().toISOString(),
      version
    }
  };

  res.status(200).json(response);
}));

export default router;
