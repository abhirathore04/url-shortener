/**
 * Jest Test Setup
 * Learning: Test environment configuration, global test setup
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DB_PATH = ':memory:'; // Use in-memory database for tests

// Increase timeout for integration tests
jest.setTimeout(30000);

// Optional: Suppress console output during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(), // Mock console.log
  warn: jest.fn(), // Mock console.warn
  error: originalConsole.error, // Keep errors visible
  info: jest.fn(), // Mock console.info
  debug: jest.fn(), // Mock console.debug
};

// Global test setup
beforeAll(() => {
  // Any global setup before all tests
});

afterAll(() => {
  // Any global cleanup after all tests
});
