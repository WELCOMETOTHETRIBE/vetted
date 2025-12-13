import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateResumeUpdates } from "@/lib/ai/resume-updates"
import { z } from "zod"

const resumeUpdateSchema = z.object({
  candidateId: z.string(),
})

/**
 * POST /api/jobs/[id]/resume-update
 * Generate resume updates/modifications for a candidate based on a job
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
    const data = resumeUpdateSchema.parse(body)

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

    // Generate resume updates
    const resumeUpdates = await generateResumeUpdates(candidate.id, job.id)

    if (!resumeUpdates) {
      return NextResponse.json(
        { error: "Failed to generate resume updates" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company.name,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      ...resumeUpdates,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Resume update error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

