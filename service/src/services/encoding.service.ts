/**
 * URL Encoding Service - Base62 Algorithm Implementation
 * Learning: Base62 encoding, collision detection, algorithm optimization
 */

export class EncodingService {
  private static readonly BASE62_CHARS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  private static readonly SHORT_CODE_LENGTH = 6; // Supports 62^6 = ~56 billion URLs

  /**
   * Generate a random short code using Base62 encoding
   * Learning: Random generation, character selection, URL-safe encoding
   */
  generateShortCode(): string {
    let result = '';
    for (let i = 0; i < EncodingService.SHORT_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * EncodingService.BASE62_CHARS.length);
      result += EncodingService.BASE62_CHARS[randomIndex];
    }
    return result;
  }

  /**
   * Generate deterministic short code from number
   * Learning: Base conversion mathematics, encoding algorithms
   */
  encodeNumber(num: number): string {
    if (num === 0) return EncodingService.BASE62_CHARS[0];

    let result = '';
    const base = EncodingService.BASE62_CHARS.length;

    while (num > 0) {
      result = EncodingService.BASE62_CHARS[num % base] + result;
      num = Math.floor(num / base);
    }

    return result.padStart(EncodingService.SHORT_CODE_LENGTH, EncodingService.BASE62_CHARS[0]);
  }

  /**
   * Decode short code back to number
   * Learning: Reverse base conversion, mathematical decoding
   */
  decodeToNumber(shortCode: string): number {
    let result = 0;
    const base = EncodingService.BASE62_CHARS.length;

    for (let i = 0; i < shortCode.length; i++) {
      const char = shortCode[i];
      const value = EncodingService.BASE62_CHARS.indexOf(char);
      if (value === -1) throw new Error(`Invalid character in short code: ${char}`);
      result = result * base + value;
    }

    return result;
  }

  /**
   * Validate short code format
   * Learning: Input validation, security patterns
   */
  isValidShortCode(shortCode: string): boolean {
    if (
      !shortCode ||
      shortCode.length === 0 ||
      shortCode.length > EncodingService.SHORT_CODE_LENGTH
    ) {
      return false;
    }

    for (const char of shortCode) {
      if (EncodingService.BASE62_CHARS.indexOf(char) === -1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate URL-friendly alias from text
   * Learning: String manipulation, slug generation
   */
  generateAlias(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
  }

  /**
   * Validate custom alias format
   * Learning: Business rules, input validation
   */
  isValidAlias(alias: string): boolean {
    const pattern = /^[a-zA-Z0-9-_]{3,30}$/;
    return pattern.test(alias);
  }
}
