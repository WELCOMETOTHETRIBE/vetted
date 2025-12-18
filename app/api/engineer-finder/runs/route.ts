import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const runId = searchParams.get("runId")

    if (runId) {
      // Get specific run with results
      const run = await prisma.engineerFinderRun.findUnique({
        where: { id: runId },
        include: {
          results: {
            orderBy: { score: "desc" },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!run) {
        return NextResponse.json({ error: "Run not found" }, { status: 404 })
      }

      return NextResponse.json({
        run: {
          ...run,
          filtersJson: run.filtersJson ? JSON.parse(run.filtersJson) : null,
          results: run.results.map((r) => ({
            ...r,
            signalsJson: r.signalsJson ? JSON.parse(r.signalsJson) : [],
            enrichmentJson: r.enrichmentJson ? JSON.parse(r.enrichmentJson) : null,
          })),
        },
      })
    }

    // Get list of runs
    const runs = await prisma.engineerFinderRun.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { results: true },
        },
      },
    })

    const total = await prisma.engineerFinderRun.count()

    return NextResponse.json({
      runs: runs.map((run) => ({
        ...run,
        filtersJson: run.filtersJson ? JSON.parse(r.filtersJson) : null,
        resultCount: run._count.results,
      })),
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[engineer-finder-runs] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

