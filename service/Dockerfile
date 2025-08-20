# =============================================================================
# Multi-stage Dockerfile for TypeScript Express API
# Optimized for production deployment
# =============================================================================

# Builder stage
FROM node:20-alpine AS builder
LABEL stage=builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ linux-headers

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --include=dev && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build && npm prune --production

# Production stage
FROM node:20-alpine AS production
LABEL version="0.1.0"

# Install runtime dependencies
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S urlshortener -u 1001 -G nodejs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=urlshortener:nodejs /app/dist ./dist
COPY --from=builder --chown=urlshortener:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=urlshortener:nodejs /app/package.json ./package.json

# Set environment
ENV NODE_ENV=production PORT=8080 LOG_LEVEL=info

USER urlshortener
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
