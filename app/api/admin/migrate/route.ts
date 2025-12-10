import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { execSync } from "child_process"
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "fs"
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

    // Create a standalone schema file with DATABASE_URL in it
    // This avoids needing the config file
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
    const originalSchema = readFileSync(schemaPath, 'utf-8')
    
    // Create a temporary schema with url in datasource
    // Use /tmp which is writable by all users
    const tempSchemaPath = '/tmp/schema.migrate.prisma'
    const tempSchema = originalSchema.replace(
      /datasource db \{[^}]*\}/,
      `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
    )
    
    writeFileSync(tempSchemaPath, tempSchema)

    try {
      // Don't try to delete config file - just use temp schema
      // Set PRISMA_CONFIG_PATH to empty to skip config file
      const output = execSync(
        `npx prisma db push --accept-data-loss --schema=${tempSchemaPath} --skip-generate`,
        {
          encoding: "utf-8",
          cwd: process.cwd(),
          env: { 
            ...process.env,
            DATABASE_URL: dbUrl,
            // Try to skip config file by setting path to empty
            PRISMA_CONFIG_PATH: '',
          },
          shell: "/bin/sh",
        }
      )

      // Clean up temp schema
      if (existsSync(tempSchemaPath)) {
        try {
          unlinkSync(tempSchemaPath)
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      return NextResponse.json({
        success: true,
        message: "Migrations completed successfully",
        output: output.split("\n").slice(-10),
        isFirstSetup,
      })
    } catch (error: any) {
      // Clean up temp schema even on error
      if (existsSync(tempSchemaPath)) {
        try {
          unlinkSync(tempSchemaPath)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
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
