/**
 * URL Routes Definition
 * Learning: Express router setup with middleware integration
 */

import { Router } from 'express';
import { UrlController } from '../api/urlController';

const router = Router();
const urlController = new UrlController();

// URL Management Routes
router.post('/', urlController.createShortUrl);
router.get('/:shortCode/analytics', urlController.getUrlAnalytics);
router.delete('/:shortCode', urlController.deleteUrl);

// Health check
router.get('/health', urlController.healthCheck);

export default router;
