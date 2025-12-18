import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { extractSignals, getSourceFromUrl, parseGitHubUrl } from "@/lib/engineerFinder/signals"

// Simple in-memory rate limiting (10 requests per minute per user)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Simple in-memory cache (15 minutes)
const cache = new Map<string, { data: any; expiresAt: number }>()

function checkRateLimit(userId: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 1000 }) // 1 minute window
    return { allowed: true }
  }

  if (userLimit.count >= 10) {
    return { allowed: false, resetIn: Math.ceil((userLimit.resetAt - now) / 1000) }
  }

  userLimit.count++
  return { allowed: true }
}

function getCacheKey(query: string, page: number, maxResults: number, gl?: string, hl?: string): string {
  return JSON.stringify({ q: query, start: page, num: maxResults, gl, hl })
}

function getCached(key: string): any | null {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() > cached.expiresAt) {
    cache.delete(key)
    return null
  }

  return cached.data
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expiresAt: Date.now() + 15 * 60 * 1000 }) // 15 minutes
}

async function enrichGitHubResult(link: string): Promise<any | null> {
  const githubInfo = parseGitHubUrl(link)
  if (!githubInfo) return null

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) return null

  try {
    if (githubInfo.repo && githubInfo.owner) {
      // Fetch repo info
      const repoResponse = await fetch(`https://api.github.com/repos/${githubInfo.owner}/${githubInfo.repo}`, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (repoResponse.ok) {
        const repoData = await repoResponse.json()
        return {
          type: "repo",
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          language: repoData.language,
          updatedAt: repoData.updated_at,
          description: repoData.description,
        }
      }
    } else if (githubInfo.user) {
      // Fetch user info
      const userResponse = await fetch(`https://api.github.com/users/${githubInfo.user}`, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        return {
          type: "user",
          followers: userData.followers,
          publicRepos: userData.public_repos,
          bio: userData.bio,
        }
      }
    }
  } catch (error) {
    console.error("[engineer-finder] GitHub enrichment error:", error)
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { query, maxResults = 10, page = 0, gl, hl } = body

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(session.user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Please wait ${rateLimit.resetIn} seconds before making another request`,
        },
        { status: 429 }
      )
    }

    // Check cache
    const cacheKey = getCacheKey(query, page, maxResults, gl, hl)
    const cached = getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }

    // SerpApi configuration
    const serpapiKey = process.env.SERPAPI_KEY
    if (!serpapiKey) {
      return NextResponse.json({ error: "SERPAPI_KEY not configured" }, { status: 500 })
    }

    const engine = process.env.SERPAPI_ENGINE || "google"
    const defaultGl = process.env.SERPAPI_GL || gl || "us"
    const defaultHl = process.env.SERPAPI_HL || hl || "en"

    // Build SerpApi request
    const params = new URLSearchParams({
      engine,
      q: query.trim(),
      api_key: serpapiKey,
      num: String(Math.min(maxResults, 20)), // Cap at 20
      start: String(page * Math.min(maxResults, 20)),
      gl: defaultGl,
      hl: defaultHl,
    })

    if (process.env.SERPAPI_LOCATION) {
      params.append("location", process.env.SERPAPI_LOCATION)
    }

    const serpapiUrl = `https://serpapi.com/search.json?${params.toString()}`

    console.log(`[engineer-finder] Searching: ${query.substring(0, 100)}`)

    // Call SerpApi
    const response = await fetch(serpapiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[engineer-finder] SerpAPI error: ${response.status} - ${errorText.substring(0, 200)}`)
      return NextResponse.json(
        { error: "SerpAPI request failed", message: errorText.substring(0, 200) },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Check for SerpAPI errors in response
    if (data.error) {
      console.error(`[engineer-finder] SerpAPI returned error:`, data.error)
      return NextResponse.json({ error: "SerpAPI error", message: data.error }, { status: 400 })
    }

    // Normalize results
    const organicResults = data.organic_results || []
    const normalizedResults = organicResults.map((item: any) => {
      const source = getSourceFromUrl(item.link || "")
      const signals = extractSignals(item.title || "", item.snippet)

      return {
        title: item.title || "",
        link: item.link || "",
        displayLink: item.display_link || new URL(item.link || "").hostname,
        snippet: item.snippet || "",
        source,
        signals: signals.signals,
        score: signals.score,
      }
    })

    // Enrich GitHub results (in parallel, but limit concurrency)
    const enrichedResults = await Promise.all(
      normalizedResults.map(async (result: any) => {
        if (result.source === "github") {
          const enrichment = await enrichGitHubResult(result.link)
          if (enrichment) {
            result.enrichment = enrichment
          }
        }
        return result
      })
    )

    // Create run record
    const run = await prisma.engineerFinderRun.create({
      data: {
        query: query.trim(),
        filtersJson: JSON.stringify({ maxResults, page, gl: defaultGl, hl: defaultHl }),
        resultCount: enrichedResults.length,
        createdById: session.user.id,
      },
    })

    // Save results to database
    await prisma.engineerFinderResult.createMany({
      data: enrichedResults.map((result: any) => ({
        runId: run.id,
        title: result.title,
        link: result.link,
        displayLink: result.displayLink,
        snippet: result.snippet || null,
        source: result.source,
        signalsJson: JSON.stringify(result.signals),
        score: result.score,
        enrichmentJson: result.enrichment ? JSON.stringify(result.enrichment) : null,
      })),
    })

    // Check for next page
    const hasNextPage = data.pagination?.next_page_token || data.organic_results?.length === maxResults

    const responseData = {
      results: enrichedResults,
      runId: run.id,
      nextPage: hasNextPage ? page + 1 : undefined,
      totalResults: data.search_information?.total_results || enrichedResults.length,
    }

    // Cache the response
    setCache(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("[engineer-finder] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

