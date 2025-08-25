/**
 * Redirect Routes (Short URL Resolution)
 * Learning: Separate routing for redirect functionality
 */

import { Router } from 'express';
import { UrlController } from '../api/urlController';

const router = Router();
const urlController = new UrlController();

// Short URL redirect
router.get('/:shortCode', urlController.redirectToOriginal);

export default router;
