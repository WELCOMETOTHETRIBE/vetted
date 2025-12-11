import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface CareerInsight {
  trajectory: string
  strengths: string[]
  nextSteps: string[]
  skillGaps: Array<{
    skill: string
    reason: string
  }>
  recommendations: string[]
}

/**
 * Generate career insights and trajectory analysis
 */
export async function generateCareerInsights(userId: string): Promise<CareerInsight | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        experiences: {
          include: { company: true },
          orderBy: { startDate: "asc" },
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

    const profileText = buildProfileText(user)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a career coach analyzing a professional's career trajectory. Provide:
1. Career trajectory summary (2-3 sentences)
2. Key strengths (3-5 items)
3. Next steps in career (3-5 actionable items)
4. Skill gaps for advancement (skills they should consider learning)
5. Overall recommendations

Return JSON:
{
  "trajectory": "Career trajectory summary...",
  "strengths": ["strength1", "strength2"],
  "nextSteps": ["step1", "step2"],
  "skillGaps": [{"skill": "skill name", "reason": "why it's important"}],
  "recommendations": ["rec1", "rec2"]
}`
        },
        {
          role: "user",
          content: `Analyze this career profile:\n\n${profileText}`
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
      trajectory: parsed.trajectory || "Career analysis not available.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      skillGaps: Array.isArray(parsed.skillGaps) ? parsed.skillGaps : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    }
  } catch (error: any) {
    console.error("Error generating career insights:", error)
    return null
  }
}

function buildProfileText(user: any): string {
  const parts: string[] = []

  parts.push(`Name: ${user.name || "User"}`)
  if (user.profile?.headline) parts.push(`Headline: ${user.profile.headline}`)
  if (user.profile?.about) parts.push(`About: ${user.profile.about.substring(0, 500)}`)

  if (user.experiences.length > 0) {
    parts.push("\nCareer History:")
    user.experiences.forEach((exp: any) => {
      const company = exp.company?.name || exp.companyName || "Company"
      const duration = `${new Date(exp.startDate).getFullYear()} - ${exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).getFullYear() : "Present"}`
      parts.push(`- ${exp.title} at ${company} (${duration})`)
      if (exp.description) parts.push(`  ${exp.description.substring(0, 200)}`)
    })
  }

  if (user.educations.length > 0) {
    parts.push("\nEducation:")
    user.educations.forEach((edu: any) => {
      parts.push(`- ${edu.school}${edu.degree ? `, ${edu.degree}` : ""}`)
    })
  }

  if (user.skills.length > 0) {
    const skills = user.skills.map((us: any) => us.skill.name).join(", ")
    parts.push(`\nSkills: ${skills}`)
  }

  return parts.join("\n")
}

