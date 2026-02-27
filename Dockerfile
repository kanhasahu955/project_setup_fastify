FROM node:20-alpine AS base

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0

# 1) Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# 2) Copy source
COPY . .

# 3) Generate Prisma clients and build TypeScript
RUN npm run prisma:generate:all && npm run build

# 4) On container start: push schema for selected DATABASE_TYPE, then start API
CMD sh -c "npm run db:push:auto && npm start"

# ---------------------------
# Stage 1: Dependencies (for dev + build)
# ---------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------
# Stage 2: Build (production)
# ---------------------------
FROM deps AS builder
COPY prisma ./prisma/
RUN npm run prisma:generate:all
COPY . .
RUN npm run build

# ---------------------------
# Stage 3: Production run
# ---------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
# Set at runtime: DATABASE_TYPE, DATABASE_URL (or DATABASE_URL_*), REDIS_URL, etc.
EXPOSE 8000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

USER node
CMD ["node", "dist/main.js"]
