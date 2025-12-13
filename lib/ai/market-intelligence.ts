import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface SalaryInsight {
  role: string
  location: string
  averageSalary: number
  minSalary: number
  maxSalary: number
  currency: string
  jobCount: number
  trend: "increasing" | "decreasing" | "stable"
}

export interface SkillDemandTrend {
  skill: string
  demandCount: number
  growthRate: number // percentage change over time
  averageSalary: number
  jobCount: number
  trend: "hot" | "growing" | "stable" | "declining"
}

export interface CompetitorInsight {
  company: string
  candidateCount: number
  averageTenure: number
  topRoles: Array<{ role: string; count: number }>
  movementTrend: "gaining" | "losing" | "stable"
}

export interface SupplyDemandRatio {
  role: string
  candidateCount: number
  jobCount: number
  ratio: number // candidates per job
  status: "oversupplied" | "balanced" | "undersupplied"
}

export interface MarketIntelligence {
  salaryInsights: SalaryInsight[]
  skillDemandTrends: SkillDemandTrend[]
  competitorInsights: CompetitorInsight[]
  supplyDemandRatios: SupplyDemandRatio[]
  lastUpdated: Date
}

// Cache for normalized titles to avoid repeated AI calls
const titleCache = new Map<string, string>()

/**
 * Extract role/title from job title using simple normalization (fast)
 * Falls back to AI if needed for complex cases
 */
function normalizeJobTitleSimple(title: string): string {
  // Simple normalization: remove common prefixes/suffixes
  let normalized = title
    .toLowerCase()
    .trim()
    .replace(/^(senior|sr|lead|principal|staff|junior|jr)\s+/i, "")
    .replace(/\s+(ii|iii|iv|v|2|3|4)$/i, "")
    .replace(/\s*\(.*?\)\s*/g, "") // Remove parentheses
    .trim()

  // Common title mappings
  const mappings: Record<string, string> = {
    "full stack developer": "software developer",
    "full-stack developer": "software developer",
    "frontend developer": "software developer",
    "backend developer": "software developer",
    "full stack engineer": "software engineer",
    "full-stack engineer": "software engineer",
    "frontend engineer": "software engineer",
    "backend engineer": "software engineer",
  }

  return mappings[normalized] || normalized
}

/**
 * Extract role/title from job title using AI (for complex cases)
 */
async function normalizeJobTitleWithAI(title: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    return normalizeJobTitleSimple(title)
  }

  // Check cache first
  if (titleCache.has(title)) {
    return titleCache.get(title)!
  }

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a job title normalizer. Extract the core role/title from job titles. Return only the normalized title, nothing else. Examples: 'Senior Software Engineer' -> 'Software Engineer', 'Full Stack Developer' -> 'Software Developer', 'Product Manager II' -> 'Product Manager'",
        },
        {
          role: "user",
          content: `Normalize this job title: "${title}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    })

    const normalized = response.choices[0]?.message?.content?.trim() || title
    titleCache.set(title, normalized)
    return normalized
  } catch (error) {
    console.error("Error normalizing job title with AI:", error)
    return normalizeJobTitleSimple(title)
  }
}

/**
 * Normalize job title (uses simple normalization by default for performance)
 */
async function normalizeJobTitle(title: string): Promise<string> {
  // Use simple normalization for performance - AI can be added later if needed
  return normalizeJobTitleSimple(title)
}

/**
 * Extract skills from job descriptions using AI
 */
async function extractSkillsFromJob(description: string): Promise<string[]> {
  if (!isOpenAIConfigured()) {
    return []
  }

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a skill extractor. Extract technical skills and technologies mentioned in job descriptions. Return a JSON array of skill names only, nothing else.",
        },
        {
          role: "user",
          content: `Extract skills from this job description: "${description.substring(0, 2000)}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (content) {
      const parsed = JSON.parse(content)
      return Array.isArray(parsed.skills) ? parsed.skills : parsed.skills ? [parsed.skills] : []
    }
    return []
  } catch (error) {
    console.error("Error extracting skills:", error)
    return []
  }
}

/**
 * Get salary insights by role and location
 */
export async function getSalaryInsights(): Promise<SalaryInsight[]> {
  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      salaryMin: { not: null },
      salaryMax: { not: null },
    },
    select: {
      title: true,
      location: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      createdAt: true,
    },
  })

  // Group by normalized role and location
  const grouped = new Map<string, Array<typeof jobs[0]>>()

  for (const job of jobs) {
    const normalizedTitle = await normalizeJobTitle(job.title)
    const key = `${normalizedTitle}|||${job.location || "Unknown"}`
    
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(job)
  }

  const insights: SalaryInsight[] = []

  for (const [key, jobGroup] of grouped.entries()) {
    const [role, location] = key.split("|||")
    const salaries = jobGroup
      .filter((j) => j.salaryMin && j.salaryMax)
      .map((j) => ({
        min: j.salaryMin!,
        max: j.salaryMax!,
        avg: (j.salaryMin! + j.salaryMax!) / 2,
      }))

    if (salaries.length === 0) continue

    const averageSalary = salaries.reduce((sum, s) => sum + s.avg, 0) / salaries.length
    const minSalary = Math.min(...salaries.map((s) => s.min))
    const maxSalary = Math.max(...salaries.map((s) => s.max))

    // Determine trend (simplified - compare recent vs older)
    const recentJobs = jobGroup.filter(
      (j) => j.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    const olderJobs = jobGroup.filter(
      (j) => j.createdAt <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    let trend: "increasing" | "decreasing" | "stable" = "stable"
    if (recentJobs.length > 0 && olderJobs.length > 0) {
      const recentAvg =
        recentJobs
          .filter((j) => j.salaryMin && j.salaryMax)
          .reduce((sum, j) => sum + (j.salaryMin! + j.salaryMax!) / 2, 0) / recentJobs.length
      const olderAvg =
        olderJobs
          .filter((j) => j.salaryMin && j.salaryMax)
          .reduce((sum, j) => sum + (j.salaryMin! + j.salaryMax!) / 2, 0) / olderJobs.length

      if (recentAvg > olderAvg * 1.05) trend = "increasing"
      else if (recentAvg < olderAvg * 0.95) trend = "decreasing"
    }

    insights.push({
      role,
      location: location || "Unknown",
      averageSalary: Math.round(averageSalary),
      minSalary,
      maxSalary,
      currency: jobGroup[0].salaryCurrency || "USD",
      jobCount: jobGroup.length,
      trend,
    })
  }

  return insights.sort((a, b) => b.jobCount - a.jobCount).slice(0, 50) // Top 50
}

/**
 * Get skill demand trends
 */
export async function getSkillDemandTrends(): Promise<SkillDemandTrend[]> {
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    select: {
      title: true,
      description: true,
      requirements: true,
      salaryMin: true,
      salaryMax: true,
      createdAt: true,
    },
  })

  // Extract skills from all jobs
  const skillCounts = new Map<string, { count: number; salaries: number[]; jobs: typeof jobs }>()
  const skillRecentCounts = new Map<string, number>()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  for (const job of jobs) {
    const text = `${job.description} ${job.requirements || ""}`.toLowerCase()
    
    // Common tech skills to look for
    const commonSkills = [
      "javascript",
      "typescript",
      "python",
      "react",
      "node.js",
      "aws",
      "docker",
      "kubernetes",
      "postgresql",
      "mongodb",
      "graphql",
      "golang",
      "java",
      "c++",
      "rust",
      "ai",
      "machine learning",
      "tensorflow",
      "pytorch",
      "data science",
      "sql",
      "redis",
      "elasticsearch",
      "terraform",
      "ci/cd",
      "git",
      "agile",
      "scrum",
    ]

    const foundSkills = commonSkills.filter((skill) => text.includes(skill))

    for (const skill of foundSkills) {
      if (!skillCounts.has(skill)) {
        skillCounts.set(skill, { count: 0, salaries: [], jobs: [] })
        skillRecentCounts.set(skill, 0)
      }

      const data = skillCounts.get(skill)!
      data.count++
      data.jobs.push(job)

      if (job.salaryMin && job.salaryMax) {
        data.salaries.push((job.salaryMin + job.salaryMax) / 2)
      }

      if (job.createdAt > thirtyDaysAgo) {
        skillRecentCounts.set(skill, (skillRecentCounts.get(skill) || 0) + 1)
      }
    }
  }

  const trends: SkillDemandTrend[] = []

  for (const [skill, data] of skillCounts.entries()) {
    const recentCount = skillRecentCounts.get(skill) || 0
    const olderCount = data.count - recentCount
    const growthRate = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0

    const averageSalary =
      data.salaries.length > 0
        ? Math.round(data.salaries.reduce((sum, s) => sum + s, 0) / data.salaries.length)
        : 0

    let trend: "hot" | "growing" | "stable" | "declining"
    if (growthRate > 20 && data.count > 10) trend = "hot"
    else if (growthRate > 10) trend = "growing"
    else if (growthRate < -10) trend = "declining"
    else trend = "stable"

    trends.push({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      demandCount: data.count,
      growthRate: Math.round(growthRate * 10) / 10,
      averageSalary,
      jobCount: data.jobs.length,
      trend,
    })
  }

  return trends.sort((a, b) => b.demandCount - a.demandCount).slice(0, 30) // Top 30
}

/**
 * Get competitor insights (where candidates are going)
 */
export async function getCompetitorInsights(): Promise<CompetitorInsight[]> {
  const candidates = await prisma.candidate.findMany({
    where: {
      currentCompany: { not: null },
    },
    select: {
      currentCompany: true,
      jobTitle: true,
      currentCompanyTenureYears: true,
      currentCompanyTenureMonths: true,
    },
  })

  const companyData = new Map<
    string,
    {
      candidates: typeof candidates
      tenures: number[]
      roles: Map<string, number>
    }
  >()

  for (const candidate of candidates) {
    if (!candidate.currentCompany) continue

    if (!companyData.has(candidate.currentCompany)) {
      companyData.set(candidate.currentCompany, {
        candidates: [],
        tenures: [],
        roles: new Map(),
      })
    }

    const data = companyData.get(candidate.currentCompany)!
    data.candidates.push(candidate)

    // Calculate tenure in months
    const years = parseInt(candidate.currentCompanyTenureYears || "0") || 0
    const months = parseInt(candidate.currentCompanyTenureMonths || "0") || 0
    const totalMonths = years * 12 + months
    if (totalMonths > 0) {
      data.tenures.push(totalMonths)
    }

    if (candidate.jobTitle) {
      const normalizedTitle = await normalizeJobTitle(candidate.jobTitle)
      data.roles.set(normalizedTitle, (data.roles.get(normalizedTitle) || 0) + 1)
    }
  }

  const insights: CompetitorInsight[] = []

  for (const [company, data] of companyData.entries()) {
    const averageTenure =
      data.tenures.length > 0
        ? Math.round((data.tenures.reduce((sum, t) => sum + t, 0) / data.tenures.length) * 10) /
          10
        : 0

    const topRoles = Array.from(data.roles.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role, count]) => ({ role, count }))

    // Determine movement trend (simplified - based on candidate count growth)
    // In a real implementation, you'd track this over time
    const movementTrend: "gaining" | "losing" | "stable" = "stable"

    insights.push({
      company,
      candidateCount: data.candidates.length,
      averageTenure,
      topRoles,
      movementTrend,
    })
  }

  return insights.sort((a, b) => b.candidateCount - a.candidateCount).slice(0, 20) // Top 20
}

/**
 * Get supply/demand ratios for roles
 */
export async function getSupplyDemandRatios(): Promise<SupplyDemandRatio[]> {
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    select: { title: true },
  })

  const candidates = await prisma.candidate.findMany({
    select: { jobTitle: true },
  })

  // Normalize and count
  const jobCounts = new Map<string, number>()
  const candidateCounts = new Map<string, number>()

  for (const job of jobs) {
    const normalized = await normalizeJobTitle(job.title)
    jobCounts.set(normalized, (jobCounts.get(normalized) || 0) + 1)
  }

  for (const candidate of candidates) {
    if (!candidate.jobTitle) continue
    const normalized = await normalizeJobTitle(candidate.jobTitle)
    candidateCounts.set(normalized, (candidateCounts.get(normalized) || 0) + 1)
  }

  const ratios: SupplyDemandRatio[] = []

  // Get all unique roles
  const allRoles = new Set([...jobCounts.keys(), ...candidateCounts.keys()])

  for (const role of allRoles) {
    const jobCount = jobCounts.get(role) || 0
    const candidateCount = candidateCounts.get(role) || 0

    if (jobCount === 0) continue // Skip roles with no jobs

    const ratio = candidateCount / jobCount

    let status: "oversupplied" | "balanced" | "undersupplied"
    if (ratio > 3) status = "oversupplied"
    else if (ratio < 1) status = "undersupplied"
    else status = "balanced"

    ratios.push({
      role,
      candidateCount,
      jobCount,
      ratio: Math.round(ratio * 10) / 10,
      status,
    })
  }

  return ratios.sort((a, b) => b.jobCount - a.jobCount).slice(0, 30) // Top 30 by job count
}

/**
 * Get comprehensive market intelligence
 */
export async function getMarketIntelligence(): Promise<MarketIntelligence> {
  console.log("[market-intelligence] Fetching market intelligence data...")

  const [salaryInsights, skillDemandTrends, competitorInsights, supplyDemandRatios] =
    await Promise.all([
      getSalaryInsights(),
      getSkillDemandTrends(),
      getCompetitorInsights(),
      getSupplyDemandRatios(),
    ])

  console.log("[market-intelligence] Market intelligence data fetched successfully")

  return {
    salaryInsights,
    skillDemandTrends,
    competitorInsights,
    supplyDemandRatios,
    lastUpdated: new Date(),
  }
}

