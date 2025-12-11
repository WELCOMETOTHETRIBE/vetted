import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface SearchResult {
  id: string
  type: "person" | "job" | "company" | "group" | "candidate"
  title: string
  description?: string | null
  relevanceScore: number
  reasoning: string | null
}

/**
 * Enhance search query with semantic understanding
 * Expands the query to include related terms and concepts
 */
export async function enhanceSearchQuery(query: string): Promise<string[]> {
  if (!isOpenAIConfigured()) {
    return [query] // Return original query if AI not configured
  }

  try {
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a search query enhancer. Given a user's search query, generate alternative search terms and related concepts that would help find relevant results.

Return a JSON array of search terms (including the original query):
["original query", "related term 1", "related term 2", ...]

Keep terms concise and relevant. Include synonyms, related skills, job titles, or concepts.`
        },
        {
          role: "user",
          content: `Enhance this search query: "${query}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return [query]
    }

    const parsed = JSON.parse(content)
    const terms = parsed.terms || parsed.queries || parsed.searchTerms || [query]
    
    // Ensure original query is included and limit to 5 terms
    const enhanced = Array.isArray(terms) 
      ? [...new Set([query, ...terms])].slice(0, 5)
      : [query]

    return enhanced
  } catch (error: any) {
    console.error("Error enhancing search query:", error)
    return [query] // Fallback to original query
  }
}

/**
 * Rank search results by semantic relevance
 */
export async function rankSearchResults(
  query: string,
  results: Array<{ id: string; type: string; title: string; description?: string | null }>
): Promise<Array<SearchResult & { original: any }>> {
  if (!isOpenAIConfigured() || results.length === 0) {
    return results.map((r: any) => ({
      ...r,
      type: r.type as any,
      relevanceScore: 50, // Default score
      reasoning: null,
      original: r,
    }))
  }

  try {
    const openai = getOpenAIClient()

    // Build results text
    const resultsText = results.map((r, idx) => {
      return `[${idx}] Type: ${r.type}\nTitle: ${r.title}\nDescription: ${r.description || "N/A"}\nID: ${r.id}`
    }).join("\n\n")

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a search result ranker. Rank search results by relevance to the query.

Return JSON array with relevance scores (0-100) and brief reasoning:
[
  {
    "index": 0,
    "relevanceScore": 85,
    "reasoning": "Strong match because..."
  },
  ...
]`
        },
        {
          role: "user",
          content: `Query: "${query}"\n\nResults:\n${resultsText}\n\nRank these results by relevance.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return results.map((r: any) => ({
        ...r,
        type: r.type as any,
        relevanceScore: 50,
        reasoning: null,
        original: r,
      }))
    }

    const parsed = JSON.parse(content)
    const rankings = parsed.rankings || parsed.results || []

    // Map rankings back to results
    return results.map((r: any, idx: number) => {
      const ranking = rankings.find((rank: any) => rank.index === idx) || { relevanceScore: 50, reasoning: null }
      return {
        ...r,
        type: r.type as any,
        relevanceScore: Math.min(100, Math.max(0, ranking.relevanceScore || 50)),
        reasoning: ranking.reasoning || null,
        original: r,
      }
    }).sort((a, b) => b.relevanceScore - a.relevanceScore)
  } catch (error: any) {
    console.error("Error ranking search results:", error)
    return results.map((r: any) => ({
      ...r,
      type: r.type as any,
      relevanceScore: 50,
      reasoning: null,
      original: r,
    }))
  }
}

