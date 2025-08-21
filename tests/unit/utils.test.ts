/**
 * Unit tests for utility functions
 */
import { validateUrl, generateShortCode, sanitizeInput } from '../../src/utils/helpers';

describe('URL Validation Utility', () => {
  describe('validateUrl', () => {
    it('should validate correct HTTP URLs', () => {
      const validUrls = [
        'http://example.com',
        'https://www.google.com',
        'https://sub.domain.com/path?query=value',
        'http://localhost:3000',
        'https://api.example.com/v1/users'
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert("xss")',
        '',
        null,
        undefined,
        'http://',
        'https://',
        'mailto:test@example.com'
      ];

      invalidUrls.forEach(url => {
        expect(validateUrl(url as string)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateUrl(' https://example.com ')).toBe(true); // Trimmed
      expect(validateUrl('HTTPS://EXAMPLE.COM')).toBe(true); // Case insensitive
      expect(validateUrl('http://192.168.1.1')).toBe(true); // IP addresses
    });
  });
});

describe('Short Code Generation', () => {
  describe('generateShortCode', () => {
    it('should generate codes of specified length', () => {
      const lengths = [6, 7, 8, 10];
      
      lengths.forEach(length => {
        const code = generateShortCode(length);
        expect(code).toHaveLength(length);
      });
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        codes.add(generateShortCode(7));
      }
      
      // Should have high uniqueness (allow for very small collision chance)
      expect(codes.size).toBeGreaterThan(iterations * 0.95);
    });

    it('should only use allowed characters', () => {
      const allowedChars = /^[a-zA-Z0-9]+$/;
      
      for (let i = 0; i < 100; i++) {
        const code = generateShortCode(7);
        expect(code).toMatch(allowedChars);
      }
    });

    it('should handle edge cases', () => {
      expect(() => generateShortCode(0)).toThrow();
      expect(() => generateShortCode(-1)).toThrow();
      expect(generateShortCode(1)).toHaveLength(1);
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const testCases = [
        { input: '<script>alert("xss")</script>', expected: 'scriptalert("xss")/script' },
        { input: 'SELECT * FROM users', expected: 'SELECT * FROM users' },
        { input: '../../etc/passwd', expected: '../../etc/passwd' },
        { input: 'normal text', expected: 'normal text' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should preserve whitespace and normal punctuation', () => {
      const input = 'Hello, World! This is a test.';
      expect(sanitizeInput(input)).toBe(input);
    });
  });
});
