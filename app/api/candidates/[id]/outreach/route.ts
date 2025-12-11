import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateOutreachMessage } from "@/lib/ai/outreach"
import { z } from "zod"

const outreachSchema = z.object({
  jobId: z.string().optional(),
  recruiterName: z.string().optional(),
  companyName: z.string().optional(),
})

/**
 * POST /api/candidates/[id]/outreach
 * Generate personalized outreach message for a candidate
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
      select: { role: true, name: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const data = outreachSchema.parse(body)

    // Get candidate
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Get job if provided
    let job = null
    if (data.jobId) {
      job = await prisma.job.findUnique({
        where: { id: data.jobId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    }

    // Generate message
    const message = await generateOutreachMessage(
      candidate,
      job as any,
      data.recruiterName || user.name || undefined,
      data.companyName || (job as any)?.company?.name || undefined
    )

    if (!message) {
      return NextResponse.json(
        { error: "Failed to generate message" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      jobId: job?.id || null,
      jobTitle: job?.title || null,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Generate outreach error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

