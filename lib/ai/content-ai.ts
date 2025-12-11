import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface ContentRecommendation {
  postId: string
  relevanceScore: number
  reasoning: string | null
}

export interface SpamDetectionResult {
  isSpam: boolean
  confidence: number // 0-100
  reason: string | null
  category: "spam" | "inappropriate" | "harmful" | "safe" | null
}

/**
 * Detect spam or inappropriate content in posts/messages
 */
export async function detectSpam(content: string): Promise<SpamDetectionResult> {
  if (!isOpenAIConfigured()) {
    return {
      isSpam: false,
      confidence: 0,
      reason: null,
      category: null,
    }
  }

  try {
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a content moderation system. Analyze text for spam, inappropriate content, or harmful material.

Return JSON:
{
  "isSpam": true/false,
  "confidence": 0-100,
  "reason": "Brief explanation",
  "category": "spam" | "inappropriate" | "harmful" | "safe"
}

Categories:
- spam: Promotional content, scams, repetitive messages
- inappropriate: Offensive language, harassment
- harmful: Threats, dangerous content
- safe: Normal content`
        },
        {
          role: "user",
          content: `Analyze this content: "${content.substring(0, 2000)}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0]?.message?.content || "{}") as SpamDetectionResult

    return {
      isSpam: result.isSpam || false,
      confidence: Math.min(100, Math.max(0, result.confidence || 0)),
      reason: result.reason || null,
      category: result.category || null,
    }
  } catch (error: any) {
    console.error("Error detecting spam:", error)
    return {
      isSpam: false,
      confidence: 0,
      reason: null,
      category: null,
    }
  }
}

/**
 * Recommend content for a user based on their interests and connections
 */
export async function recommendContent(
  userId: string,
  posts: Array<{
    id: string
    content: string
    authorId: string
    createdAt: Date
    reactions?: Array<{ userId: string }>
    comments?: Array<{ id: string }>
  }>,
  userInterests?: string[]
): Promise<ContentRecommendation[]> {
  if (!isOpenAIConfigured() || posts.length === 0) {
    return posts.map(p => ({
      postId: p.id,
      relevanceScore: 50,
      reasoning: null,
    }))
  }

  try {
    const openai = getOpenAIClient()

    // Build posts text
    const postsText = posts.map((p, idx) => {
      const engagement = `${(p.reactions?.length || 0) + (p.comments?.length || 0)} interactions`
      return `[${idx}] Post ID: ${p.id}\nContent: ${p.content.substring(0, 300)}${p.content.length > 300 ? "..." : ""}\nEngagement: ${engagement}`
    }).join("\n\n")

    const interestsText = userInterests && userInterests.length > 0
      ? `User interests: ${userInterests.join(", ")}`
      : "No specific interests provided"

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a content recommendation system. Rank posts by relevance to the user's interests and engagement potential.

Return JSON array:
[
  {
    "postId": "post-id",
    "relevanceScore": 0-100,
    "reasoning": "Why this is relevant"
  },
  ...
]`
        },
        {
          role: "user",
          content: `${interestsText}\n\nPosts:\n${postsText}\n\nRank these posts by relevance.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return posts.map(p => ({
        postId: p.id,
        relevanceScore: 50,
        reasoning: null,
      }))
    }

    const parsed = JSON.parse(content)
    const recommendations = parsed.recommendations || parsed.results || []

    // Map back to posts
    const resultMap = new Map(
      recommendations.map((r: ContentRecommendation) => [r.postId, r])
    )

    return posts.map(p => {
      const rec = resultMap.get(p.id) as ContentRecommendation | undefined
      const defaultRec: ContentRecommendation = { postId: p.id, relevanceScore: 50, reasoning: null }
      const finalRec = rec || defaultRec
      return {
        postId: p.id,
        relevanceScore: Math.min(100, Math.max(0, finalRec.relevanceScore || 50)),
        reasoning: finalRec.reasoning || null,
      }
    }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
  } catch (error: any) {
    console.error("Error recommending content:", error)
    return posts.map(p => ({
      postId: p.id,
      relevanceScore: 50,
      reasoning: null,
    }))
  }
}

