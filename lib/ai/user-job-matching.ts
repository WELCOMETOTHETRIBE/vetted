import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface UserJobMatchResult {
  matchScore: number // 0-100
  reasoning: string
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}

/**
 * Match a user to a specific job based on their profile
 */
export async function matchUserToJob(
  userId: string,
  jobId: string
): Promise<UserJobMatchResult | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      throw new Error("User not found")
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
      },
    })

    if (!job) {
      throw new Error("Job not found")
    }

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
Description: ${job.description.substring(0, 1000)}${job.description.length > 1000 ? "..." : ""}
${job.requirements ? `Requirements: ${job.requirements.substring(0, 500)}${job.requirements.length > 500 ? "..." : ""}` : ""}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert recruiter analyzing how well a candidate matches a job. Provide:
1. Match score (0-100) - overall fit percentage
2. Reasoning - brief explanation of the match quality
3. Strengths - what makes them a good fit (3-5 items)
4. Gaps - what might be missing or needs improvement (2-4 items)
5. Recommendations - actionable steps to improve their match (2-3 items)

Return JSON:
{
  "matchScore": 85,
  "reasoning": "Strong match because...",
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`
        },
        {
          role: "user",
          content: `Analyze how well this candidate matches the job:

Candidate Profile:
${userProfile}

Job Details:
${jobDescription}`
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

    return {
      matchScore: Math.min(100, Math.max(0, parsed.matchScore || 0)),
      reasoning: parsed.reasoning || "Analysis not available",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    }
  } catch (error: any) {
    console.error("Error matching user to job:", error)
    return null
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

