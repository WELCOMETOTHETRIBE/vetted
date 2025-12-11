import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface ContentSuggestion {
  content: string
  tone: "professional" | "casual" | "thoughtful" | "enthusiastic"
  topics: string[]
}

/**
 * Generate post content suggestions based on user activity and interests
 */
export async function generateContentSuggestions(
  userId: string,
  tone: "professional" | "casual" | "thoughtful" | "enthusiastic" = "professional"
): Promise<ContentSuggestion[]> {
  if (!isOpenAIConfigured()) {
    return []
  }

  try {
    const openai = getOpenAIClient()

    // Get user profile and recent activity
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: {
          include: { skill: true },
          take: 10,
        },
        experiences: {
          include: { company: true },
          take: 3,
          orderBy: { startDate: "desc" },
        },
        posts: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!user) {
      return []
    }

    const userContext = `
Name: ${user.name || "User"}
Headline: ${user.profile?.headline || "Not set"}
Skills: ${user.skills.map((us: any) => us.skill.name).join(", ") || "None"}
Recent Experience: ${user.experiences.map((exp: any) => `${exp.title} at ${exp.company?.name || exp.companyName}`).join(", ") || "None"}
Recent Posts: ${user.posts.map((p: any) => p.content.substring(0, 100)).join(" | ") || "None"}
`

    const toneInstructions = {
      professional: "Professional and business-focused",
      casual: "Casual and friendly",
      thoughtful: "Thoughtful and reflective",
      enthusiastic: "Energetic and passionate",
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a social media content assistant. Generate 3 engaging post suggestions (1-2 sentences each) based on the user's profile and interests. Use ${toneInstructions[tone]} tone. Make them relevant, authentic, and engaging.`
        },
        {
          role: "user",
          content: `Generate post content suggestions for this user:\n\n${userContext}`
        }
      ],
      temperature: 0.8,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return []
    }

    // Parse suggestions
    const suggestions = content
      .split(/\n+/)
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim())
      .filter((line) => line.length > 0 && line.length < 300)
      .slice(0, 3)

    return suggestions.map((content) => ({
      content,
      tone,
      topics: [], // Could be enhanced to extract topics
    }))
  } catch (error: any) {
    console.error("Error generating content suggestions:", error)
    return []
  }
}

