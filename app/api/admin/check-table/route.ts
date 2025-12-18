import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/check-table
 * 
 * Checks if the LinkedInProfileUrl table exists.
 * Requires authentication and admin role.
 */
export async function GET(req: Request) {
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

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // Try to query the table
    try {
      const count = await prisma.linkedInProfileUrl.count()
      return NextResponse.json({
        exists: true,
        count,
        message: `LinkedInProfileUrl table exists with ${count} URLs`,
      })
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          exists: false,
          message: "LinkedInProfileUrl table does not exist. Run migrations at /api/admin/migrate",
          error: error.message,
        })
      }
      throw error
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to check table",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

