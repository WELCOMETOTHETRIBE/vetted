import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { z } from "zod"

const resumeImprovementSchema = z.object({
  resumeText: z.string().min(100, "Resume text must be at least 100 characters"),
})

/**
 * POST /api/jobs/[id]/user-resume-improvement
 * Generate resume improvement suggestions for a user's resume based on a job
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

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      )
    }

    const { id: jobId } = await params
    const body = await req.json()
    const data = resumeImprovementSchema.parse(body)

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        experiences: {
          include: { company: true },
          orderBy: { startDate: "desc" },
        },
        skills: {
          include: { skill: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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

    const openai = getOpenAIClient()

    // Build job requirements summary
    const jobRequirements = `
Title: ${job.title}
Company: ${job.company.name}
Description: ${job.description?.substring(0, 1000) || ""}${job.description && job.description.length > 1000 ? "..." : ""}
${job.requirements ? `Requirements: ${job.requirements.substring(0, 1000)}${job.requirements.length > 1000 ? "..." : ""}` : ""}
`

    // Generate resume improvements
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert resume coach. Analyze a resume against a job description and provide specific, actionable improvements. Return JSON:
{
  "overallScore": 75,
  "summary": "Brief summary of overall fit",
  "strengths": ["strength1", "strength2"],
  "improvements": [
    {
      "section": "Experience",
      "suggestion": "Add more quantifiable achievements",
      "priority": "high"
    }
  ],
  "keywordSuggestions": ["keyword1", "keyword2"],
  "missingSkills": ["skill1", "skill2"],
  "actionItems": ["action1", "action2"]
}`
        },
        {
          role: "user",
          content: `Analyze this resume against this job and provide improvement suggestions:

Resume:
${data.resumeText}

Job Requirements:
${jobRequirements}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    const parsed = JSON.parse(content)

    return NextResponse.json({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company.name,
      overallScore: parsed.overallScore || 0,
      summary: parsed.summary || "",
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      keywordSuggestions: parsed.keywordSuggestions || [],
      missingSkills: parsed.missingSkills || [],
      actionItems: parsed.actionItems || [],
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error generating resume improvements:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate resume improvements" },
      { status: 500 }
    )
  }
}

