import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculatePredictiveScore } from "@/lib/ai/predictive-scoring"

/**
 * GET endpoint to get top 3 recommended jobs for a candidate
 * Calculates predictive scores for all active jobs and returns top 3
 */
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
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // Get all active jobs
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
      take: 100, // Limit to first 100 jobs for performance
    })

    if (jobs.length === 0) {
      return NextResponse.json({
        topJobs: [],
        message: "No active jobs found",
      })
    }

    // Calculate scores for all jobs
    const jobScores = await Promise.all(
      jobs.map(async (job) => {
        const scoreResult = await calculatePredictiveScore(candidate, job)
        if (!scoreResult) {
          return null
        }
        return {
          job,
          score: scoreResult.score,
          confidence: scoreResult.confidence,
          riskFactors: scoreResult.riskFactors,
          reasoning: scoreResult.reasoning,
          strengths: scoreResult.strengths,
          concerns: scoreResult.concerns,
        }
      })
    )

    // Filter out null results and sort by score (descending)
    const validScores = jobScores
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Get top 3

    // Format response
    const topJobs = validScores.map((item) => ({
      jobId: item.job.id,
      jobTitle: item.job.title,
      companyName: item.job.company?.name || "Unknown",
      companyId: item.job.company?.id,
      location: item.job.location,
      isRemote: item.job.isRemote,
      isHybrid: item.job.isHybrid,
      employmentType: item.job.employmentType,
      score: item.score,
      confidence: item.confidence,
      riskFactors: item.riskFactors,
      reasoning: item.reasoning,
      strengths: item.strengths,
      concerns: item.concerns,
    }))

    return NextResponse.json({
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      topJobs,
      count: topJobs.length,
    })
  } catch (error: any) {
    console.error("Error getting top jobs:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

