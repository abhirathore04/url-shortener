/**
 * Unit tests for utility functions
 */

import { validateUrl, generateShortCode, sanitizeInput, isEmpty, formatDateToISO } from '../../../src/utils/helpers';

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
        'http://',
        'https://',
        'mailto:test@example.com'
      ];

      invalidUrls.forEach(url => {
        expect(validateUrl(url as string)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateUrl(' https://example.com '.trim())).toBe(true);
      expect(validateUrl('HTTPS://EXAMPLE.COM')).toBe(true);
      expect(validateUrl('http://192.168.1.1')).toBe(true);
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
        { input: '<script>alert("xss")</script>', expected: 'scriptalert(xss)/script' },
        { input: 'javascript:alert(1)', expected: 'alert(1)' },
        { input: 'data:text/html,<h1>test</h1>', expected: 'text/html,h1test/h1' }, // ✅ FIXED: Keep the slash
        { input: 'Hello "World" & \'Test\'', expected: 'Hello World  Test' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('should limit length', () => {
      const longString = 'x'.repeat(2000);
      const result = sanitizeInput(longString);
      expect(result.length).toBe(1000);
    });
  });
});

describe('Helper Utilities', () => {
  describe('isEmpty', () => {
    it('should detect empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should detect non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' hello ')).toBe(false);
    });
  });

  describe('formatDateToISO', () => {
    it('should format valid dates', () => {
      const date = new Date('2023-01-01T12:00:00.000Z');
      const result = formatDateToISO(date);
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle string dates', () => {
      const result = formatDateToISO('2023-01-01T12:00:00.000Z');
      expect(result).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle null/undefined', () => {
      expect(formatDateToISO(null)).toBeUndefined();
      expect(formatDateToISO(undefined)).toBeUndefined();
    });
  });
});
