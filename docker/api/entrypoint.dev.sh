#!/bin/sh
set -e

echo "=== MoneyStack API Dev Entrypoint ==="

# Wait for database to be ready
echo "Waiting for database..."
sleep 3

# Apply migrations (without resetting)
echo "Applying database migrations..."
cd /app/apps/api
npx prisma migrate deploy
npx prisma generate

echo "Migrations complete!"

# Start the dev server
echo "Starting development server..."
exec npm run dev -w @moneystack/api
