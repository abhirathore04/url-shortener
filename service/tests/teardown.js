/**
 * Global Test Teardown (JavaScript)
 * Learning: Jest globalTeardown requires CommonJS format
 */

const { TestDatabaseManager } = require('./helpers/testDatabase');

module.exports = async () => {
  // Final cleanup
  const testDb = TestDatabaseManager.getInstance();
  await testDb.close();
  
  // Reset environment variables
  delete process.env.NODE_ENV;
  delete process.env.DB_PATH;
  delete process.env.LOG_LEVEL;
  
  console.log('🏁 All tests completed and cleaned up');
};
