import { NextResponse } from "next/server"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

/**
 * Startups API endpoint.
 * 
 * Fetches information about startups to invest in - either those that went public
 * or cutting-edge startups making waves.
 * 
 * Uses SERPAPI_KEY environment variable (same as trends API).
 */
interface StartupItem {
  name: string
  description: string
  url: string
  source: string
  published_at: string | null
  highlight: string
  type: "ipo" | "cutting_edge"
  valuation?: string
  funding?: string
  industry?: string
}

interface StartupsResponse {
  items: StartupItem[]
  last_updated: string
  cached?: boolean
  warning?: string
}

// Search queries for startups
const STARTUP_QUERIES = [
  {
    query: "startups IPO 2025 went public",
    type: "ipo" as const,
    num_results: 10,
  },
  {
    query: "cutting edge startups 2025 innovative technology",
    type: "cutting_edge" as const,
    num_results: 10,
  },
  {
    query: "unicorn startups 2025 latest funding",
    type: "cutting_edge" as const,
    num_results: 10,
  },
]

async function fetchStartupsFromSerpAPI(): Promise<any[]> {
  const serpapiKey = process.env.SERPAPI_KEY
  if (!serpapiKey) {
    console.warn("[startups] SERPAPI_KEY not set")
    return []
  }

  const allResults: any[] = []
  const region = process.env.TRENDS_REGION || "us"

  console.log(`[startups] Starting fetch with ${STARTUP_QUERIES.length} queries, region: ${region}`)

  for (const queryConfig of STARTUP_QUERIES) {
    try {
      const params = new URLSearchParams({
        engine: "google",
        q: queryConfig.query,
        api_key: serpapiKey,
        num: String(queryConfig.num_results),
        gl: region,
        hl: "en",
      })

      console.log(`[startups] Fetching: ${queryConfig.query}`)
      const url = `https://serpapi.com/search?${params.toString()}`
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[startups] SerpAPI error for query "${queryConfig.query}": ${response.status} - ${errorText.substring(0, 200)}`)
        continue
      }

      const data = await response.json()
      
      // Check for SerpAPI errors in response
      if (data.error) {
        console.error(`[startups] SerpAPI returned error for "${queryConfig.query}":`, data.error)
        continue
      }

      const items = data.organic_results || []
      console.log(`[startups] Got ${items.length} results for "${queryConfig.query}"`)

      // Add type to each item
      for (const item of items) {
        allResults.push({
          ...item,
          type: queryConfig.type,
        })
      }
    } catch (error: any) {
      console.error(`[startups] Error fetching query "${queryConfig.query}":`, error.message)
      continue
    }
  }

  console.log(`[startups] Total results fetched: ${allResults.length}`)
  return allResults
}

function normalizeStartupResults(rawItems: any[]): StartupItem[] {
  const seenUrls = new Set<string>()
  const normalized: StartupItem[] = []

  for (const item of rawItems) {
    const url = item.link || ""
    const title = item.title || ""
    const snippet = item.snippet || ""
    const type = item.type || "cutting_edge"

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

    // Extract startup name from title (usually first part before dash or colon)
    const name = title.split(/[-:–—]/)[0].trim() || title.substring(0, 50)

    // Try to extract valuation/funding from snippet
    const valuationMatch = snippet.match(/\$[\d.]+[BM]|valuation.*?\$[\d.]+[BM]/i)
    const fundingMatch = snippet.match(/raised.*?\$[\d.]+[BM]|funding.*?\$[\d.]+[BM]/i)
    const valuation = valuationMatch ? valuationMatch[0] : undefined
    const funding = fundingMatch ? fundingMatch[0] : undefined

    // Extract industry if mentioned
    const industries = ["AI", "fintech", "healthtech", "biotech", "SaaS", "e-commerce", "edtech"]
    const industry = industries.find(ind => snippet.toLowerCase().includes(ind.toLowerCase()))

    // Deduplicate by URL
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url)
      normalized.push({
        name,
        description: snippet,
        url,
        source,
        published_at: publishedAt,
        highlight: "", // Will be populated by AI
        type,
        valuation,
        funding,
        industry,
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

async function enrichStartupsWithAI(items: StartupItem[]): Promise<StartupItem[]> {
  if (!isOpenAIConfigured() || items.length === 0) {
    return items
  }

  try {
    const openai = getOpenAIClient()

    // Process in batches of 5
    const batchSize = 5
    const enriched: StartupItem[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      // Generate highlights for batch
      const messages = [
        {
          role: "system" as const,
          content: `You are a startup investment analyst. Summarize each startup into one short highlight (max 40 words) 
focusing on why it's worth investing in. Mention IPO status, funding, valuation, or innovation if relevant.
Return JSON array with one highlight per startup in the same order.`,
        },
        {
          role: "user" as const,
          content: batch
            .map(
              (item, idx) =>
                `Startup ${idx + 1}:\nName: ${item.name}\nDescription: ${item.description}\nType: ${item.type}\nValuation: ${item.valuation || "N/A"}\nFunding: ${item.funding || "N/A"}`
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
                  !trimmed.startsWith("Startup") &&
                  !trimmed.startsWith("```") &&
                  !trimmed.startsWith("[") &&
                  !trimmed.startsWith("{") &&
                  trimmed.length > 10
                )
              })
            if (lines.length >= batch.length) {
              for (let j = 0; j < batch.length; j++) {
                let highlight = lines[j] || ""
                highlight = highlight.replace(/^["',\[\]]+|["',\[\]]+$/g, "").trim()
                batch[j].highlight = highlight
              }
            } else {
              // Fallback: use description as highlight
              for (let j = 0; j < batch.length; j++) {
                batch[j].highlight = batch[j].description.substring(0, 150) + "..."
              }
            }
          }
        }
      } catch (error: any) {
        console.error(`[startups] Error enriching batch:`, error.message)
      }

      enriched.push(...batch)

      // Small delay between batches
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return enriched
  } catch (error: any) {
    console.error("[startups] Error in AI enrichment:", error.message)
    return items
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get("refresh") === "true"

    // Check SERPAPI_KEY
    if (!process.env.SERPAPI_KEY) {
      console.error("[startups] SERPAPI_KEY not configured")
      return NextResponse.json(
        {
          error: "SERPAPI_KEY not configured",
          items: [],
          last_updated: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Fetch startups from SerpAPI
    const rawItems = await fetchStartupsFromSerpAPI()

    if (rawItems.length === 0) {
      return NextResponse.json({
        items: [],
        last_updated: new Date().toISOString(),
      })
    }

    // Normalize results
    console.log(`[startups] Normalizing ${rawItems.length} raw items`)
    const normalizedItems = normalizeStartupResults(rawItems)

    // Enrich with AI highlights
    console.log(`[startups] Enriching ${normalizedItems.length} items with AI`)
    const enrichedItems = await enrichStartupsWithAI(normalizedItems)

    // Return response
    return NextResponse.json({
      items: enrichedItems,
      last_updated: new Date().toISOString(),
      cached: false,
    })
  } catch (error: any) {
    console.error("[startups] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch startups",
        items: [],
        last_updated: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

