import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCoverLetterForCandidate } from "@/lib/ai/cover-letter-candidate"
import { z } from "zod"

const coverLetterSchema = z.object({
  candidateId: z.string(),
})

/**
 * POST /api/jobs/[id]/cover-letter-candidate
 * Generate a personalized cover letter for a candidate applying to a job
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
    const data = coverLetterSchema.parse(body)

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

    // Generate cover letter
    const coverLetter = await generateCoverLetterForCandidate(candidate.id, job.id)

    if (!coverLetter) {
      return NextResponse.json(
        { error: "Failed to generate cover letter. AI service may not be configured." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      coverLetter,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company.name,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Cover letter generation error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

