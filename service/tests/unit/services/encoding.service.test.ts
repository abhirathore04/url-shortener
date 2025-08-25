/**
 * Encoding Service Unit Tests
 * Learning: Unit testing, algorithm validation, edge case testing
 */

import { EncodingService } from '../../../src/services/encoding.service';

describe('EncodingService', () => {
  let encodingService: EncodingService;

  beforeEach(() => {
    encodingService = new EncodingService();
  });

  describe('generateShortCode', () => {
    it('should generate codes of correct length', () => {
      const code = encodingService.generateShortCode();
      expect(code).toHaveLength(6);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 1000; i++) {
        codes.add(encodingService.generateShortCode());
      }
      expect(codes.size).toBeGreaterThan(990); // Allow for rare collisions
    });

    it('should only contain valid Base62 characters', () => {
      const code = encodingService.generateShortCode();
      const validChars = /^[A-Za-z0-9]+$/;
      expect(validChars.test(code)).toBe(true);
    });
  });

  describe('encodeNumber and decodeToNumber', () => {
    it('should encode and decode numbers correctly', () => {
      const testNumbers = [0, 1, 62, 3844, 238328, 916132832];
      
      testNumbers.forEach(num => {
        const encoded = encodingService.encodeNumber(num);
        const decoded = encodingService.decodeToNumber(encoded);
        expect(decoded).toBe(num);
      });
    });

    it('should handle large numbers', () => {
      const largeNumber = 999999999;
      const encoded = encodingService.encodeNumber(largeNumber);
      const decoded = encodingService.decodeToNumber(encoded);
      expect(decoded).toBe(largeNumber);
    });

    it('should throw error for invalid characters', () => {
      expect(() => encodingService.decodeToNumber('abc@123')).toThrow('Invalid character in short code: @');
    });
  });

  describe('isValidShortCode', () => {
    it('should validate correct short codes', () => {
      expect(encodingService.isValidShortCode('abc123')).toBe(true);
      expect(encodingService.isValidShortCode('ABC')).toBe(true);
      expect(encodingService.isValidShortCode('123456')).toBe(true);
    });

    it('should reject invalid short codes', () => {
      expect(encodingService.isValidShortCode('abc@123')).toBe(false);
      expect(encodingService.isValidShortCode('abc 123')).toBe(false);
      expect(encodingService.isValidShortCode('')).toBe(false);
      expect(encodingService.isValidShortCode('toolongshortcode')).toBe(false);
    });
  });

  describe('generateAlias', () => {
    it('should generate valid aliases from text', () => {
      expect(encodingService.generateAlias('Hello World')).toBe('hello-world');
      expect(encodingService.generateAlias('Test@123!')).toBe('test-123');
      expect(encodingService.generateAlias('  spaces  ')).toBe('spaces');
    });
  });

  describe('isValidAlias', () => {
    it('should validate aliases correctly', () => {
      expect(encodingService.isValidAlias('valid-alias')).toBe(true);
      expect(encodingService.isValidAlias('valid_alias')).toBe(true);
      expect(encodingService.isValidAlias('ab')).toBe(false); // too short
      expect(encodingService.isValidAlias('invalid@alias')).toBe(false); // invalid chars
    });
  });
});
