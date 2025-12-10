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
  prisma = globalForPrisma.prisma ?? new PrismaClient()

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

