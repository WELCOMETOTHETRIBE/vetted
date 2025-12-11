#!/bin/sh
set -e

# Try to run migration, but don't fail if it doesn't work
export NPM_CONFIG_CACHE=/tmp/.npm
npm run db:push || echo "Migration skipped - database may already be up to date"

# Start the server
exec node server.js

