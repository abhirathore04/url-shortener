/**
 * Configuration Test Script
 * Run this to verify your .env file is properly configured
 */

// Load environment variables from .env file
require('dotenv').config({ path: '../.env' });

// Import our validator
const { validateEnvironment } = require('./configs/env-validator');

console.log('🔍 Testing configuration loading...\n');

try {
  const config = validateEnvironment();

  console.log('\n📋 Loaded Configuration:');
  console.log('=====================================');

  // Show non-sensitive config
  const safeToShow = {
    PORT: config.PORT,
    NODE_ENV: config.NODE_ENV,
    LOG_LEVEL: config.LOG_LEVEL,
    SHORT_URL_LENGTH: config.SHORT_URL_LENGTH,
    URL_TTL_DAYS: config.URL_TTL_DAYS,
    ENABLE_DEBUG_ROUTES: config.ENABLE_DEBUG_ROUTES,
  };

  Object.entries(safeToShow).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  // Don't show secrets, just confirm they exist
  const secrets = ['JWT_SECRET', 'MONGO_URI', 'REDIS_URL'];
  console.log('\n🔒 Secrets (confirmed loaded):');
  secrets.forEach((secret) => {
    const value = process.env[secret];
    if (value) {
      console.log(`${secret}: ${'*'.repeat(8)} (${value.length} chars)`);
    }
  });

  console.log('\n✅ Configuration test completed successfully!');
} catch (error) {
  console.error('❌ Configuration test failed:', error.message);
  process.exit(1);
}
