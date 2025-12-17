import { NextResponse } from "next/server"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

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
  url?: string
  source?: string
  published_at: string | null
  highlight: string
  usp: string // Unique Selling Proposition
  type: "ipo" | "cutting_edge" | "unicorn"
  valuation?: string
  funding?: string
  industry?: string
  website?: string
}

interface StartupsResponse {
  items: StartupItem[]
  last_updated: string
  cached?: boolean
  warning?: string
}

// Search queries for startups - focused on actual companies, not articles
const STARTUP_QUERIES = [
  {
    query: "companies IPO 2025 list went public",
    type: "ipo" as const,
    num_results: 8,
  },
  {
    query: "innovative tech companies 2025 breakthrough technology",
    type: "cutting_edge" as const,
    num_results: 8,
  },
  {
    query: "unicorn companies list 2025 billion dollar valuation",
    type: "unicorn" as const,
    num_results: 8,
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
  const normalized: StartupItem[] = []

  for (const item of rawItems) {
    const url = item.link || ""
    const title = item.title || ""
    const snippet = item.snippet || ""
    const type = item.type || "cutting_edge"

    // Extract source domain
    let source: string | undefined = undefined
    try {
      const urlObj = new URL(url)
      source = urlObj.hostname.replace("www.", "")
    } catch {
      // Invalid URL, continue anyway
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
    // Also try to extract from snippet if title doesn't have clear company name
    let name = title.split(/[-:–—]/)[0].trim() || title.substring(0, 50)
    
    // Filter out generic/question titles that aren't company names
    const genericPatterns = [
      /^why\s+/i,
      /^what\s+/i,
      /^how\s+/i,
      /^when\s+/i,
      /^where\s+/i,
      /^the\s+(valuation|growth|future|rise|fall)/i,
      /^(unicorn|startup|company|companies)\s+(are|is|have|will)/i,
      /^\d+\s+(startups|companies|unicorns)/i,
    ]
    
    const isGenericTitle = genericPatterns.some(pattern => pattern.test(name))
    
    // Try to extract company name from snippet if title is generic
    const companyNamePatterns = [
      /(?:^|\.)\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:raised|IPO|went public|valuation|funding|startup|company|launched)/i,
      /(?:startup|company|firm|platform)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:has|announced|raised|secured|reached|achieved)/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:IPO|valuation|funding)/i,
    ]
    
    if (isGenericTitle) {
      // Title is generic, try harder to extract from snippet
      for (const pattern of companyNamePatterns) {
        const match = snippet.match(pattern)
        if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
          const extractedName = match[1].trim()
          // Make sure it's not a generic term
          if (!/^(Startup|Company|Unicorn|Valuation|Funding|IPO)/i.test(extractedName)) {
            name = extractedName
            break
          }
        }
      }
    }

    // Try to extract valuation/funding from snippet
    const valuationMatch = snippet.match(/\$[\d.]+[BM]|valuation.*?\$[\d.]+[BM]/i)
    const fundingMatch = snippet.match(/raised.*?\$[\d.]+[BM]|funding.*?\$[\d.]+[BM]/i)
    const valuation = valuationMatch ? valuationMatch[0] : undefined
    const funding = fundingMatch ? fundingMatch[0] : undefined

    // Extract industry if mentioned
    const industries = ["AI", "fintech", "healthtech", "biotech", "SaaS", "e-commerce", "edtech", "cybersecurity", "blockchain", "robotics"]
    const industry = industries.find(ind => snippet.toLowerCase().includes(ind.toLowerCase()))

    // Try to extract website URL from snippet or article URL
    let website: string | undefined = undefined
    const websiteMatch = snippet.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i)
    if (websiteMatch) {
      website = websiteMatch[1]
    }

    // Store all article data - we'll deduplicate companies later with AI
    normalized.push({
      name,
      description: snippet,
      url: url || undefined,
      source,
      published_at: publishedAt,
      highlight: "", // Will be populated by AI
      usp: "", // Will be populated by AI
      type,
      valuation,
      funding,
      industry,
      website,
    })
  }

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

      // Generate highlights and USPs, and identify actual company names
      const messages = [
        {
          role: "system" as const,
          content: `You are a startup investment analyst. For each result, extract:
1. The actual COMPANY NAME (not article title, not question, not generic term)
   - If the title is an article about a company, extract the company name from the title or description
   - If the title is a question or generic term, extract the company name from the description
   - Examples: "Urban Company IPO" -> "Urban Company", "Why are startups called unicorns?" -> extract company from description
   - Skip if no actual company name can be identified (e.g., generic articles about "unicorns" or "startups")
2. A compelling description explaining why this company is noteworthy (max 60 words)
   - For IPO type: Explain why they went public, their growth trajectory, market position, financial performance
   - For Cutting Edge type: Explain their innovative technology, breakthrough, market disruption, or unique approach
   - For Unicorn type: Explain their valuation milestone, funding success, market dominance, or rapid growth
   The description should be clear and compelling, focusing on what makes them stand out.

IMPORTANT: Only return results where you can identify a specific company name. Skip generic articles, questions, or trends.

Return JSON array with objects: {companyName: string, highlight: string, usp: string}
Where highlight is the "why noteworthy" description that will be displayed below the company name.
One object per result in the same order. If a result doesn't have a company name, return null for that item.`,
        },
        {
          role: "user" as const,
          content: batch
            .map(
              (item, idx) =>
                `Article ${idx + 1}:\nTitle: ${item.name}\nDescription: ${item.description}\nType: ${item.type}\nValuation: ${item.valuation || "N/A"}\nFunding: ${item.funding || "N/A"}\nIndustry: ${item.industry || "N/A"}`
            )
            .join("\n\n"),
        },
      ]

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 300 * batch.length,
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
            
            const enrichedData = JSON.parse(jsonContent)
            if (Array.isArray(enrichedData) && enrichedData.length === batch.length) {
              for (let j = 0; j < batch.length; j++) {
                const data = enrichedData[j]
                // Skip null entries (where no company name was found)
                if (data === null || !data.companyName || data.companyName.trim().length < 2) {
                  // Mark for removal
                  batch[j]._skip = true
                  continue
                }
                if (data.companyName) {
                  batch[j].name = data.companyName.trim()
                }
                if (data.highlight) {
                  batch[j].highlight = String(data.highlight).trim().replace(/^["']|["']$/g, "")
                }
                if (data.usp) {
                  batch[j].usp = String(data.usp).trim().replace(/^["']|["']$/g, "")
                }
              }
            }
          } catch {
            // JSON parse failed, try to extract from text
            console.warn("[startups] Failed to parse AI response as JSON, using fallback")
            for (let j = 0; j < batch.length; j++) {
              if (!batch[j].highlight) {
                batch[j].highlight = batch[j].description.substring(0, 150) + "..."
              }
              if (!batch[j].usp) {
                batch[j].usp = "Innovative company in " + (batch[j].industry || "technology")
              }
            }
          }
        }
      } catch (error: any) {
        console.error(`[startups] Error enriching batch:`, error.message)
        // Fallback: use description as highlight and generate basic USP
        for (let j = 0; j < batch.length; j++) {
          if (!batch[j].highlight) {
            batch[j].highlight = batch[j].description.substring(0, 150) + "..."
          }
          if (!batch[j].usp) {
            batch[j].usp = "Innovative company in " + (batch[j].industry || "technology")
          }
        }
      }

      // Filter out skipped items (those without company names)
      const validBatch = batch.filter(item => !item._skip)
      enriched.push(...validBatch)

      // Small delay between batches
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Deduplicate companies by name and type
    const companyMap = new Map<string, StartupItem>()
    for (const item of enriched) {
      const key = `${item.name.toLowerCase()}_${item.type}`
      if (!companyMap.has(key)) {
        companyMap.set(key, item)
      } else {
        // Merge data from multiple articles about same company
        const existing = companyMap.get(key)!
        // Keep the most recent published date
        if (item.published_at && (!existing.published_at || new Date(item.published_at) > new Date(existing.published_at))) {
          existing.published_at = item.published_at
        }
        // Merge descriptions if different
        if (item.description && !existing.description.includes(item.description.substring(0, 50))) {
          existing.description += " " + item.description
        }
        // Keep valuation/funding if missing
        if (!existing.valuation && item.valuation) existing.valuation = item.valuation
        if (!existing.funding && item.funding) existing.funding = item.funding
        if (!existing.industry && item.industry) existing.industry = item.industry
        if (!existing.website && item.website) existing.website = item.website
      }
    }

    return Array.from(companyMap.values())
  } catch (error: any) {
    console.error("[startups] Error in AI enrichment:", error.message)
    return items
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get("refresh") === "true"

    const CACHE_DURATION_HOURS = 6 // Cache startups for 6 hours
    const STALE_CACHE_HOURS = 24 // Return stale cache if less than 24 hours old
    const CLEANUP_AGE_HOURS = 72 // Delete startups older than 3 days

    // Step 1: Check for fresh cached startups (within cache duration) - skip if force refresh
    const cacheCutoff = new Date(Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000)
    
    if (!forceRefresh) {
      const cachedStartups = await prisma.startup.findMany({
        where: {
          createdAt: {
            gte: cacheCutoff,
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 50, // Limit to 50 most recent startups
      })

      if (cachedStartups.length > 0) {
        console.log(`[startups] Returning ${cachedStartups.length} fresh cached startups`)
        // Shuffle to ensure mixed bag of types
        const shuffled = [...cachedStartups].sort(() => Math.random() - 0.5)
        return NextResponse.json({
          items: shuffled.map((startup: (typeof cachedStartups)[number]) => ({
            name: startup.name,
            url: startup.url || undefined,
            source: startup.source || undefined,
            published_at: startup.publishedAt?.toISOString() || null,
            highlight: startup.highlight,
            usp: startup.usp,
            type: startup.type as "ipo" | "cutting_edge" | "unicorn",
            valuation: startup.valuation || undefined,
            funding: startup.funding || undefined,
            industry: startup.industry || undefined,
            description: startup.description,
            website: startup.website || undefined,
          })),
          last_updated: cachedStartups[0]?.createdAt.toISOString() || new Date().toISOString(),
          cached: true,
        })
      }
    }

    // Step 1.5: Check for stale cache (less than STALE_CACHE_HOURS old) - return it while fetching fresh in background
    const staleCacheCutoff = new Date(Date.now() - STALE_CACHE_HOURS * 60 * 60 * 1000)
    const staleStartups = await prisma.startup.findMany({
      where: {
        createdAt: {
          gte: staleCacheCutoff,
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 50,
    })

    // If we have stale startups, return them immediately (don't wait for fresh fetch)
    const returnStaleStartups = staleStartups.length > 0

    // Step 2: Fetch new startups (but return stale cache immediately if available)
    console.log("[startups] Cache expired, fetching new startups from SerpAPI")

    // If we have stale startups, return them immediately
    if (returnStaleStartups) {
      console.log(`[startups] Returning ${staleStartups.length} stale startups (will refresh in background)`)
      // Shuffle to ensure mixed bag
      const shuffled = [...staleStartups].sort(() => Math.random() - 0.5)
      return NextResponse.json({
        items: shuffled.map((startup: (typeof staleStartups)[number]) => ({
          name: startup.name,
          url: startup.url,
          source: startup.source,
          published_at: startup.publishedAt?.toISOString() || null,
          highlight: startup.highlight,
          type: startup.type as "ipo" | "cutting_edge" | "unicorn",
          valuation: startup.valuation || undefined,
          funding: startup.funding || undefined,
          industry: startup.industry || undefined,
          description: startup.description,
        })),
        last_updated: staleStartups[0]?.createdAt.toISOString() || new Date().toISOString(),
        cached: true,
        stale: true,
      })
    }

    // Check SERPAPI_KEY
    if (!process.env.SERPAPI_KEY) {
      console.error("[startups] SERPAPI_KEY not configured")
      // Try to return any startups we have, even if very old
      const anyStartups = await prisma.startup.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      })
      if (anyStartups.length > 0) {
        return NextResponse.json({
          items: anyStartups.map((startup: (typeof anyStartups)[number]) => ({
            name: startup.name,
            url: startup.url,
            source: startup.source,
            published_at: startup.publishedAt?.toISOString() || null,
            highlight: startup.highlight,
            type: startup.type as "ipo" | "cutting_edge" | "unicorn",
            valuation: startup.valuation || undefined,
            funding: startup.funding || undefined,
            industry: startup.industry || undefined,
            description: startup.description,
          })),
          last_updated: anyStartups[0]?.createdAt.toISOString() || new Date().toISOString(),
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

    // Step 3: Fetch startups from SerpAPI
    const rawItems = await fetchStartupsFromSerpAPI()

    if (rawItems.length === 0) {
      console.warn("[startups] No startups fetched, checking for old cached startups")
      // Try to return old startups even if expired
      const oldStartups = await prisma.startup.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      })
      if (oldStartups.length > 0) {
        return NextResponse.json({
          items: oldStartups.map((startup: (typeof oldStartups)[number]) => ({
            name: startup.name,
            url: startup.url,
            source: startup.source,
            published_at: startup.publishedAt?.toISOString() || null,
            highlight: startup.highlight,
            type: startup.type as "ipo" | "cutting_edge" | "unicorn",
            valuation: startup.valuation || undefined,
            funding: startup.funding || undefined,
            industry: startup.industry || undefined,
            description: startup.description,
          })),
          last_updated: oldStartups[0]?.createdAt.toISOString() || new Date().toISOString(),
          cached: true,
          warning: "Using stale data - API fetch failed",
        })
      }
      return NextResponse.json({
        items: [],
        last_updated: new Date().toISOString(),
        debug: {
          serpapi_configured: !!process.env.SERPAPI_KEY,
          queries_attempted: STARTUP_QUERIES.length,
        },
      })
    }

    // Step 4: Normalize results
    console.log(`[startups] Normalizing ${rawItems.length} raw items`)
    const normalizedItems = normalizeStartupResults(rawItems)
    
    // Filter out items with generic/question titles before AI enrichment
    const validItems = normalizedItems.filter(item => {
      const name = item.name.toLowerCase()
      // Skip generic terms, questions, and very short names
      const skipPatterns = [
        /^(why|what|how|when|where|the)\s+/,
        /^(unicorn|startup|company|companies|valuation|funding|ipo)\s*$/,
        /^\d+\s+(startups|companies|unicorns)/,
        /^(are|is|have|will|can)\s+/,
      ]
      const isGeneric = skipPatterns.some(pattern => pattern.test(name))
      return !isGeneric && name.length >= 3 && name.length <= 50
    })
    
    console.log(`[startups] Filtered to ${validItems.length} valid items (removed ${normalizedItems.length - validItems.length} generic/question results)`)

    // Step 5: Enrich with AI highlights
    console.log(`[startups] Enriching ${validItems.length} items with AI`)
    const enrichedItems = await enrichStartupsWithAI(validItems)

    // Step 6: Store startups in database
    console.log(`[startups] Storing ${enrichedItems.length} startups in database`)
    const now = new Date()
    for (const item of enrichedItems) {
      try {
        await prisma.startup.upsert({
          where: {
            name_type: {
              name: item.name,
              type: item.type,
            },
          },
          update: {
            url: item.url || null,
            source: item.source || null,
            publishedAt: item.published_at ? new Date(item.published_at) : null,
            highlight: item.highlight,
            usp: item.usp,
            valuation: item.valuation || null,
            funding: item.funding || null,
            industry: item.industry || null,
            description: item.description,
            website: item.website || null,
            updatedAt: now,
          },
          create: {
            name: item.name,
            url: item.url || null,
            source: item.source || null,
            publishedAt: item.published_at ? new Date(item.published_at) : null,
            highlight: item.highlight,
            usp: item.usp,
            type: item.type,
            valuation: item.valuation || null,
            funding: item.funding || null,
            industry: item.industry || null,
            description: item.description,
            website: item.website || null,
          },
        })
      } catch (error: any) {
        // Skip duplicates or other errors, continue with next item
        console.warn(`[startups] Error storing startup ${item.name}:`, error.message)
      }
    }

    // Step 7: Clean up old startups (older than CLEANUP_AGE_HOURS)
    const cleanupCutoff = new Date(Date.now() - CLEANUP_AGE_HOURS * 60 * 60 * 1000)
    const deleteResult = await prisma.startup.deleteMany({
      where: {
        createdAt: {
          lt: cleanupCutoff,
        },
      },
    })
    if (deleteResult.count > 0) {
      console.log(`[startups] Cleaned up ${deleteResult.count} old startups`)
    }

    // Step 8: Shuffle items to ensure mixed bag of types
    const shuffledItems = [...enrichedItems].sort(() => Math.random() - 0.5)

    // Step 9: Return response
    return NextResponse.json({
      items: shuffledItems,
      last_updated: now.toISOString(),
      cached: false,
    })
  } catch (error: any) {
    console.error("[startups] Error:", error)
    // Try to return cached startups on error
    try {
      const cachedStartups = await prisma.startup.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      })
      if (cachedStartups.length > 0) {
        return NextResponse.json({
          items: cachedStartups.map((startup: (typeof cachedStartups)[number]) => ({
            name: startup.name,
            url: startup.url || undefined,
            source: startup.source || undefined,
            published_at: startup.publishedAt?.toISOString() || null,
            highlight: startup.highlight,
            usp: startup.usp,
            type: startup.type as "ipo" | "cutting_edge" | "unicorn",
            valuation: startup.valuation || undefined,
            funding: startup.funding || undefined,
            industry: startup.industry || undefined,
            description: startup.description,
            website: startup.website || undefined,
          })),
          last_updated: cachedStartups[0]?.createdAt.toISOString() || new Date().toISOString(),
          cached: true,
          warning: "Using cached data due to error",
        })
      }
    } catch (cacheError) {
      console.error("[startups] Error fetching cached startups:", cacheError)
    }
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

