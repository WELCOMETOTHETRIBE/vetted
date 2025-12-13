import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/jobs/bulk-delete
 * 
 * Bulk delete multiple jobs by their IDs.
 * Requires admin authentication.
 */
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

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { jobIds } = body

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "jobIds must be a non-empty array" },
        { status: 400 }
      )
    }

    // Delete jobs
    const result = await prisma.job.deleteMany({
      where: {
        id: {
          in: jobIds,
        },
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} job${result.count !== 1 ? "s" : ""}`,
    })
  } catch (error: any) {
    console.error("[jobs/bulk-delete] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete jobs",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

