#!/bin/bash
# Railway migration script
# This script runs database migrations after deployment

set -e

echo "🚀 Running database migrations..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push schema to database
echo "🗄️  Pushing database schema..."
npx prisma db push --accept-data-loss

echo "✅ Database migrations completed!"

# Optional: Seed database (uncomment to enable)
# echo "🌱 Seeding database..."
# npm run db:seed


