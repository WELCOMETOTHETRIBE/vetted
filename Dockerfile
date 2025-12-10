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

# Create default.js that tries compiled client.js first, then constructs from runtime
RUN cat > node_modules/.prisma/client/default.js << 'EOFJS'
const runtime = require('@prisma/client/runtime/client');
const { getPrismaClient } = runtime;
const fs = require('fs');
const path = require('path');

let PrismaClient;
try {
  const client = require('./client.js');
  PrismaClient = client.PrismaClient;
} catch (e) {
  try {
    const classFile = path.join(__dirname, 'internal/class.ts');
    const classContent = fs.readFileSync(classFile, 'utf8');
    const schemaMatch = classContent.match(/inlineSchema["\s]*:["\s]*"((?:[^"\\]|\\.)+)"/);
    const inlineSchema = schemaMatch ? schemaMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
    const runtimeDataModelMatch = classContent.match(/config\.runtimeDataModel\s*=\s*JSON\.parse\("((?:[^"\\]|\\.)+)"\)/);
    let runtimeDataModel = { models: {}, enums: {}, types: {} };
    if (runtimeDataModelMatch) {
      try {
        const jsonStr = runtimeDataModelMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '');
        runtimeDataModel = JSON.parse(jsonStr);
      } catch (e) {}
    }
    const ClientClass = getPrismaClient({
      previewFeatures: [],
      clientVersion: "7.1.0",
      engineVersion: "ab635e6b9d606fa5c8fb8b1a7f909c3c3c1c98ba",
      activeProvider: "postgresql",
      inlineSchema: inlineSchema,
      runtimeDataModel: runtimeDataModel,
      compilerWasm: {
        getRuntime: async () => await import("@prisma/client/runtime/query_compiler_bg.postgresql.mjs"),
        getQueryCompilerWasmModule: async () => {
          const { wasm } = await import("@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.mjs");
          const { Buffer } = await import('node:buffer');
          const wasmArray = Buffer.from(wasm, 'base64');
          return new WebAssembly.Module(wasmArray);
        }
      }
    });
    PrismaClient = class extends ClientClass {
      constructor(options) {
        super(options || {});
      }
    };
  } catch (e2) {
    PrismaClient = class PrismaClient {
      constructor() {
        throw new Error('PrismaClient initialization failed');
      }
    };
  }
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

