/**
 * Validation Middleware Unit Tests
 * Learning: Testing middleware functions
 */

import { Request, Response, NextFunction } from 'express';
import { validateCreateUrl, validateShortCode } from '../../../src/middleware/validation';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      headers: { 'x-request-id': 'test-request-id' } // ✅ FIXED: Added headers
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('validateCreateUrl', () => {
    it('should pass validation for valid URL', () => {
      mockReq.body = { url: 'https://example.com' };

      validateCreateUrl(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid URL', () => {
      mockReq.body = { url: 'not-a-url' };

      validateCreateUrl(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing URL', () => {
      mockReq.body = {};

      validateCreateUrl(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateShortCode', () => {
    it('should pass validation for valid short code', () => {
      mockReq.params = { shortCode: 'abc123' };

      validateShortCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid short code', () => {
      mockReq.params = { shortCode: 'invalid@code' };

      validateShortCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
