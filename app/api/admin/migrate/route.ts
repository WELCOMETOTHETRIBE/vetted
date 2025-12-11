import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { execSync } from "child_process"

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

    try {
      // Use Prisma CLI directly with environment variable
      // Set npm cache to a writable directory
      const output = execSync(
        `NPM_CONFIG_CACHE=/tmp/.npm npx --yes prisma db push --accept-data-loss`,
        {
          encoding: "utf-8",
          cwd: process.cwd(),
          env: { 
            ...process.env,
            DATABASE_URL: dbUrl,
            NPM_CONFIG_CACHE: "/tmp/.npm",
          },
          stdio: ['pipe', 'pipe', 'pipe'],
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      )

      return NextResponse.json({
        success: true,
        message: "Migrations completed successfully",
        output: output.split("\n").slice(-20).join("\n"),
        isFirstSetup,
      })
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || error.message || String(error)
      return NextResponse.json(
        {
          error: "Migration failed",
          details: error.message || "Unknown error",
          output: errorOutput.substring(0, 1000), // Limit output size
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message || String(error) },
      { status: 500 }
    )
  }
}
