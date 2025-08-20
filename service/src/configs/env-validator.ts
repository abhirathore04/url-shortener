/**
 * Environment configuration validation
 */
import { AppConfig } from '../types/config';

export function validateEnvironment(): AppConfig {
  console.log('🔍 Validating environment configuration...');

  const config: AppConfig = {
    PORT: process.env.PORT || '8080',
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8080',
    OTEL_SERVICE_VERSION: process.env.OTEL_SERVICE_VERSION || '0.1.0',
    ENABLE_DEBUG_ROUTES: process.env.ENABLE_DEBUG_ROUTES,
    ENABLE_METRICS_ENDPOINT: process.env.ENABLE_METRICS_ENDPOINT
  };

  // Log configuration (without secrets)
  console.log('📋 Environment Configuration:');
  console.log('- PORT:', config.PORT);
  console.log('- NODE_ENV:', config.NODE_ENV);
  console.log('- LOG_LEVEL:', config.LOG_LEVEL);
  console.log('- MONGO_URI present:', !!config.MONGO_URI);
  console.log('- JWT_SECRET present:', !!config.JWT_SECRET);
  console.log('- OTEL_SERVICE_VERSION:', config.OTEL_SERVICE_VERSION);

  // Validate only critical fields
  const required = ['PORT', 'NODE_ENV'];
  const missing = required.filter(key => !config[key as keyof AppConfig]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing critical environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Warn about missing optional fields but don't fail
  const optional = ['MONGO_URI'];
  const missingOptional = optional.filter(key => !process.env[key]);
  
  if (missingOptional.length > 0) {
    console.warn(`⚠️  Using defaults for: ${missingOptional.join(', ')}`);
  }

  console.log(`✅ Environment validation passed for ${config.NODE_ENV} environment`);
  return config;
}
