/**
 * Signal extraction and scoring for Engineer Finder results
 */

export interface ExtractedSignals {
  signals: string[]
  score: number
}

const seniorityKeywords = [
  "staff",
  "principal",
  "distinguished",
  "fellow",
  "lead",
  "senior staff",
  "tech lead",
  "engineering lead",
]

const builderKeywords = [
  "maintainer",
  "core contributor",
  "creator",
  "author",
  "founder",
  "co-founder",
  "built",
  "created",
]

const systemsKeywords = [
  "distributed systems",
  "storage",
  "latency",
  "kernel",
  "compiler",
  "database",
  "runtime",
  "ebpf",
  "performance",
  "infrastructure",
  "systems programming",
  "low-level",
]

const mlSystemsKeywords = [
  "inference",
  "serving",
  "training pipeline",
  "vector database",
  "model serving",
  "ml infrastructure",
]

const deepSystemsKeywords = [
  "internals",
  "deep dive",
  "systems design",
  "architecture",
  "optimization",
  "benchmarking",
]

export function extractSignals(title: string, snippet?: string): ExtractedSignals {
  const text = `${title} ${snippet || ""}`.toLowerCase()
  const signals: string[] = []
  let score = 0

  // Check for seniority signals
  const seniorityHits = seniorityKeywords.filter((keyword) => text.includes(keyword))
  if (seniorityHits.length > 0) {
    signals.push(...seniorityHits.map((k) => `Seniority: ${k}`))
    score += seniorityHits.length * 3 // +3 per seniority hit
  }

  // Check for builder/maintainer signals
  const builderHits = builderKeywords.filter((keyword) => text.includes(keyword))
  if (builderHits.length > 0) {
    signals.push(...builderHits.map((k) => `Builder: ${k}`))
    score += builderHits.length * 4 // +4 per builder hit
  }

  // Check for systems keywords
  const systemsHits = systemsKeywords.filter((keyword) => text.includes(keyword))
  if (systemsHits.length > 0) {
    signals.push(...systemsHits.map((k) => `Systems: ${k}`))
    score += systemsHits.length * 2 // +2 per systems hit
  }

  // Check for ML systems keywords
  const mlHits = mlSystemsKeywords.filter((keyword) => text.includes(keyword))
  if (mlHits.length > 0) {
    signals.push(...mlHits.map((k) => `ML Systems: ${k}`))
    score += mlHits.length * 2 // +2 per ML systems hit
  }

  // Check for deep systems keywords
  const deepHits = deepSystemsKeywords.filter((keyword) => text.includes(keyword))
  if (deepHits.length > 0) {
    signals.push(...deepHits.map((k) => `Deep Systems: ${k}`))
    score += deepHits.length * 2 // +2 per deep systems hit
  }

  // Bonus for multiple signal types
  const uniqueTypes = new Set(signals.map((s) => s.split(":")[0]))
  if (uniqueTypes.size >= 3) {
    score += 5 // Bonus for diverse signals
  }

  // Normalize score to 0-100 range (cap at 100)
  score = Math.min(score, 100)

  return {
    signals: [...new Set(signals)], // Remove duplicates
    score: Math.round(score),
  }
}

export function parseGitHubUrl(url: string): { owner?: string; repo?: string; user?: string } | null {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname !== "github.com") {
      return null
    }

    const pathParts = urlObj.pathname.split("/").filter((p) => p)
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1],
      }
    } else if (pathParts.length === 1) {
      return {
        user: pathParts[0],
      }
    }

    return null
  } catch {
    return null
  }
}

export function getSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    if (hostname.includes("linkedin.com")) return "linkedin"
    if (hostname.includes("github.com")) return "github"
    if (hostname.includes("scholar.google.com")) return "scholar"
    if (hostname.includes("youtube.com")) return "youtube"
    if (hostname.includes("patents.google.com")) return "patents"
    if (hostname.includes("stackoverflow.com")) return "stackoverflow"

    return "other"
  } catch {
    return "unknown"
  }
}

