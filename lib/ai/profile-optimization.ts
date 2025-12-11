import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface ProfileOptimization {
  headline?: string
  about?: string
  skillSuggestions: string[]
  experienceSuggestions: Array<{
    experienceId: string
    suggestion: string
  }>
  missingSections: string[]
  overallFeedback: string
}

/**
 * Get AI-powered profile optimization suggestions
 */
export async function optimizeProfile(userId: string): Promise<ProfileOptimization | null> {
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

    // Build profile text
    const profileText = buildProfileText(user)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional career coach helping optimize LinkedIn-style profiles. Analyze the profile and provide:
1. An improved headline (if current one can be better)
2. An improved "About" section (if current one can be better)
3. Skill suggestions (5-10 relevant skills to add)
4. Experience description improvements (for each experience)
5. Missing sections to add
6. Overall feedback and recommendations

Return JSON:
{
  "headline": "Improved headline or null if current is good",
  "about": "Improved about section or null if current is good",
  "skillSuggestions": ["skill1", "skill2", ...],
  "experienceSuggestions": [
    {"experienceId": "exp-id", "suggestion": "improved description"}
  ],
  "missingSections": ["section1", "section2"],
  "overallFeedback": "Overall feedback and recommendations"
}`
        },
        {
          role: "user",
          content: `Analyze and optimize this profile:\n\n${profileText}`
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
      headline: parsed.headline || undefined,
      about: parsed.about || undefined,
      skillSuggestions: Array.isArray(parsed.skillSuggestions) ? parsed.skillSuggestions : [],
      experienceSuggestions: Array.isArray(parsed.experienceSuggestions) ? parsed.experienceSuggestions : [],
      missingSections: Array.isArray(parsed.missingSections) ? parsed.missingSections : [],
      overallFeedback: parsed.overallFeedback || "No specific feedback available.",
    }
  } catch (error: any) {
    console.error("Error optimizing profile:", error)
    return null
  }
}

function buildProfileText(user: any): string {
  const parts: string[] = []

  parts.push(`Name: ${user.name || "User"}`)
  parts.push(`Email: ${user.email}`)
  
  if (user.profile?.headline) {
    parts.push(`Current Headline: ${user.profile.headline}`)
  } else {
    parts.push(`Current Headline: Not set`)
  }

  if (user.profile?.about) {
    parts.push(`Current About: ${user.profile.about}`)
  } else {
    parts.push(`Current About: Not set`)
  }

  if (user.profile?.location) {
    parts.push(`Location: ${user.profile.location}`)
  }

  if (user.experiences.length > 0) {
    parts.push("\nExperience:")
    user.experiences.forEach((exp: any, idx: number) => {
      const company = exp.company?.name || exp.companyName || "Company"
      parts.push(`\nExperience ${idx + 1} (ID: ${exp.id}):`)
      parts.push(`  Title: ${exp.title}`)
      parts.push(`  Company: ${company}`)
      parts.push(`  Duration: ${new Date(exp.startDate).getFullYear()} - ${exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).getFullYear() : "Present"}`)
      if (exp.description) {
        parts.push(`  Description: ${exp.description}`)
      } else {
        parts.push(`  Description: Not provided`)
      }
    })
  } else {
    parts.push("\nExperience: None")
  }

  if (user.educations.length > 0) {
    parts.push("\nEducation:")
    user.educations.forEach((edu: any) => {
      parts.push(`- ${edu.school}`)
      if (edu.degree) parts.push(`  Degree: ${edu.degree}`)
      if (edu.fieldOfStudy) parts.push(`  Field: ${edu.fieldOfStudy}`)
    })
  } else {
    parts.push("\nEducation: None")
  }

  if (user.skills.length > 0) {
    const skills = user.skills.map((us: any) => us.skill.name).join(", ")
    parts.push(`\nCurrent Skills: ${skills}`)
  } else {
    parts.push(`\nCurrent Skills: None`)
  }

  return parts.join("\n")
}

