import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { execSync } from "child_process"

export async function POST(req: Request) {
  try {
    // For first-time setup, check if database tables exist
    let isFirstSetup = false
    let isAdmin = false

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
      isAdmin = true
    }

    try {
      // Run migrations
      // Use --schema flag to explicitly point to schema file and skip config file
      // Also set DATABASE_URL directly in the command to avoid config file issues
      const dbUrl = process.env.DATABASE_URL
      if (!dbUrl) {
        return NextResponse.json(
          { error: "DATABASE_URL environment variable is not set" },
          { status: 500 }
        )
      }

      const output = execSync(
        `DATABASE_URL="${dbUrl}" npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma --skip-generate`,
        {
          encoding: "utf-8",
          cwd: process.cwd(),
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
        output: output.split("\n").slice(-10), // Last 10 lines
        isFirstSetup,
      })
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "Migration failed",
          details: error.message,
          output: error.stdout || error.stderr,
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

