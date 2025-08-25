/**
 * Encoding Service Tests
 * Learning: Unit testing, algorithm validation, edge cases
 */

import { EncodingService } from '../encoding.service';

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
      expect(codes.size).toBe(1000); // All unique
    });
  });

  describe('encodeNumber', () => {
    it('should encode numbers correctly', () => {
      expect(encodingService.encodeNumber(0)).toBe('AAAAAA');
      expect(encodingService.encodeNumber(1)).toBe('AAAAAB');
      expect(encodingService.encodeNumber(62)).toBe('AAAABA');
    });

    it('should be reversible with decodeToNumber', () => {
      const testNumbers = [0, 1, 62, 3844, 238328];
      testNumbers.forEach((num) => {
        const encoded = encodingService.encodeNumber(num);
        const decoded = encodingService.decodeToNumber(encoded);
        expect(decoded).toBe(num);
      });
    });
  });
});
