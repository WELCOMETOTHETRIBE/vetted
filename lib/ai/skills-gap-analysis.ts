import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface SkillGap {
  skill: string
  requiredCount: number // How many jobs require this skill
  availableCount: number // How many candidates have this skill
  gap: number // requiredCount - availableCount
  gapPercentage: number // (gap / requiredCount) * 100
  severity: "critical" | "high" | "moderate" | "low"
  averageSalary: number
  jobCount: number
  candidateCount: number
}

export interface UpskillingOpportunity {
  skill: string
  currentDemand: number
  projectedGrowth: number
  averageSalary: number
  learningResources: string[]
  estimatedTimeToLearn: string
  priority: "high" | "medium" | "low"
}

export interface SkillTrend {
  skill: string
  currentGap: number
  previousGap: number
  trend: "improving" | "worsening" | "stable"
  changePercentage: number
  period: string // e.g., "30 days"
}

export interface SkillsGapAnalysis {
  skillGaps: SkillGap[]
  upskillingOpportunities: UpskillingOpportunity[]
  skillTrends: SkillTrend[]
  overallGapScore: number // 0-100, higher = more gaps
  lastUpdated: Date
}

// Common technical skills to look for
const COMMON_SKILLS = [
  // Programming Languages
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "golang",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "scala",
  // Frontend
  "react",
  "vue",
  "angular",
  "next.js",
  "svelte",
  "html",
  "css",
  "tailwind",
  // Backend
  "node.js",
  "express",
  "django",
  "flask",
  "spring",
  "laravel",
  "rails",
  // Databases
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "elasticsearch",
  "dynamodb",
  "cassandra",
  // Cloud & DevOps
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "terraform",
  "jenkins",
  "ci/cd",
  "github actions",
  "gitlab",
  // AI/ML
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "ai",
  "data science",
  "nlp",
  // Tools & Frameworks
  "graphql",
  "rest api",
  "microservices",
  "agile",
  "scrum",
  "git",
  "linux",
  // Other
  "sql",
  "nosql",
  "api development",
  "system design",
  "distributed systems",
]

/**
 * Extract skills from text using keyword matching and AI
 */
function extractSkillsFromText(text: string): string[] {
  if (!text) return []

  const lowerText = text.toLowerCase()
  const foundSkills: Set<string> = new Set()

  // Match common skills
  for (const skill of COMMON_SKILLS) {
    if (lowerText.includes(skill)) {
      foundSkills.add(skill)
    }
  }

  return Array.from(foundSkills)
}

/**
 * Extract skills from candidate data
 */
async function extractCandidateSkills(candidate: any): Promise<string[]> {
  const skills: Set<string> = new Set()

  // Extract from certifications
  if (candidate.certifications) {
    try {
      const certs = JSON.parse(candidate.certifications)
      if (Array.isArray(certs)) {
        certs.forEach((cert: string) => {
          extractSkillsFromText(cert).forEach((s) => skills.add(s))
        })
      }
    } catch {
      // Not JSON, treat as plain text
      extractSkillsFromText(candidate.certifications).forEach((s) => skills.add(s))
    }
  }

  // Extract from courses
  if (candidate.courses) {
    try {
      const courses = JSON.parse(candidate.courses)
      if (Array.isArray(courses)) {
        courses.forEach((course: string) => {
          extractSkillsFromText(course).forEach((s) => skills.add(s))
        })
      }
    } catch {
      extractSkillsFromText(candidate.courses).forEach((s) => skills.add(s))
    }
  }

  // Extract from projects
  if (candidate.projects) {
    extractSkillsFromText(candidate.projects).forEach((s) => skills.add(s))
  }

  // Extract from job title
  if (candidate.jobTitle) {
    extractSkillsFromText(candidate.jobTitle).forEach((s) => skills.add(s))
  }

  // Extract from previous titles
  if (candidate.previousTitles) {
    extractSkillsFromText(candidate.previousTitles).forEach((s) => skills.add(s))
  }

  // Extract from rawData if available
  if (candidate.rawData) {
    try {
      const rawData = JSON.parse(candidate.rawData)
      const rawText = JSON.stringify(rawData).toLowerCase()
      extractSkillsFromText(rawText).forEach((s) => skills.add(s))
    } catch {
      // Not JSON
    }
  }

  return Array.from(skills)
}

/**
 * Extract skills from job description and requirements
 */
function extractJobSkills(job: any): string[] {
  const skills: Set<string> = new Set()

  // Extract from description
  if (job.description) {
    extractSkillsFromText(job.description).forEach((s) => skills.add(s))
  }

  // Extract from requirements
  if (job.requirements) {
    extractSkillsFromText(job.requirements).forEach((s) => skills.add(s))
  }

  // Extract from title
  if (job.title) {
    extractSkillsFromText(job.title).forEach((s) => skills.add(s))
  }

  return Array.from(skills)
}

/**
 * Get skills gap analysis
 */
export async function getSkillsGapAnalysis(): Promise<SkillsGapAnalysis> {
  console.log("[skills-gap-analysis] Starting skills gap analysis...")

  // Get all active jobs
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      salaryMin: true,
      salaryMax: true,
    },
  })

  // Get all active candidates
  const candidates = await prisma.candidate.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      jobTitle: true,
      certifications: true,
      courses: true,
      projects: true,
      previousTitles: true,
      rawData: true,
    },
  })

  console.log(
    `[skills-gap-analysis] Analyzing ${jobs.length} jobs and ${candidates.length} candidates`
  )

  // Extract skills from jobs
  const jobSkills = new Map<string, { count: number; salaries: number[]; jobIds: string[] }>()
  for (const job of jobs) {
    const skills = extractJobSkills(job)
    for (const skill of skills) {
      if (!jobSkills.has(skill)) {
        jobSkills.set(skill, { count: 0, salaries: [], jobIds: [] })
      }
      const data = jobSkills.get(skill)!
      data.count++
      data.jobIds.push(job.id)
      if (job.salaryMin && job.salaryMax) {
        data.salaries.push((job.salaryMin + job.salaryMax) / 2)
      }
    }
  }

  // Extract skills from candidates
  const candidateSkills = new Map<string, { count: number; candidateIds: string[] }>()
  for (const candidate of candidates) {
    const skills = await extractCandidateSkills(candidate)
    for (const skill of skills) {
      if (!candidateSkills.has(skill)) {
        candidateSkills.set(skill, { count: 0, candidateIds: [] })
      }
      const data = candidateSkills.get(skill)!
      data.count++
      data.candidateIds.push(candidate.id)
    }
  }

  // Calculate gaps
  const skillGaps: SkillGap[] = []
  const allSkills = new Set([...jobSkills.keys(), ...candidateSkills.keys()])

  for (const skill of allSkills) {
    const requiredData = jobSkills.get(skill) || { count: 0, salaries: [], jobIds: [] }
    const availableData = candidateSkills.get(skill) || { count: 0, candidateIds: [] }

    // Only include skills that are required by jobs
    if (requiredData.count === 0) continue

    const gap = requiredData.count - availableData.count
    const gapPercentage = requiredData.count > 0 ? (gap / requiredData.count) * 100 : 0

    let severity: "critical" | "high" | "moderate" | "low"
    if (gapPercentage > 50) severity = "critical"
    else if (gapPercentage > 30) severity = "high"
    else if (gapPercentage > 10) severity = "moderate"
    else severity = "low"

    const averageSalary =
      requiredData.salaries.length > 0
        ? Math.round(
            requiredData.salaries.reduce((sum, s) => sum + s, 0) / requiredData.salaries.length
          )
        : 0

    skillGaps.push({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      requiredCount: requiredData.count,
      availableCount: availableData.count,
      gap,
      gapPercentage: Math.round(gapPercentage * 10) / 10,
      severity,
      averageSalary,
      jobCount: requiredData.jobIds.length,
      candidateCount: availableData.candidateIds.length,
    })
  }

  // Sort by gap percentage (highest first)
  skillGaps.sort((a, b) => b.gapPercentage - a.gapPercentage)

  // Calculate overall gap score (0-100, higher = more gaps)
  const totalRequired = skillGaps.reduce((sum, gap) => sum + gap.requiredCount, 0)
  const totalAvailable = skillGaps.reduce((sum, gap) => sum + gap.availableCount, 0)
  const overallGapScore =
    totalRequired > 0 ? Math.round(((totalRequired - totalAvailable) / totalRequired) * 100) : 0

  // Generate upskilling opportunities
  const upskillingOpportunities: UpskillingOpportunity[] = skillGaps
    .filter((gap) => gap.severity === "critical" || gap.severity === "high")
    .slice(0, 20)
    .map((gap) => {
      // Estimate learning resources and time
      const learningResources = getLearningResources(gap.skill)
      const estimatedTime = estimateLearningTime(gap.skill)

      return {
        skill: gap.skill,
        currentDemand: gap.requiredCount,
        projectedGrowth: gap.gapPercentage > 0 ? gap.gapPercentage : 0,
        averageSalary: gap.averageSalary,
        learningResources,
        estimatedTimeToLearn: estimatedTime,
        priority: gap.severity === "critical" ? "high" : "medium",
      }
    })

  console.log(
    `[skills-gap-analysis] Analysis complete: ${skillGaps.length} skill gaps identified, overall gap score: ${overallGapScore}`
  )

  return {
    skillGaps: skillGaps.slice(0, 50), // Top 50 gaps
    upskillingOpportunities,
    overallGapScore,
    lastUpdated: new Date(),
  }
}

/**
 * Get learning resources for a skill
 */
function getLearningResources(skill: string): string[] {
  const skillLower = skill.toLowerCase()
  const resources: string[] = []

  // Programming languages
  if (skillLower.includes("javascript") || skillLower.includes("typescript")) {
    resources.push("MDN Web Docs", "freeCodeCamp", "JavaScript.info")
  } else if (skillLower.includes("python")) {
    resources.push("Python.org Tutorial", "Real Python", "freeCodeCamp")
  } else if (skillLower.includes("react")) {
    resources.push("React Official Docs", "React Tutorial", "freeCodeCamp React")
  } else if (skillLower.includes("aws")) {
    resources.push("AWS Training", "AWS Documentation", "A Cloud Guru")
  } else if (skillLower.includes("docker")) {
    resources.push("Docker Documentation", "Docker Tutorial", "Docker Hub")
  } else if (skillLower.includes("kubernetes")) {
    resources.push("Kubernetes.io Docs", "Kubernetes Tutorial", "CNCF Training")
  } else if (skillLower.includes("machine learning") || skillLower.includes("ai")) {
    resources.push("Coursera ML Course", "Fast.ai", "Kaggle Learn")
  }

  // Default resources
  if (resources.length === 0) {
    resources.push("Official Documentation", "Online Courses", "Community Forums")
  }

  return resources
}

/**
 * Estimate learning time for a skill
 */
function estimateLearningTime(skill: string): string {
  const skillLower = skill.toLowerCase()

  // Complex skills
  if (
    skillLower.includes("kubernetes") ||
    skillLower.includes("machine learning") ||
    skillLower.includes("ai")
  ) {
    return "3-6 months"
  }

  // Medium complexity
  if (
    skillLower.includes("aws") ||
    skillLower.includes("docker") ||
    skillLower.includes("react") ||
    skillLower.includes("node.js")
  ) {
    return "1-3 months"
  }

  // Simpler skills
  if (
    skillLower.includes("javascript") ||
    skillLower.includes("python") ||
    skillLower.includes("git")
  ) {
    return "2-4 weeks"
  }

  return "1-2 months"
}

