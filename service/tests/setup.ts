/**
 * Global Test Setup
 * Learning: Configure test environment before all tests run
 */

import { TestDatabaseManager } from './helpers/testDatabase';
import { DatabaseManager } from '../src/database/connection';

// Mock the production database manager for tests
jest.mock('../src/database/connection', () => {
  const testDbManager = require('./helpers/testDatabase').TestDatabaseManager.getInstance();
  
  return {
    DatabaseManager: {
      getInstance: jest.fn(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        getDatabase: jest.fn(() => testDbManager.getDatabase()),
        close: jest.fn().mockResolvedValue(undefined),
        isConnectionActive: jest.fn().mockReturnValue(true)
      }))
    }
  };
});

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
  
  // Initialize test database
  const testDb = TestDatabaseManager.getInstance();
  await testDb.connect();
  
  console.log('🧪 Test environment initialized');
});

afterAll(async () => {
  // Cleanup test database
  const testDb = TestDatabaseManager.getInstance();
  await testDb.close();
  
  console.log('🧹 Test environment cleaned up');
});
