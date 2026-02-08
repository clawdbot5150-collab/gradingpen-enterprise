# Multi-stage Dockerfile for AIGFNetwork Backend

# Base image with Node.js
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install development dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs tmp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start application with nodemon for development
CMD ["dumb-init", "npm", "run", "dev"]

# Production build stage
FROM base AS build
ENV NODE_ENV=production

# Install all dependencies (including dev) for build
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application (if you have build scripts)
# RUN npm run build

# Clean up development dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production
ENV NODE_ENV=production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S aigf -u 1001 -G nodejs

# Copy built application from build stage
COPY --from=build --chown=aigf:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=aigf:nodejs /app/src ./src
COPY --from=build --chown=aigf:nodejs /app/package*.json ./
COPY --from=build --chown=aigf:nodejs /app/scripts ./scripts

# Create necessary directories with correct permissions
RUN mkdir -p uploads logs tmp \
    && chown -R aigf:nodejs uploads logs tmp

# Switch to non-root user
USER aigf

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["dumb-init", "node", "src/server.js"]