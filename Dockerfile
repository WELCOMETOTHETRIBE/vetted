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
RUN cd node_modules/.prisma/client && \
    npx tsc client.ts --module commonjs --target es2020 --esModuleInterop --skipLibCheck --moduleResolution node --resolveJsonModule --outDir . 2>&1 || echo "TypeScript compilation had warnings"

# Create default.js that constructs PrismaClient from runtime
RUN cat > node_modules/.prisma/client/default.js << 'EOFJS'
const runtime = require('@prisma/client/runtime/client');
const { getPrismaClient } = runtime;
const fs = require('fs');
const path = require('path');

let config;
try {
  const classFile = path.join(__dirname, 'internal/class.ts');
  const classContent = fs.readFileSync(classFile, 'utf8');
  const schemaMatch = classContent.match(/inlineSchema["\s]*:["\s]*"((?:[^"\\]|\\.)+)"/);
  const inlineSchema = schemaMatch ? schemaMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
  config = {
    previewFeatures: [],
    clientVersion: "7.1.0",
    engineVersion: "ab635e6b9d606fa5c8fb8b1a7f909c3c3c1c98ba",
    activeProvider: "postgresql",
    inlineSchema: inlineSchema
  };
} catch (e) {
  config = {
    previewFeatures: [],
    clientVersion: "7.1.0",
    engineVersion: "ab635e6b9d606fa5c8fb8b1a7f909c3c3c1c98ba",
    activeProvider: "postgresql",
    inlineSchema: ""
  };
}

const PrismaClient = getPrismaClient(config);
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

