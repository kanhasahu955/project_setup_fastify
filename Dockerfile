# ===========================================
# Multi-stage Dockerfile for Production Build
# ===========================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application (prisma already generated above)
RUN npx tsup

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify

# Copy package files
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy prisma schema and regenerate client for production
COPY --from=builder /app/prisma ./prisma/
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy generated prisma client
COPY --from=builder /app/generated ./generated 2>/dev/null || true
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma 2>/dev/null || true

# Change ownership to non-root user
RUN chown -R fastify:nodejs /app

# Switch to non-root user
USER fastify

# Expose port (Render provides PORT env var)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8000}/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
