/**
 * URL Service Unit Tests
 * Learning: Service testing, mocking, async testing
 */

import { UrlService } from '../../../src/services/url.service';
import { DatabaseManager } from '../../../src/database/connection';
// Mock the database manager
jest.mock('../../../src/database/connection');

describe('UrlService', () => {
  let urlService: UrlService;
  let mockDb: any;
  let mockDbManager: jest.Mocked<DatabaseManager>;

  beforeEach(() => {
    // Mock database methods
    mockDb = {
      get: jest.fn(),
      run: jest.fn(),
    };

    // Mock DatabaseManager instance
    mockDbManager = {
      getDatabase: jest.fn().mockReturnValue(mockDb),
      connect: jest.fn(),
      close: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(mockDbManager);

    urlService = new UrlService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shortenUrl', () => {
    it('should shorten a valid URL', async () => {
      mockDb.get.mockResolvedValueOnce(null); // No existing URL
      mockDb.get.mockResolvedValueOnce(null); // Short code available
      mockDb.run.mockResolvedValueOnce({ lastID: 1 });

      const request = {
        originalUrl: 'https://example.com'
      };

      const result = await urlService.shortenUrl(request);

      expect(result.originalUrl).toBe('https://example.com');
      expect(result.shortCode).toBeDefined();
      expect(result.shortUrl).toContain(result.shortCode);
    });

    it('should reject invalid URLs', async () => {
      const request = {
        originalUrl: 'not-a-valid-url'
      };

      await expect(urlService.shortenUrl(request)).rejects.toThrow('Invalid URL provided');
    });

    it('should handle custom aliases', async () => {
      mockDb.get.mockResolvedValueOnce(null); // No existing URL
      mockDb.get.mockResolvedValueOnce(null); // Alias available
      mockDb.get.mockResolvedValueOnce(null); // Short code available
      mockDb.run.mockResolvedValueOnce({ lastID: 1 });

      const request = {
        originalUrl: 'https://example.com',
        customAlias: 'my-link'
      };

      const result = await urlService.shortenUrl(request);

      expect(result.customAlias).toBe('my-link');
      expect(result.shortUrl).toContain('my-link');
    });

    it('should reject taken custom aliases', async () => {
      mockDb.get.mockResolvedValueOnce(null); // No existing URL
      mockDb.get.mockResolvedValueOnce({ id: 1 }); // Alias taken

      const request = {
        originalUrl: 'https://example.com',
        customAlias: 'taken-alias'
      };

      await expect(urlService.shortenUrl(request)).rejects.toThrow('Custom alias already taken');
    });
  });

  describe('expandUrl', () => {
    it('should expand a valid short code', async () => {
      const mockUrlRecord = {
        id: 1,
        short_code: 'abc123',
        original_url: 'https://example.com',
        is_active: 1,
        expires_at: null
      };

      mockDb.get.mockResolvedValueOnce(mockUrlRecord);

      const result = await urlService.expandUrl('abc123');

      expect(result).toBe('https://example.com');
    });

    it('should throw error for non-existent short code', async () => {
      mockDb.get.mockResolvedValueOnce(null);

      await expect(urlService.expandUrl('nonexistent')).rejects.toThrow('Short URL not found');
    });

    it('should throw error for expired URLs', async () => {
      const expiredUrlRecord = {
        id: 1,
        short_code: 'abc123',
        original_url: 'https://example.com',
        is_active: 1,
        expires_at: '2020-01-01T00:00:00.000Z' // Past date
      };

      mockDb.get.mockResolvedValueOnce(expiredUrlRecord);

      await expect(urlService.expandUrl('abc123')).rejects.toThrow('Short URL has expired');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for valid short code', async () => {
      const mockUrlRecord = {
        id: 1,
        short_code: 'abc123',
        original_url: 'https://example.com',
        click_count: 5,
        created_at: '2025-01-01T00:00:00.000Z',
        last_accessed: '2025-01-02T00:00:00.000Z'
      };

      mockDb.get.mockResolvedValueOnce(mockUrlRecord);

      const result = await urlService.getAnalytics('abc123');

      expect(result.shortCode).toBe('abc123');
      expect(result.clickCount).toBe(5);
      expect(result.originalUrl).toBe('https://example.com');
    });

    it('should throw error for non-existent short code', async () => {
      mockDb.get.mockResolvedValueOnce(null);

      await expect(urlService.getAnalytics('nonexistent')).rejects.toThrow('Short URL not found');
    });
  });
});
