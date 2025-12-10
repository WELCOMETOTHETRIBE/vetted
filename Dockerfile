FROM node:20-alpine AS base

# Install Python and dependencies for Ashby scraper
RUN apk add --no-cache python3 py3-pip

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Install Python dependencies for Ashby scraper
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt && \
    python3 -m playwright install chromium && \
    python3 -m playwright install-deps chromium

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (doesn't require DATABASE_URL, but config file might)
# Set a dummy DATABASE_URL if not provided to avoid config errors during build
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder}

# Generate Prisma Client
RUN npx prisma generate

# Verify Prisma Client was generated
RUN test -d node_modules/.prisma/client && echo "Prisma client generated successfully" || (echo "ERROR: Prisma client not found" && exit 1)

# Create default.js for Prisma Client (will be overwritten later with compiled version)
RUN node scripts/create-prisma-default.js || echo "Note: default.js will be created after TypeScript compilation"

# Install TypeScript to compile Prisma client files
RUN npm install --save-dev typescript

# Compile TypeScript client files to JavaScript for Next.js page data collection
# Compile all TypeScript files, not just client.ts, to ensure dependencies are available
RUN cd node_modules/.prisma/client && \
    echo '{"compilerOptions":{"module":"commonjs","target":"es2020","esModuleInterop":true,"skipLibCheck":true,"moduleResolution":"node","resolveJsonModule":true,"outDir":".","declaration":false,"allowSyntheticDefaultImports":true},"include":["**/*.ts"],"exclude":["node_modules"]}' > tsconfig.json && \
    npx tsc --project tsconfig.json 2>&1 && \
    echo "TypeScript compilation completed" && \
    # Fix require paths to include .js extensions (Alpine sed syntax)
    sed -i 's/require("\.\/\([^"]*\)")/require(".\/\1.js")/g' client.js && \
    sed -i "s/require('\.\/\([^']*\)')/require('.\/\1.js')/g" client.js && \
    # Remove ALL import.meta references (they don't work in CommonJS)
    # Replace any import.meta.url with __dirname
    sed -i 's/import\.meta\.url/__dirname/g' client.js && \
    sed -i 's/import\.meta/__dirname/g' client.js && \
    # Remove all node_url_1 references (we removed the import, so any usage will fail)
    sed -i 's/(0, node_url_1\.fileURLToPath)([^)]*)/__dirname/g' client.js && \
    sed -i 's/node_url_1\.fileURLToPath([^)]*)/__dirname/g' client.js && \
    sed -i 's/globalThis\[.__dirname.\] = path\.dirname((0, node_url_1\.fileURLToPath)([^)]*);/\/\/ __dirname is available in CommonJS/g' client.js && \
    sed -i 's/globalThis\[.__dirname.\] = path\.dirname(__dirname);/\/\/ __dirname is available in CommonJS/g' client.js && \
    # Remove the node_url_1 import line
    sed -i '/^const node_url_1 = require("node:url");$/d' client.js && \
    # Remove any remaining node_url_1 references
    sed -i 's/node_url_1[^;]*;//g' client.js && \
    # Ensure "use strict" is at the top for CommonJS (Alpine sed syntax)
    if ! head -1 client.js | grep -q "use strict"; then \
      sed -i '1i"use strict";' client.js; \
    fi && \
    # Remove any ES module export/import syntax
    sed -i 's/^export /\/\/ export /g' client.js && \
    sed -i 's/^import /\/\/ import /g' client.js || \
    (echo "TypeScript compilation failed" && rm -f client.js)

# Create default.js that exports PrismaClient from compiled client.js
# Verify client.js exists and exports PrismaClient correctly
RUN cd node_modules/.prisma/client && \
    if [ -f client.js ]; then \
      echo "client.js exists, checking exports..."; \
      node -e "const c = require('./client.js'); console.log('PrismaClient type:', typeof c.PrismaClient);" || echo "Warning: client.js may not export PrismaClient correctly"; \
    else \
      echo "Warning: client.js not found after TypeScript compilation"; \
    fi

# Create default.js that loads client.js in a CommonJS-safe way
RUN cat > node_modules/.prisma/client/default.js << 'EOFJS'
const runtime = require('@prisma/client/runtime/client');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let PrismaClient;

try {
  const clientPath = path.join(__dirname, 'client.js');
  if (fs.existsSync(clientPath)) {
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    const moduleExports = {};
    const moduleObj = { exports: moduleExports };
    const requireFunc = (id) => {
      if (id.startsWith('./') || id.startsWith('../')) {
        return require(path.resolve(__dirname, id));
      }
      return require(id);
    };
    const context = {
      exports: moduleExports,
      module: moduleObj,
      require: requireFunc,
      __filename: clientPath,
      __dirname: __dirname,
      console: console,
      Buffer: Buffer,
      process: process,
      global: global,
    };
    const script = new vm.Script(clientCode);
    script.runInNewContext(context);
    if (context.module.exports && typeof context.module.exports.PrismaClient === 'function') {
      PrismaClient = context.module.exports.PrismaClient;
    } else if (context.exports && typeof context.exports.PrismaClient === 'function') {
      PrismaClient = context.exports.PrismaClient;
    } else {
      throw new Error('PrismaClient not found in client.js exports');
    }
  } else {
    throw new Error('client.js not found');
  }
} catch (e) {
  PrismaClient = class PrismaClient {
    constructor() {
      throw new Error('PrismaClient not found. Error: ' + (e?.message || String(e)));
    }
  };
}

module.exports = {
  PrismaClient,
  ...runtime
};
EOFJS

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Ensure Python and Playwright are available in production
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir playwright beautifulsoup4 serpapi lxml && \
    python3 -m playwright install chromium && \
    python3 -m playwright install-deps chromium

COPY --from=builder /app/public ./public

# Copy Next.js build output (standalone includes minimal node_modules)
# The standalone output structure is: .next/standalone/{server.js, node_modules, ...}
# We need to copy the contents of standalone to the root
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma Client into the standalone node_modules (standalone has its own node_modules)
# The standalone build should already have @prisma/client, but we need .prisma/client
# We copy AFTER standalone because standalone overwrites node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema and config for runtime migrations (if needed)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy Python scraper scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts/ashby ./scripts/ashby
COPY --from=builder --chown=nextjs:nodejs /app/requirements.txt ./requirements.txt

# Ensure Prisma Client is accessible
RUN test -d node_modules/.prisma/client && echo "Prisma client found" || echo "WARNING: Prisma client not found"

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

