import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInterviewQuestions, generateInterviewInsights } from "@/lib/ai/interview-prep"
import { z } from "zod"

const interviewPrepSchema = z.object({
  candidateId: z.string(),
})

/**
 * POST /api/jobs/[id]/interview-prep
 * Generate interview questions and insights for a job and candidate
 */
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
    const data = interviewPrepSchema.parse(body)

    // Get job
    const job = await prisma.job.findUnique({
      where: { id },
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

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { id: data.candidateId },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Generate questions and insights in parallel
    const [questions, insights] = await Promise.all([
      generateInterviewQuestions(candidate, job as any),
      generateInterviewInsights(candidate, job as any),
    ])

    return NextResponse.json({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company.name,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      questions: questions || {
        technical: [],
        behavioral: [],
        roleSpecific: [],
        general: [],
      },
      insights: insights || {
        candidateStrengths: [],
        areasToExplore: [],
        redFlags: [],
        talkingPoints: [],
        recommendedAssessments: [],
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Interview prep error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
