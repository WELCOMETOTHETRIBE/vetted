// Only import Prisma on the server side
let prisma: any

if (typeof window === 'undefined') {
  // Server-side only
  const { PrismaClient } = require('@prisma/client')
  
  const globalForPrisma = globalThis as unknown as {
    prisma: typeof PrismaClient | undefined
  }

  // Prisma 7: DATABASE_URL is read from environment variable
  // The schema no longer has url, it's configured in prisma.config.ts for migrations
  // Prisma 7 uses client engine by default, but should use binary engine when DATABASE_URL is set
  // and no adapter/accelerateUrl is provided
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    // Don't provide adapter or accelerateUrl - this should use binary engine
    // Prisma will read DATABASE_URL from environment
  })

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

