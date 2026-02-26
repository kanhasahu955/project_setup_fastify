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
