/**
 * Utility Helper Functions
 * Learning: Input validation, sanitization, string manipulation
 */

/**
 * Validate URL format and security
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const trimmedUrl = url.trim();
    const urlObj = new URL(trimmedUrl);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate random short code
 */
export function generateShortCode(length: number = 6): string {
  if (length <= 0) {
    throw new Error('Length must be greater than 0');
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return (
    input
      .trim()
      // Remove only the tag brackets, keep inner content
      .replace(/<script[^>]*>/gi, 'script')
      .replace(/<\/script>/gi, '/script')
      .replace(/<.*?>/g, '')
      // Remove dangerous characters EXCEPT quotes
      .replace(/[<>&]/g, '') // Removed " and ' from this regex
      .substring(0, 1000)
  );
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}
