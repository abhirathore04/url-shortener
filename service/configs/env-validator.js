/**
 * Environment Configuration Validator
 * Validates required environment variables on application startup
 */

const requiredVars = [
  'PORT',
  'NODE_ENV',
  'LOG_LEVEL',
  'MONGO_URI',
  'REDIS_URL',
  'JWT_SECRET',
  'OTEL_SERVICE_NAME',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
];

const optionalVars = {
  MONGO_MAX_POOL_SIZE: '10',
  REDIS_MAX_CONNECTIONS: '10',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  CORS_ORIGINS: 'http://localhost:3000',
  LOG_FORMAT: 'json',
  SHORT_URL_LENGTH: '7',
  URL_TTL_DAYS: '365',
  MAX_URL_LENGTH: '2048',
  ENABLE_DEBUG_ROUTES: 'true',
};

function validateEnvironment() {
  const missing = [];
  const config = {};

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      config[varName] = process.env[varName];
    }
  }

  // Add optional variables with defaults
  for (const [varName, defaultValue] of Object.entries(optionalVars)) {
    config[varName] = process.env[varName] || defaultValue;
  }

  // Fail fast if required variables are missing
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Copy .env.example to .env and fill in values');
    process.exit(1);
  }

  // Log successful validation
  console.log('✅ Environment configuration validated');
  console.log(`   - NODE_ENV: ${config.NODE_ENV}`);
  console.log(`   - PORT: ${config.PORT}`);
  console.log(`   - LOG_LEVEL: ${config.LOG_LEVEL}`);

  return config;
}

module.exports = { validateEnvironment };
