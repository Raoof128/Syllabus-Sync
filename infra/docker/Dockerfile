# Multi-stage Dockerfile for The Syllabus Sync

# Build stage with Node.js
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN addgroup -g 1001 -S nodejs
RUN adduser -S -u 1001 -G nodejs nextjs

WORKDIR /app

# Install dependencies based on the detected package manager
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
RUN addgroup -g 1001 -S nodejs
RUN adduser -S -u 1001 -G nodejs nextjs

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

# Next.js collects completely anonymous telemetry data about general usage.
# Uncomment the following line to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S -u 1001 -G nodejs nextjs

# Create non-root user directory
RUN mkdir -p /app/.next && chown nextjs:nodejs /app/.next

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install curl for health checks
RUN apk add --no-cache curl

# Security: Set proper permissions
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]