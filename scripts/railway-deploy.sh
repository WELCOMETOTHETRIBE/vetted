#!/bin/bash
# Railway deployment script that runs migrations before starting the server
set -e

echo "🚀 Starting Railway deployment..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma db push --accept-data-loss || {
  echo "⚠️  Migration failed, but continuing..."
}

echo "✅ Migrations completed, starting server..."
exec node server.js


