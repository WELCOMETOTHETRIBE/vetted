import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/candidates/bulk-delete
 * 
 * Bulk delete multiple candidates by their IDs.
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
    const { candidateIds } = body

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { error: "candidateIds must be a non-empty array" },
        { status: 400 }
      )
    }

    // Delete candidates
    const result = await prisma.candidate.deleteMany({
      where: {
        id: {
          in: candidateIds,
        },
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} candidate${result.count !== 1 ? "s" : ""}`,
    })
  } catch (error: any) {
    console.error("[candidates/bulk-delete] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete candidates",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

