import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFileSync, existsSync, readFileSync } from "fs"
import { join } from "path"

export async function POST(req: Request) {
  try {
    // For first-time setup, check if database tables exist
    let isFirstSetup = false

    try {
      // Try to check if User table exists and count users
      const userCount = await prisma.user.count()
      isFirstSetup = userCount === 0
    } catch (error: any) {
      // If query fails, tables probably don't exist - this is first setup
      if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
        isFirstSetup = true
      } else {
        // Some other error - rethrow it
        throw error
      }
    }

    // If not first setup, require admin authentication
    if (!isFirstSetup) {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })

      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
      }
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL environment variable is not set" },
        { status: 500 }
      )
    }

    // Use Prisma's programmatic API to push schema
    // This bypasses the CLI and config file issues
    try {
      // Import Prisma's migrate programmatically
      // We'll use a workaround: execute prisma db push via Node's child_process
      // but with explicit schema content passed via stdin or environment
      
      // Create a temporary schema file in /tmp with DATABASE_URL embedded
      const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
      const originalSchema = readFileSync(schemaPath, 'utf-8')
      
      // Create temp schema with explicit DATABASE_URL
      const tempSchemaPath = '/tmp/schema.migrate.prisma'
      const tempSchema = originalSchema.replace(
        /datasource db \{[^}]*\}/,
        `datasource db {
  provider = "postgresql"
  url      = "${dbUrl.replace(/"/g, '\\"')}"
}`
      )
      
      writeFileSync(tempSchemaPath, tempSchema)

      // Create a minimal dummy config file in /tmp to satisfy Prisma
      const tempConfigPath = '/tmp/prisma.config.ts'
      const dummyConfig = `export default {
  schema: "${tempSchemaPath}",
  datasource: {
    url: "${dbUrl.replace(/"/g, '\\"')}",
  },
};`
      writeFileSync(tempConfigPath, dummyConfig)

      // Import execSync synchronously
      const { execSync } = require('child_process')
      
      // Run prisma db push with explicit schema and config
      // Set working directory to /tmp to use our dummy config
      const output = execSync(
        `npx --yes prisma db push --accept-data-loss --schema=${tempSchemaPath} --config=${tempConfigPath}`,
        {
          encoding: "utf-8",
          cwd: '/tmp', // Change working directory to use dummy config
          env: { 
            ...process.env,
            DATABASE_URL: dbUrl,
          },
          shell: "/bin/sh",
        }
      )

      return NextResponse.json({
        success: true,
        message: "Migrations completed successfully",
        output: output.split("\n").slice(-10),
        isFirstSetup,
      })
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "Migration failed",
          details: error.message,
          output: error.stdout || error.stderr || error.toString(),
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
