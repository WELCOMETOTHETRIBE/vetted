import { NextResponse } from "next/server"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

/**
 * Tech Trends API endpoint.
 * 
 * Fetches latest technology trends using SerpAPI (same as job scraper)
 * and enriches them with AI-generated highlights.
 * 
 * Uses SERPAPI_KEY environment variable (same as job scraper).
 */
interface TrendItem {
  title: string
  url: string
  source: string
  published_at: string | null
  highlight: string
  category: string
  raw_excerpt: string
}

interface TrendsResponse {
  items: TrendItem[]
  last_updated: string
}

// Predefined search queries for tech trends
const TREND_QUERIES = [
  {
    query: "latest technology trends startups 2025",
    category: "startups",
    num_results: 10,
  },
  {
    query: "software engineering emerging trends",
    category: "software_engineering",
    num_results: 10,
  },
  {
    query: "AI startup news artificial intelligence",
    category: "ai",
    num_results: 10,
  },
  {
    query: "engineering firm technology innovations",
    category: "engineering",
    num_results: 10,
  },
]

async function fetchTrendsFromSerpAPI(): Promise<any[]> {
  const serpapiKey = process.env.SERPAPI_KEY
  if (!serpapiKey) {
    console.warn("[trends] SERPAPI_KEY not set")
    return []
  }

  const allResults: any[] = []
  const region = process.env.TRENDS_REGION || "us"

  for (const queryConfig of TREND_QUERIES) {
    try {
      const params = new URLSearchParams({
        engine: "google",
        q: queryConfig.query,
        api_key: serpapiKey,
        num: String(queryConfig.num_results),
        gl: region,
        hl: "en",
      })

      const response = await fetch(`https://serpapi.com/search?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        console.error(`[trends] SerpAPI error for query "${queryConfig.query}": ${response.status}`)
        continue
      }

      const data = await response.json()
      const items = data.organic_results || []

      // Add category to each item
      for (const item of items) {
        allResults.push({
          ...item,
          category: queryConfig.category,
        })
      }

      console.log(`[trends] Fetched ${items.length} results for "${queryConfig.query}"`)
    } catch (error: any) {
      console.error(`[trends] Error fetching query "${queryConfig.query}":`, error.message)
      continue
    }
  }

  return allResults
}

function normalizeResults(rawItems: any[]): TrendItem[] {
  const seenUrls = new Set<string>()
  const normalized: TrendItem[] = []

  for (const item of rawItems) {
    const url = item.link || ""
    const title = item.title || ""
    const snippet = item.snippet || ""
    const category = item.category || "general"

    // Extract source domain
    let source = "unknown"
    try {
      const urlObj = new URL(url)
      source = urlObj.hostname.replace("www.", "")
    } catch {
      // Invalid URL, skip
      continue
    }

    // Parse published date if available
    let publishedAt: string | null = null
    if (item.date) {
      try {
        const date = new Date(item.date)
        if (!isNaN(date.getTime())) {
          publishedAt = date.toISOString()
        }
      } catch {
        // Date parsing failed, continue without date
      }
    }

    // Deduplicate by URL
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url)
      normalized.push({
        title,
        url,
        source,
        published_at: publishedAt,
        raw_excerpt: snippet,
        highlight: "", // Will be populated by AI
        category,
      })
    }
  }

  // Sort by published date (newest first)
  normalized.sort((a, b) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
    return dateB - dateA
  })

  return normalized
}

async function enrichWithAI(items: TrendItem[]): Promise<TrendItem[]> {
  if (!isOpenAIConfigured() || items.length === 0) {
    return items
  }

  try {
    const openai = getOpenAIClient()

    // Process in batches of 5
    const batchSize = 5
    const enriched: TrendItem[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      // Generate highlights for batch
      const messages = [
        {
          role: "system" as const,
          content: `You are a concise tech analyst for a professional networking platform called Vetted. 
Summarize each article into one short highlight (max 40 words) for a feed of tech trends. 
Mention "AI", "startups", or "software" only if relevant. Avoid fluff.
Return JSON array with one highlight per article in the same order.`,
        },
        {
          role: "user" as const,
          content: batch
            .map(
              (item, idx) =>
                `Article ${idx + 1}:\nTitle: ${item.title}\nExcerpt: ${item.raw_excerpt}\nSource: ${item.source}`
            )
            .join("\n\n"),
        },
      ]

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 200 * batch.length,
        })

        const content = response.choices[0]?.message?.content
        if (content) {
          try {
            const highlights = JSON.parse(content)
            if (Array.isArray(highlights) && highlights.length === batch.length) {
              for (let j = 0; j < batch.length; j++) {
                batch[j].highlight = String(highlights[j] || "")
              }
            }
          } catch {
            // JSON parse failed, try to extract highlights from text
            const lines = content
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line && !line.startsWith("Article"))
            if (lines.length >= batch.length) {
              for (let j = 0; j < batch.length; j++) {
                batch[j].highlight = lines[j] || ""
              }
            }
          }
        }
      } catch (error: any) {
        console.error(`[trends] Error enriching batch:`, error.message)
        // Continue without highlights for this batch
      }

      enriched.push(...batch)

      // Small delay between batches
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return enriched
  } catch (error: any) {
    console.error("[trends] Error in AI enrichment:", error.message)
    return items // Return items without highlights on error
  }
}

export async function GET(req: Request) {
  try {
    // Step 1: Fetch trends from SerpAPI
    console.log("[trends] Fetching trends from SerpAPI")
    const rawItems = await fetchTrendsFromSerpAPI()

    if (rawItems.length === 0) {
      console.warn("[trends] No trends fetched, returning empty response")
      return NextResponse.json({
        items: [],
        last_updated: new Date().toISOString(),
      })
    }

    // Step 2: Normalize results
    console.log(`[trends] Normalizing ${rawItems.length} raw items`)
    const normalizedItems = normalizeResults(rawItems)

    // Step 3: Enrich with AI highlights
    console.log(`[trends] Enriching ${normalizedItems.length} items with AI`)
    const enrichedItems = await enrichWithAI(normalizedItems)

    // Step 4: Return response
    return NextResponse.json({
      items: enrichedItems,
      last_updated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[trends] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch trends",
        items: [],
        last_updated: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
