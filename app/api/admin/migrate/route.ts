import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { execSync } from "child_process"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // For first-time setup, allow if no users exist yet
    const userCount = await prisma.user.count()
    const isFirstSetup = userCount === 0

    if (!isFirstSetup && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    try {
      // Run migrations
      const output = execSync("npx prisma db push --accept-data-loss", {
        encoding: "utf-8",
        cwd: process.cwd(),
        env: { ...process.env },
      })

      return NextResponse.json({
        success: true,
        message: "Migrations completed successfully",
        output: output.split("\n").slice(-10), // Last 10 lines
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

