# ── Stage 1: build ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: production image ───────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# prisma is in dependencies so it stays after --omit=dev
RUN npm ci --omit=dev

# Compiled output + prisma schema + generated client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# Production startup script: migrate → seed → start
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3001

CMD ["sh", "start.sh"]
