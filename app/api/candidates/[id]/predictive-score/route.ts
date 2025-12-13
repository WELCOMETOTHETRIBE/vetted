import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculatePredictiveScore } from "@/lib/ai/predictive-scoring"

export async function POST(
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
    const body = await req.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      )
    }

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

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Calculate predictive score
    const scoreResult = await calculatePredictiveScore(candidate, job)

    if (!scoreResult) {
      return NextResponse.json(
        { error: "Failed to calculate predictive score" },
        { status: 500 }
      )
    }

    // Save score to database
    await prisma.candidate.update({
      where: { id },
      data: {
        predictiveScore: scoreResult.score,
        scoreConfidence: scoreResult.confidence,
        scoreRiskFactors: JSON.stringify(scoreResult.riskFactors),
        scoreGeneratedAt: new Date(),
        scoreJobId: jobId,
      },
    })

    return NextResponse.json({
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company?.name,
      score: scoreResult.score,
      confidence: scoreResult.confidence,
      riskFactors: scoreResult.riskFactors,
      reasoning: scoreResult.reasoning,
      strengths: scoreResult.strengths,
      concerns: scoreResult.concerns,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Predictive scoring error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to retrieve existing predictive score
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
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("jobId")

    // Get candidate with score
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        predictiveScore: true,
        scoreConfidence: true,
        scoreRiskFactors: true,
        scoreGeneratedAt: true,
        scoreJobId: true,
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // If jobId provided, check if score matches
    if (jobId && candidate.scoreJobId !== jobId) {
      return NextResponse.json({
        message: "No score found for this job",
        hasScore: false,
      })
    }

    if (!candidate.predictiveScore) {
      return NextResponse.json({
        message: "No predictive score calculated yet",
        hasScore: false,
      })
    }

    return NextResponse.json({
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      jobId: candidate.scoreJobId,
      score: candidate.predictiveScore,
      confidence: candidate.scoreConfidence,
      riskFactors: candidate.scoreRiskFactors
        ? JSON.parse(candidate.scoreRiskFactors)
        : [],
      generatedAt: candidate.scoreGeneratedAt?.toISOString(),
      hasScore: true,
    })
  } catch (error: any) {
    console.error("Error retrieving predictive score:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

