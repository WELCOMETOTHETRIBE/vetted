import { NextResponse } from "next/server"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

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
  cached?: boolean
  warning?: string
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

  console.log(`[trends] Starting fetch with ${TREND_QUERIES.length} queries, region: ${region}`)

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

      console.log(`[trends] Fetching: ${queryConfig.query}`)
      const url = `https://serpapi.com/search?${params.toString()}`
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[trends] SerpAPI error for query "${queryConfig.query}": ${response.status} - ${errorText.substring(0, 200)}`)
        continue
      }

      const data = await response.json()
      
      // Check for SerpAPI errors in response
      if (data.error) {
        console.error(`[trends] SerpAPI returned error for "${queryConfig.query}":`, data.error)
        continue
      }

      const items = data.organic_results || []
      console.log(`[trends] Got ${items.length} results for "${queryConfig.query}"`)

      // Add category to each item
      for (const item of items) {
        allResults.push({
          ...item,
          category: queryConfig.category,
        })
      }
    } catch (error: any) {
      console.error(`[trends] Error fetching query "${queryConfig.query}":`, error.message)
      continue
    }
  }

  console.log(`[trends] Total results fetched: ${allResults.length}`)
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
            // Try to extract JSON from markdown code blocks
            let jsonContent = content.trim()
            if (jsonContent.startsWith("```json")) {
              jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
            } else if (jsonContent.startsWith("```")) {
              jsonContent = jsonContent.replace(/```\n?/g, "").trim()
            }
            
            const highlights = JSON.parse(jsonContent)
            if (Array.isArray(highlights) && highlights.length === batch.length) {
              for (let j = 0; j < batch.length; j++) {
                const highlight = String(highlights[j] || "").trim()
                // Remove quotes if wrapped
                batch[j].highlight = highlight.replace(/^["']|["']$/g, "")
              }
            }
          } catch {
            // JSON parse failed, try to extract highlights from text
            const lines = content
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => {
                const trimmed = line.trim()
                return (
                  trimmed &&
                  !trimmed.startsWith("Article") &&
                  !trimmed.startsWith("```") &&
                  !trimmed.startsWith("[") &&
                  !trimmed.startsWith("{") &&
                  trimmed.length > 10 // Filter out very short lines
                )
              })
            if (lines.length >= batch.length) {
              for (let j = 0; j < batch.length; j++) {
                let highlight = lines[j] || ""
                // Clean up quotes and formatting
                highlight = highlight.replace(/^["',\[\]]+|["',\[\]]+$/g, "").trim()
                batch[j].highlight = highlight
              }
            } else {
              // Fallback: use raw excerpt as highlight if parsing fails
              for (let j = 0; j < batch.length; j++) {
                batch[j].highlight = batch[j].raw_excerpt.substring(0, 150) + "..."
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
    const CACHE_DURATION_HOURS = 1 // Cache trends for 1 hour
    const CLEANUP_AGE_HOURS = 24 // Delete trends older than 24 hours

    // Step 1: Check for cached trends (within last hour)
    const cacheCutoff = new Date(Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000)
    const cachedTrends = await prisma.trend.findMany({
      where: {
        createdAt: {
          gte: cacheCutoff,
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 50, // Limit to 50 most recent trends
    })

    if (cachedTrends.length > 0) {
      console.log(`[trends] Returning ${cachedTrends.length} cached trends`)
      return NextResponse.json({
        items: cachedTrends.map((trend) => ({
          title: trend.title,
          url: trend.url,
          source: trend.source,
          published_at: trend.publishedAt?.toISOString() || null,
          highlight: trend.highlight,
          category: trend.category,
          raw_excerpt: trend.rawExcerpt,
        })),
        last_updated: cachedTrends[0]?.createdAt.toISOString() || new Date().toISOString(),
        cached: true,
      })
    }

    // Step 2: No cached trends, fetch new ones
    console.log("[trends] No cached trends found, fetching new trends from SerpAPI")

    // Check SERPAPI_KEY
    if (!process.env.SERPAPI_KEY) {
      console.error("[trends] SERPAPI_KEY not configured")
      // Try to return old trends even if expired
      const oldTrends = await prisma.trend.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      })
      if (oldTrends.length > 0) {
        return NextResponse.json({
          items: oldTrends.map((trend) => ({
            title: trend.title,
            url: trend.url,
            source: trend.source,
            published_at: trend.publishedAt?.toISOString() || null,
            highlight: trend.highlight,
            category: trend.category,
            raw_excerpt: trend.rawExcerpt,
          })),
          last_updated: oldTrends[0]?.createdAt.toISOString() || new Date().toISOString(),
          cached: true,
          warning: "Using stale data - SERPAPI_KEY not configured",
        })
      }
      return NextResponse.json(
        {
          error: "SERPAPI_KEY not configured",
          items: [],
          last_updated: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Step 3: Fetch trends from SerpAPI
    const rawItems = await fetchTrendsFromSerpAPI()

    if (rawItems.length === 0) {
      console.warn("[trends] No trends fetched, checking for old cached trends")
      // Try to return old trends even if expired
      const oldTrends = await prisma.trend.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      })
      if (oldTrends.length > 0) {
        return NextResponse.json({
          items: oldTrends.map((trend) => ({
            title: trend.title,
            url: trend.url,
            source: trend.source,
            published_at: trend.publishedAt?.toISOString() || null,
            highlight: trend.highlight,
            category: trend.category,
            raw_excerpt: trend.rawExcerpt,
          })),
          last_updated: oldTrends[0]?.createdAt.toISOString() || new Date().toISOString(),
          cached: true,
          warning: "Using stale data - API fetch failed",
        })
      }
      return NextResponse.json({
        items: [],
        last_updated: new Date().toISOString(),
        debug: {
          serpapi_configured: !!process.env.SERPAPI_KEY,
          queries_attempted: TREND_QUERIES.length,
        },
      })
    }

    // Step 4: Normalize results
    console.log(`[trends] Normalizing ${rawItems.length} raw items`)
    const normalizedItems = normalizeResults(rawItems)

    // Step 5: Enrich with AI highlights
    console.log(`[trends] Enriching ${normalizedItems.length} items with AI`)
    const enrichedItems = await enrichWithAI(normalizedItems)

    // Step 6: Store trends in database
    console.log(`[trends] Storing ${enrichedItems.length} trends in database`)
    const now = new Date()
    for (const item of enrichedItems) {
      try {
        await prisma.trend.upsert({
          where: {
            url: item.url,
          },
          update: {
            title: item.title,
            source: item.source,
            publishedAt: item.published_at ? new Date(item.published_at) : null,
            highlight: item.highlight,
            category: item.category,
            rawExcerpt: item.raw_excerpt,
            updatedAt: now,
          },
          create: {
            title: item.title,
            url: item.url,
            source: item.source,
            publishedAt: item.published_at ? new Date(item.published_at) : null,
            highlight: item.highlight,
            category: item.category,
            rawExcerpt: item.raw_excerpt,
          },
        })
      } catch (error: any) {
        // Skip duplicates or other errors, continue with next item
        console.warn(`[trends] Error storing trend ${item.url}:`, error.message)
      }
    }

    // Step 7: Clean up old trends (older than 24 hours)
    const cleanupCutoff = new Date(Date.now() - CLEANUP_AGE_HOURS * 60 * 60 * 1000)
    const deleteResult = await prisma.trend.deleteMany({
      where: {
        createdAt: {
          lt: cleanupCutoff,
        },
      },
    })
    if (deleteResult.count > 0) {
      console.log(`[trends] Cleaned up ${deleteResult.count} old trends`)
    }

    // Step 8: Return response
    return NextResponse.json({
      items: enrichedItems,
      last_updated: now.toISOString(),
      cached: false,
    })
  } catch (error: any) {
    console.error("[trends] Error:", error)
    // Try to return cached trends on error
    try {
      const cachedTrends = await prisma.trend.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      })
      if (cachedTrends.length > 0) {
        return NextResponse.json({
          items: cachedTrends.map((trend) => ({
            title: trend.title,
            url: trend.url,
            source: trend.source,
            published_at: trend.publishedAt?.toISOString() || null,
            highlight: trend.highlight,
            category: trend.category,
            raw_excerpt: trend.rawExcerpt,
          })),
          last_updated: cachedTrends[0]?.createdAt.toISOString() || new Date().toISOString(),
          cached: true,
          warning: "Using cached data due to error",
        })
      }
    } catch (cacheError) {
      console.error("[trends] Error fetching cached trends:", cacheError)
    }
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
