// Only import Prisma on the server side
let prisma: any

if (typeof window === 'undefined') {
  // Server-side only
  const { PrismaClient } = require('@prisma/client')
  
  const globalForPrisma = globalThis as unknown as {
    prisma: typeof PrismaClient | undefined
  }

  // Prisma 7: Uses client engine by default which requires adapter
  // We'll use @prisma/adapter-pg for PostgreSQL connection
  // But only if DATABASE_URL is available (not during build)
  let adapter = undefined;
  if (process.env.DATABASE_URL && typeof process.env.DATABASE_URL === 'string' && !process.env.DATABASE_URL.includes('placeholder')) {
    try {
      const { PrismaPg } = require('@prisma/adapter-pg');
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      adapter = new PrismaPg(pool);
    } catch (e) {
      // Adapter not available or DATABASE_URL invalid - will fail at runtime
      adapter = undefined;
    }
  }
  
  prisma = globalForPrisma.prisma ?? new PrismaClient(adapter ? { adapter } : {})

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
} else {
  // Client-side: throw error if accidentally used
  prisma = new Proxy({} as any, {
    get() {
      throw new Error('Prisma Client cannot be used in client components')
    }
  })
}

export { prisma }

