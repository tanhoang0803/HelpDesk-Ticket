# Build context = repo root (Railway behaviour when dockerfilePath is used).
# All COPY from the build context must use the backend/ prefix.

# ── Stage 1: build ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npx prisma generate
RUN npm run build
RUN node_modules/.bin/tsc prisma/seed.ts --module commonjs --moduleResolution node --target ES2023 --esModuleInterop true --skipLibCheck --outDir dist/prisma

# ── Stage 2: production image ───────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

# Pull compiled output + prisma from builder — no build-context path needed
COPY --from=builder /app/dist               ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma             ./prisma

EXPOSE 3001

# Railway overrides CMD with startCommand in railway.toml (migrate→seed→start).
# This default is used for local docker run only.
CMD ["node", "dist/main"]
