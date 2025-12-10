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
# Create a minimal tsconfig.json for compilation
RUN cd node_modules/.prisma/client && \
    echo '{"compilerOptions":{"module":"commonjs","target":"es2020","esModuleInterop":true,"skipLibCheck":true,"moduleResolution":"node","resolveJsonModule":true,"outDir":".","declaration":false},"include":["client.ts","**/*.ts"],"exclude":["node_modules"]}' > tsconfig.json && \
    npx tsc --project tsconfig.json 2>&1 && \
    echo "TypeScript compilation completed" || (echo "TypeScript compilation failed, will use runtime fallback" && rm -f client.js)

# Create default.js that exports PrismaClient using lazy getter to avoid circular dependency
RUN cat > node_modules/.prisma/client/default.js << 'EOFJS'
const runtime = require('@prisma/client/runtime/client');

let _PrismaClient = null;
function getPrismaClient() {
  if (!_PrismaClient) {
    try {
      const modulePath = require.resolve('@prisma/client');
      delete require.cache[modulePath];
      const pc = require('@prisma/client');
      _PrismaClient = pc.PrismaClient;
    } catch (e) {
      try {
        const clientModule = require('./client.js');
        _PrismaClient = clientModule.PrismaClient;
      } catch (e2) {
        throw new Error('Failed to load PrismaClient: ' + e.message);
      }
    }
  }
  return _PrismaClient;
}

module.exports = {
  get PrismaClient() {
    return getPrismaClient();
  },
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

