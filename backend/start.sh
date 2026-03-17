#!/bin/sh
set -e
echo "=== Running migrations ==="
node_modules/.bin/prisma migrate deploy
echo "=== Starting app ==="
exec node dist/src/main.js
