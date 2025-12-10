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
  // During build, DATABASE_URL might be a placeholder, so we'll create a dummy adapter
  let adapter = undefined;
  try {
    const { PrismaPg } = require('@prisma/adapter-pg');
    const { Pool } = require('pg');
    // Use DATABASE_URL if available, otherwise use placeholder for build
    const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
    const pool = new Pool({ connectionString });
    adapter = new PrismaPg(pool);
  } catch (e) {
    // Adapter not available - this will fail at runtime but allow build to proceed
    console.warn('Prisma adapter creation failed:', e.message);
    adapter = undefined;
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

