# Multi-stage Dockerfile for AIGFNetwork Frontend

# Base image with Node.js
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    && rm -rf /var/cache/apk/*

# Dependencies stage
FROM base AS deps

# Copy package files
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 -G nodejs

# Copy built application
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["dumb-init", "node", "server.js"]

# Static export stage (optional for CDN deployment)
FROM nginx:alpine AS static
COPY --from=builder /app/out /usr/share/nginx/html

# Copy custom nginx configuration if needed
COPY docker/nginx/static.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]