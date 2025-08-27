/**
 * Redirect Routes with Swagger Documentation
 * Learning: URL redirection with comprehensive API documentation
 */

import { Router } from 'express';

import { UrlController } from '../api/urlController';
import { redirectRateLimiter } from '../middleware/rateLimiter';
import { validateShortCode } from '../middleware/validation';

const router = Router();
const urlController = new UrlController();

// Apply redirect-specific rate limiting
router.use(redirectRateLimiter);

/**
 * @swagger
 * /{shortCode}:
 *   get:
 *     summary: Redirect to original URL
 *     description: Redirects to the original URL associated with the short code and tracks the click
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9-_]+$'
 *         description: The short code or custom alias
 *         example: "abc123"
 *     responses:
 *       301:
 *         description: Redirect to original URL
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               format: uri
 *             description: The original URL to redirect to
 *             example: "https://www.example.com/original-url"
 *           X-Request-ID:
 *             schema:
 *               type: string
 *             description: Request tracking ID
 *       400:
 *         description: Invalid short code format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Short URL not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Short URL not found"
 *               error:
 *                 code: "URL_NOT_FOUND"
 *       410:
 *         description: Short URL has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Short URL has expired"
 *               error:
 *                 code: "URL_EXPIRED"
 *       429:
 *         description: Too many redirect requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Too many redirect requests, please slow down"
 *               error:
 *                 code: "REDIRECT_RATE_LIMIT_EXCEEDED"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:shortCode', validateShortCode, urlController.redirectToOriginal);

export default router;
