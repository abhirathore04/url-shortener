/**
 * Global Test Teardown (TypeScript with CommonJS export)
 * Learning: Jest globalTeardown needs module.exports format even in TypeScript
 */

import { TestDatabaseManager } from './helpers/testDatabase';

// Use CommonJS export for Jest compatibility
export = async () => {
  // Final cleanup
  const testDb = TestDatabaseManager.getInstance();
  await testDb.close();
  
  // Reset environment variables
  delete process.env.NODE_ENV;
  delete process.env.DB_PATH;
  delete process.env.LOG_LEVEL;
  
  console.log('🏁 All tests completed and cleaned up');
};
