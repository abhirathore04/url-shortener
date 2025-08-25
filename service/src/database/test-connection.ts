/**
 * Database Connection Test Script
 * Learning: Database testing, TypeScript execution, error handling
 */

import { DatabaseManager } from './connection';

async function testDatabaseConnection(): Promise<void> {
  try {
    console.log('🔍 Testing database connection...');

    const dbManager = DatabaseManager.getInstance();
    await dbManager.connect();

    // Test basic operations
    const db = dbManager.getDatabase();

    // Insert test data
    console.log('📝 Inserting test data...');
    await db.run(
      `INSERT OR IGNORE INTO urls (short_code, original_url, click_count) 
       VALUES (?, ?, ?)`,
      ['TEST01', 'https://example.com', 0]
    );

    // Query test data
    console.log('🔍 Querying test data...');
    const result = await db.get('SELECT * FROM urls WHERE short_code = ?', ['TEST01']);

    console.log('✅ Test query result:', result);

    // Health check
    const isHealthy = await dbManager.healthCheck();
    console.log('✅ Database health check:', isHealthy);

    await dbManager.close();
    console.log('🎉 Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Add health check method to DatabaseManager if missing
declare module './connection' {
  interface DatabaseManager {
    healthCheck(): Promise<boolean>;
  }
}

// Run test if called directly
if (require.main === module) {
  testDatabaseConnection();
}

export { testDatabaseConnection };
