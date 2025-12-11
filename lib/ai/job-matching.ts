import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface JobMatchResult {
  jobId: string
  jobTitle: string
  companyName: string
  matchScore: number // 0-100
  reasoning: string
  strengths: string[]
  gaps: string[]
}

/**
 * Match a candidate to available jobs
 */
export async function matchCandidateToJobs(
  candidate: Awaited<ReturnType<typeof prisma.candidate.findUnique>>,
  jobs: Awaited<ReturnType<typeof prisma.job.findMany>>
): Promise<JobMatchResult[]> {
  if (!isOpenAIConfigured()) {
    console.warn("OpenAI not configured, skipping job matching")
    return []
  }

  if (jobs.length === 0) {
    return []
  }

  try {
    const openai = getOpenAIClient()

    // Build candidate profile
    const candidateProfile = buildCandidateProfileText(candidate)
    
    // Build jobs text
    const jobsText = jobs.map((job: any) => {
      return `Job ID: ${job.id}
Title: ${job.title}
Company: ${job.company?.name || "Unknown"}
Location: ${job.location || "Not specified"}
Description: ${job.description.substring(0, 500)}${job.description.length > 500 ? "..." : ""}
Requirements: ${job.requirements?.substring(0, 300) || "Not specified"}`
    }).join("\n\n---\n\n")

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert recruiter matching candidates to jobs. Analyze how well the candidate fits each job and provide:
1. Match score (0-100) - how well the candidate fits
2. Reasoning - brief explanation of the match
3. Strengths - what makes them a good fit
4. Gaps - what might be missing

Return JSON array with one object per job:
[
  {
    "jobId": "job-id-here",
    "matchScore": 85,
    "reasoning": "Strong match because...",
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"]
  },
  ...
]`
        },
        {
          role: "user",
          content: `Candidate Profile:\n${candidateProfile}\n\nAvailable Jobs:\n${jobsText}\n\nMatch this candidate to the jobs.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    const parsed = JSON.parse(content)
    
    // Handle both array and object with array property
    let matches: any[] = []
    if (Array.isArray(parsed)) {
      matches = parsed
    } else if (parsed.matches && Array.isArray(parsed.matches)) {
      matches = parsed.matches
    } else if (parsed.results && Array.isArray(parsed.results)) {
      matches = parsed.results
    }

    // Enrich with job details
    const enrichedMatches: JobMatchResult[] = matches.map((match: any) => {
      const job = jobs.find((j: any) => j.id === match.jobId)
      return {
        jobId: match.jobId,
        jobTitle: job?.title || "Unknown",
        companyName: job?.company?.name || "Unknown",
        matchScore: Math.min(100, Math.max(0, match.matchScore || 0)),
        reasoning: match.reasoning || "No reasoning provided",
        strengths: Array.isArray(match.strengths) ? match.strengths : [],
        gaps: Array.isArray(match.gaps) ? match.gaps : [],
      }
    })

    // Sort by match score descending
    return enrichedMatches.sort((a: JobMatchResult, b: JobMatchResult) => b.matchScore - a.matchScore)
  } catch (error: any) {
    console.error("Error matching candidate to jobs:", error)
    return []
  }
}

/**
 * Build candidate profile text (reuse from candidate-ai.ts)
 */
function buildCandidateProfileText(candidate: Awaited<ReturnType<typeof prisma.candidate.findUnique>>): string {
  const parts: string[] = []

  parts.push(`Name: ${candidate.fullName}`)
  
  if (candidate.jobTitle) {
    parts.push(`Current Title: ${candidate.jobTitle}`)
  }
  
  if (candidate.currentCompany) {
    parts.push(`Current Company: ${candidate.currentCompany}`)
  }
  
  if (candidate.totalYearsExperience) {
    parts.push(`Total Experience: ${candidate.totalYearsExperience} years`)
  }
  
  if (candidate.previousTitles) {
    parts.push(`Previous Titles: ${candidate.previousTitles}`)
  }
  
  if (candidate.universities) {
    try {
      const universities = JSON.parse(candidate.universities)
      if (Array.isArray(universities) && universities.length > 0) {
        parts.push(`Education: ${universities.join(", ")}`)
      }
    } catch {
      parts.push(`Education: ${candidate.universities}`)
    }
  }
  
  if (candidate.degrees) {
    parts.push(`Degrees: ${candidate.degrees}`)
  }
  
  if (candidate.certifications) {
    parts.push(`Certifications: ${candidate.certifications}`)
  }
  
  if (candidate.companies) {
    try {
      const companies = JSON.parse(candidate.companies)
      if (Array.isArray(companies) && companies.length > 0) {
        parts.push(`Previous Companies: ${companies.join(", ")}`)
      }
    } catch {
      parts.push(`Previous Companies: ${candidate.companies}`)
    }
  }

  return parts.join("\n")
}

