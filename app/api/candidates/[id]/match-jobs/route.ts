import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { matchCandidateToJobs } from "@/lib/ai/job-matching"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Get active jobs
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 50, // Limit to 50 jobs for matching
    })

    if (jobs.length === 0) {
      return NextResponse.json({
        matches: [],
        message: "No active jobs found",
      })
    }

    // Match candidate to jobs
    const matches = await matchCandidateToJobs(candidate, jobs as any)

    return NextResponse.json({
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      matches,
      totalJobs: jobs.length,
    })
  } catch (error: any) {
    console.error("Job matching error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

