FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

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

# Install TypeScript to compile Prisma client files
RUN npm install --save-dev typescript

# Compile TypeScript client files to JavaScript for Next.js page data collection
# Compile all TypeScript files, not just client.ts, to ensure dependencies are available
RUN cd node_modules/.prisma/client && \
    echo '{"compilerOptions":{"module":"commonjs","target":"es2020","esModuleInterop":true,"skipLibCheck":true,"moduleResolution":"node","resolveJsonModule":true,"outDir":".","declaration":false,"allowSyntheticDefaultImports":true},"include":["**/*.ts"],"exclude":["node_modules"]}' > tsconfig.json && \
    npx tsc --project tsconfig.json 2>&1 && \
    echo "TypeScript compilation completed" && \
    # Fix require paths to include .js extensions for Node.js compatibility
    sed -i 's/require("\.\/\([^"]*\)")/require(".\/\1.js")/g' client.js && \
    sed -i 's/require('\''\.\/\([^'\'']*\)'\'')/require('\''.\/\1.js'\'')/g' client.js || \
    (echo "TypeScript compilation failed, will use runtime fallback" && rm -f client.js)

# Create default.js that exports PrismaClient from compiled client.js
# Verify client.js exists and exports PrismaClient correctly
RUN cd node_modules/.prisma/client && \
    if [ -f client.js ]; then \
      echo "client.js exists, checking exports..."; \
      node -e "const c = require('./client.js'); console.log('PrismaClient type:', typeof c.PrismaClient);" || echo "Warning: client.js may not export PrismaClient correctly"; \
    else \
      echo "Warning: client.js not found after TypeScript compilation"; \
    fi

# Create default.js that uses internal/class.js to get PrismaClient
# The compiled client.js has ES module features that don't work in CommonJS context
RUN cat > node_modules/.prisma/client/default.js << 'EOFJS'
const runtime = require('@prisma/client/runtime/client');

let PrismaClient;

try {
  const classModule = require('./internal/class.js');
  if (classModule && classModule.getPrismaClientClass) {
    const ClientClass = classModule.getPrismaClientClass();
    PrismaClient = class extends ClientClass {
      constructor(options) {
        super(options || {});
      }
    };
  } else {
    throw new Error('class.js does not export getPrismaClientClass');
  }
} catch (e) {
  PrismaClient = class PrismaClient {
    constructor() {
      throw new Error('PrismaClient not found. Error: ' + e.message);
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

COPY --from=builder /app/public ./public

# Copy Prisma Client (required for runtime)
# Must copy before standalone to ensure it's available
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Next.js build output (standalone includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure Prisma Client is accessible
RUN test -d node_modules/.prisma/client && echo "Prisma client found" || echo "WARNING: Prisma client not found"
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

