#!/bin/sh
# Production startup script — runs inside the Docker container on Railway.
# Executed automatically before the Node process starts.
set -e

echo "============================================"
echo "  HelpDesk Ticketing — Production Startup"
echo "============================================"

echo ""
echo "→ Applying database migrations..."
npx prisma migrate deploy
echo "✓ Migrations complete"

echo ""
echo "→ Seeding reference data..."
# Exit code 1 from seed is non-fatal (data already exists)
npx prisma db seed || echo "⚠  Seed skipped — data may already exist, which is fine"

echo ""
echo "→ Starting API server..."
exec node dist/main
