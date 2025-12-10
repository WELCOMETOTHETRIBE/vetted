import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import { join } from "path"

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await context.params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const formData = await req.formData()
    const resume = formData.get("resume") as File
    const coverLetter = formData.get("coverLetter") as string | null

    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: session.user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Already applied" },
        { status: 400 }
      )
    }

    // Save resume file (simplified - in production, use cloud storage)
    let resumeUrl: string | null = null
    if (resume) {
      const bytes = await resume.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `${jobId}-${session.user.id}-${Date.now()}.${resume.name.split('.').pop()}`
      const path = join(process.cwd(), "public", "resumes", filename)
      await writeFile(path, buffer)
      resumeUrl = `/resumes/${filename}`
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        applicantId: session.user.id,
        resumeUrl,
        coverLetter: coverLetter || null,
        status: "APPLIED",
      },
    })

    // Create notification for job poster
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { postedById: true, title: true },
    })

    if (job) {
      await prisma.notification.create({
        data: {
          userId: job.postedById,
          type: "JOB_APPLICATION_RECEIVED",
          title: "New Job Application",
          message: `Someone applied for your job: ${job.title}`,
          link: `/jobs/${jobId}/applicants`,
        },
      })
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Apply to job error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

