# Build context = repo root (Railway sets this when dockerfilePath is used).
# All COPY from build context must use the backend/ prefix.

# ── Stage 1: build ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: production image ───────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

# Compiled app + prisma client from builder
COPY --from=builder /app/dist               ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma             ./prisma

# Startup script
COPY backend/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3001

CMD ["sh", "start.sh"]
