# Configuration Management

## Overview
This service follows the [Twelve-Factor App](https://12factor.net/) methodology for configuration management, specifically Factor III: Config.

## Principles
1. **Store config in the environment**: Never hardcode configuration in source code
2. **Separate config from secrets**: Public config vs sensitive secrets
3. **Environment parity**: Same code, different config across environments
4. **Explicit dependencies**: All required config documented in .env.example

## Local Development

### Setup
1. Copy `.env.example` to `.env`
2. Fill in actual values for your local environment
3. Never commit the `.env` file

### File Structure
- `.env.example`: Template with all required variables (committed)
- `.env`: Local values (gitignored)
- `docs/configuration.md`: This documentation (committed)

## Environment Variables

### Application Config
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `8080` | Yes |
| `NODE_ENV` | Environment | `development` | Yes |
| `LOG_LEVEL` | Log verbosity | `info` | Yes |

### Database Config
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection | `mongodb://mongo:27017/shortener` | Yes |
| `REDIS_URL` | Redis connection | `redis://redis:6379` | Yes |
| `MONGO_MAX_POOL_SIZE` | Connection pool size | `10` | No |

### Security Config
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing key | `your-secret-here` | Yes |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit ceiling | `100` | No |
| `CORS_ORIGINS` | Allowed origins | `http://localhost:3000` | No |

### Observability Config
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OTEL_SERVICE_NAME` | Service name in traces | `url-shortener` | Yes |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector URL | `http://collector:4317` | Yes |

## Production Deployment

### Secrets Management
- **Local Dev**: Use `.env` file with dummy secrets
- **Production**: Integrate with Vault/KMS (Week 1, Day 6)
- **CI/CD**: Inject secrets via pipeline variables

### Environment Validation
The application validates required environment variables on startup and fails fast if any are missing.

## Security Guidelines

### Never Commit
- Real API keys or passwords
- Production JWT secrets
- Database credentials
- OAuth client secrets

### Safe to Commit
- `.env.example` with placeholder values
- Configuration documentation
- Default/example values

### Secret Rotation
- All secrets should be rotatable without code changes
- Production secrets rotate monthly (automated)
- Development secrets can be regenerated anytime

## Troubleshooting

### Common Issues
1. **Missing .env file**: Copy from .env.example
2. **Invalid config**: Check required variables table
3. **Connection failures**: Verify database URLs
4. **Permission errors**: Check secret access policies

### Validation
Test configuration loading:
