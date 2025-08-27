/**
 * URL Routes Definition with Swagger Documentation
 * Learning: Express router setup with comprehensive API documentation
 */

import { Router } from 'express';

import { UrlController } from '../api/urlController';
import { createRateLimiter } from '../middleware/rateLimiter';
import { validateCreateUrl, validateShortCode } from '../middleware/validation';

const router = Router();
const urlController = new UrlController();

// Apply rate limiting to all routes
router.use(createRateLimiter);

/**
 * @swagger
 * /api/v1/urls:
 *   post:
 *     summary: Create a short URL
 *     description: Creates a short URL from a long URL with optional custom alias
 *     tags: [URLs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUrlRequest'
 *           examples:
 *             basic:
 *               summary: Basic URL shortening
 *               value:
 *                 url: "https://www.example.com/very/long/url/that/needs/shortening"
 *             custom_alias:
 *               summary: URL with custom alias
 *               value:
 *                 url: "https://github.com/your-username/url-shortener"
 *                 customAlias: "github-repo"
 *             with_expiration:
 *               summary: URL with expiration
 *               value:
 *                 url: "https://www.example.com/temporary-content"
 *                 expiresAt: "2025-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Short URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUrlResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Custom alias already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Custom alias already taken"
 *               error:
 *                 code: "ALIAS_CONFLICT"
 *       429:
 *         $ref: '#/components/responses/RateLimit'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', validateCreateUrl, urlController.createShortUrl);

/**
 * @swagger
 * /api/v1/urls/{shortCode}/analytics:
 *   get:
 *     summary: Get URL analytics
 *     description: Retrieves analytics data for a short URL including click count and access history
 *     tags: [Analytics]
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
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlAnalyticsResponse'
 *       400:
 *         description: Invalid short code format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid short code format"
 *               error:
 *                 code: "INVALID_SHORT_CODE"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/RateLimit'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:shortCode/analytics', validateShortCode, urlController.getUrlAnalytics);

/**
 * @swagger
 * /api/v1/urls/{shortCode}:
 *   delete:
 *     summary: Delete a short URL
 *     description: Soft deletes a short URL, making it inaccessible
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9-_]+$'
 *         description: The short code or custom alias to delete
 *         example: "abc123"
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "URL deleted successfully"
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         description: Invalid short code format
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/RateLimit'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:shortCode', validateShortCode, urlController.deleteUrl);

/**
 * @swagger
 * /api/v1/urls/health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the URL shortener service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/health', urlController.healthCheck);

export default router;
