import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

/**
 * POST /api/jobs/[id]/user-interview-prep
 * Generate interview questions and insights for a user applying to a job
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

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        experiences: {
          include: { company: true },
          orderBy: { startDate: "desc" },
        },
        educations: {
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

    // Build user profile text
    const userProfile = buildUserProfileText(user)

    // Build job description
    const jobDescription = `
Title: ${job.title}
Company: ${job.company.name}
Location: ${job.location || "Not specified"}
Employment Type: ${job.employmentType}
${job.isRemote ? "Remote: Yes" : ""}
${job.isHybrid ? "Hybrid: Yes" : ""}
Description: ${job.description?.substring(0, 1000) || ""}${job.description && job.description.length > 1000 ? "..." : ""}
${job.requirements ? `Requirements: ${job.requirements.substring(0, 500)}${job.requirements.length > 500 ? "..." : ""}` : ""}
`

    // Generate interview questions
    const questionsResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert interview coach. Generate interview questions for a candidate applying to a job. Provide:
1. Technical questions (3-5) - role-specific technical questions
2. Behavioral questions (3-5) - STAR method questions
3. Role-specific questions (2-3) - questions about the specific role

Return JSON:
{
  "technical": ["question1", "question2"],
  "behavioral": ["question1", "question2"],
  "roleSpecific": ["question1", "question2"]
}`
        },
        {
          role: "user",
          content: `Generate interview questions for this candidate applying to this job:

Candidate Profile:
${userProfile}

Job Details:
${jobDescription}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    // Generate interview insights
    const insightsResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert interview coach. Provide insights and tips for a candidate. Return JSON:
{
  "strengths": ["strength1", "strength2"],
  "talkingPoints": ["point1", "point2"],
  "questionsToAsk": ["question1", "question2"],
  "tips": ["tip1", "tip2"]
}`
        },
        {
          role: "user",
          content: `Provide interview insights for this candidate:

Candidate Profile:
${userProfile}

Job Details:
${jobDescription}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const questions = JSON.parse(questionsResponse.choices[0]?.message?.content || "{}")
    const insights = JSON.parse(insightsResponse.choices[0]?.message?.content || "{}")

    return NextResponse.json({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company.name,
      questions: {
        technical: questions.technical || [],
        behavioral: questions.behavioral || [],
        roleSpecific: questions.roleSpecific || [],
      },
      insights: {
        strengths: insights.strengths || [],
        talkingPoints: insights.talkingPoints || [],
        questionsToAsk: insights.questionsToAsk || [],
        tips: insights.tips || [],
      },
    })
  } catch (error: any) {
    console.error("Error generating interview prep:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate interview prep" },
      { status: 500 }
    )
  }
}

function buildUserProfileText(user: any): string {
  const parts: string[] = []

  parts.push(`Name: ${user.name || "Candidate"}`)
  
  if (user.profile?.headline) {
    parts.push(`Headline: ${user.profile.headline}`)
  }

  if (user.profile?.about) {
    parts.push(`About: ${user.profile.about.substring(0, 300)}${user.profile.about.length > 300 ? "..." : ""}`)
  }

  if (user.experiences.length > 0) {
    parts.push("\nExperience:")
    user.experiences.slice(0, 5).forEach((exp: any) => {
      const company = exp.company?.name || exp.companyName || "Company"
      const duration = exp.isCurrent
        ? `${new Date(exp.startDate).getFullYear()} - Present`
        : exp.endDate
        ? `${new Date(exp.startDate).getFullYear()} - ${new Date(exp.endDate).getFullYear()}`
        : new Date(exp.startDate).getFullYear()
      parts.push(`- ${exp.title} at ${company} (${duration})`)
      if (exp.description) {
        parts.push(`  ${exp.description.substring(0, 200)}${exp.description.length > 200 ? "..." : ""}`)
      }
    })
  }

  if (user.educations.length > 0) {
    parts.push("\nEducation:")
    user.educations.forEach((edu: any) => {
      parts.push(`- ${edu.degree || "Degree"} from ${edu.school}`)
      if (edu.fieldOfStudy) {
        parts.push(`  Field: ${edu.fieldOfStudy}`)
      }
    })
  }

  if (user.skills.length > 0) {
    const skills = user.skills.map((us: any) => us.skill.name).join(", ")
    parts.push(`\nSkills: ${skills}`)
  }

  return parts.join("\n")
}

