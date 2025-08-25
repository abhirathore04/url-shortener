/**
 * Utility Helper Functions
 * Learning: Reusable validation and utility functions
 */

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, '');
}

/**
 * Generate random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str: string | undefined | null): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Format date to ISO string safely
 */
export function formatDateToISO(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
  } catch {
    return undefined;
  }
}
