#!/bin/sh
set -e
echo "=== Running migrations ==="
node_modules/.bin/prisma migrate deploy
echo "=== Seeding database ==="
node dist/prisma/seed.js || echo "Seed skipped (already seeded)"
echo "=== Starting app ==="
exec node dist/src/main.js
