import { isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface ConnectionRecommendation {
  userId: string
  name: string
  image: string | null
  handle: string | null
  headline: string | null
  relevanceScore: number // 0-100
  reasoning: string
  commonalities: string[]
}

/**
 * Get AI-powered connection recommendations for a user
 */
export async function getConnectionRecommendations(
  userId: string,
  limit: number = 10
): Promise<ConnectionRecommendation[]> {
  if (!isOpenAIConfigured()) {
    // Fallback to basic recommendations without AI
    return getBasicRecommendations(userId, limit)
  }

  try {
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
        connectionsAsRequester: {
          where: { status: "ACCEPTED" },
          select: { receiverId: true },
        },
        connectionsAsReceiver: {
          where: { status: "ACCEPTED" },
          select: { requesterId: true },
        },
      },
    })

    if (!user) {
      return []
    }

    // Get all connected user IDs
    const connectedIds = new Set<string>([userId])
    user.connectionsAsRequester.forEach((conn: { receiverId: string }) => connectedIds.add(conn.receiverId))
    user.connectionsAsReceiver.forEach((conn: { requesterId: string }) => connectedIds.add(conn.requesterId))

    // Get potential connections (not already connected, not pending)
    const potentialConnections = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(connectedIds) },
        isActive: true,
      },
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
      take: 50, // Get more candidates for AI to rank
    })

    if (potentialConnections.length === 0) {
      return []
    }

    // Build user profile text
    const userProfile = buildUserProfileText(user)

    // Build potential connections text
    const connectionsText = potentialConnections.map((conn: any, idx: number) => {
      const connProfile = buildUserProfileText(conn)
      return `Candidate ${idx + 1} (ID: ${conn.id}):\n${connProfile}`
    }).join("\n\n---\n\n")

    const openai = (await import("@/lib/openai")).getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a networking assistant. Analyze potential connections and rank them by relevance. Consider:
1. Shared skills, experiences, or education
2. Similar career paths or industries
3. Mutual connections (if available)
4. Complementary skills or expertise
5. Geographic proximity (if available)

Return JSON array with top recommendations:
[
  {
    "userId": "user-id-here",
    "relevanceScore": 85,
    "reasoning": "Strong match because...",
    "commonalities": ["common1", "common2"]
  },
  ...
]

Rank by relevance score (0-100), highest first.`
        },
        {
          role: "user",
          content: `My Profile:
${userProfile}

Potential Connections:
${connectionsText}

Rank these connections by relevance to me.`
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
    let recommendations: any[] = []
    
    if (Array.isArray(parsed)) {
      recommendations = parsed
    } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      recommendations = parsed.recommendations
    } else if (parsed.results && Array.isArray(parsed.results)) {
      recommendations = parsed.results
    }

    // Enrich with user details
    const enriched: ConnectionRecommendation[] = recommendations
      .slice(0, limit)
      .map((rec: any) => {
        const conn = potentialConnections.find((c: any) => c.id === rec.userId)
        if (!conn) return null

        return {
          userId: conn.id,
          name: conn.name || "User",
          image: conn.image,
          handle: conn.handle,
          headline: conn.profile?.headline || null,
          relevanceScore: Math.min(100, Math.max(0, rec.relevanceScore || 0)),
          reasoning: rec.reasoning || "Recommended connection",
          commonalities: Array.isArray(rec.communalities) ? rec.communalities : [],
        }
      })
      .filter((r): r is ConnectionRecommendation => r !== null)

    return enriched
  } catch (error: any) {
    console.error("Error getting connection recommendations:", error)
    // Fallback to basic recommendations
    return getBasicRecommendations(userId, limit)
  }
}

function buildUserProfileText(user: any): string {
  const parts: string[] = []

  parts.push(`Name: ${user.name || "User"}`)
  
  if (user.profile?.headline) {
    parts.push(`Headline: ${user.profile.headline}`)
  }

  if (user.profile?.location) {
    parts.push(`Location: ${user.profile.location}`)
  }

  if (user.experiences.length > 0) {
    parts.push("\nExperience:")
    user.experiences.slice(0, 3).forEach((exp: any) => {
      const company = exp.company?.name || exp.companyName || "Company"
      parts.push(`- ${exp.title} at ${company}`)
    })
  }

  if (user.educations.length > 0) {
    parts.push("\nEducation:")
    user.educations.slice(0, 2).forEach((edu: any) => {
      parts.push(`- ${edu.school}`)
    })
  }

  if (user.skills.length > 0) {
    const skills = user.skills.slice(0, 10).map((us: any) => us.skill.name).join(", ")
    parts.push(`\nSkills: ${skills}`)
  }

  return parts.join("\n")
}

async function getBasicRecommendations(userId: string, limit: number): Promise<ConnectionRecommendation[]> {
  // Fallback: get users with similar skills
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: {
        include: { skill: true },
      },
      connectionsAsRequester: {
        select: { receiverId: true },
      },
      connectionsAsReceiver: {
        select: { requesterId: true },
      },
    },
  })

  if (!user) {
    return []
  }

  const connectedIds = new Set<string>([userId])
  user.connectionsAsRequester.forEach((conn: { receiverId: string }) => connectedIds.add(conn.receiverId))
  user.connectionsAsReceiver.forEach((conn: { requesterId: string }) => connectedIds.add(conn.requesterId))

  const userSkillIds = user.skills.map((us: { skillId: string }) => us.skillId)

  if (userSkillIds.length === 0) {
    // No skills, just return random active users
    const randomUsers = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(connectedIds) },
        isActive: true,
      },
      include: {
        profile: true,
      },
      take: limit,
    })

    return randomUsers.map((u: any) => ({
      userId: u.id,
      name: u.name || "User",
      image: u.image,
      handle: u.handle,
      headline: u.profile?.headline || null,
      relevanceScore: 50,
      reasoning: "Potential connection",
      commonalities: [],
    }))
  }

  // Find users with similar skills
  const similarUsers = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(connectedIds) },
      isActive: true,
      skills: {
        some: {
          skillId: { in: userSkillIds },
        },
      },
    },
    include: {
      profile: true,
      skills: {
        include: { skill: true },
      },
    },
    take: limit * 2, // Get more to rank
  })

    // Rank by number of common skills
    const ranked = similarUsers
      .map((u: any) => {
        const commonSkills = u.skills.filter((us: { skillId: string }) =>
          userSkillIds.includes(us.skillId)
        )
        return {
          user: u,
          commonSkillsCount: commonSkills.length,
          commonSkills: commonSkills.map((us: { skill: { name: string } }) => us.skill.name),
        }
      })
      .sort((a: any, b: any) => b.commonSkillsCount - a.commonSkillsCount)
      .slice(0, limit)

  return ranked.map((r: any) => ({
    userId: r.user.id,
    name: r.user.name || "User",
    image: r.user.image,
    handle: r.user.handle,
    headline: r.user.profile?.headline || null,
    relevanceScore: Math.min(100, (r.commonSkillsCount / userSkillIds.length) * 100),
    reasoning: `${r.commonSkillsCount} shared skill${r.commonSkillsCount !== 1 ? "s" : ""}`,
    commonalities: r.commonSkills,
  }))
}

