#!/bin/bash
# Railway setup script - Run this after logging in with `railway login`

set -e

echo "🚀 Setting up Railway database migrations..."

# Check if logged in
if ! railway whoami &>/dev/null; then
  echo "❌ Not logged in to Railway. Please run: railway login"
  exit 1
fi

echo "✅ Logged in to Railway"

# Link to project (if not already linked)
if [ ! -f .railway/project.json ]; then
  echo "🔗 Linking to Railway project..."
  railway link
else
  echo "✅ Already linked to Railway project"
fi

# Check database connection
echo "🔍 Checking database connection..."
railway run npm run db:check || {
  echo "⚠️  Database check failed, but continuing with migrations..."
}

# Run migrations
echo "🗄️  Running database migrations..."
railway run npm run db:push

echo "✅ Database migrations completed!"

# Ask if user wants to seed
read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding database..."
  railway run npm run db:seed
  echo "✅ Database seeded!"
fi

echo ""
echo "🎉 Setup complete! Your database is ready."
echo "You can now try signing up at /auth/signup"

