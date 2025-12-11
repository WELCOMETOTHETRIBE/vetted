import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

interface CandidateAISummary {
  summary: string
  keyStrengths: string[]
  bestFitRoles: string[]
  highlights: string[]
  concerns: string[]
}

/**
 * Generate AI summary for a candidate
 */
export async function generateCandidateSummary(
  candidate: Awaited<ReturnType<typeof prisma.candidate.findUnique>>
): Promise<CandidateAISummary | null> {
  if (!isOpenAIConfigured()) {
    console.warn("OpenAI not configured, skipping AI summary generation")
    return null
  }

  try {
    const openai = getOpenAIClient()

    // Build candidate profile text from available data
    const profileText = buildCandidateProfileText(candidate)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using cheaper model for summaries
      messages: [
        {
          role: "system",
          content: `You are an expert recruiter analyzing candidate profiles. Generate a concise, professional summary with:
1. A 2-3 sentence summary of the candidate
2. 3-4 key strengths (bullet points)
3. Best fit roles (e.g., "Senior Backend Engineer at FinTech startups")
4. Notable highlights (impressive achievements, experience)
5. Potential concerns or gaps (be constructive, not negative)

Return your response as JSON with this structure:
{
  "summary": "Brief summary text",
  "keyStrengths": ["strength1", "strength2", ...],
  "bestFitRoles": ["role1", "role2", ...],
  "highlights": ["highlight1", "highlight2", ...],
  "concerns": ["concern1", "concern2", ...]
}`
        },
        {
          role: "user",
          content: `Analyze this candidate profile:\n\n${profileText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    const parsed = JSON.parse(content) as CandidateAISummary

    // Validate structure
    if (!parsed.summary || !Array.isArray(parsed.keyStrengths)) {
      throw new Error("Invalid response structure from OpenAI")
    }

    return parsed
  } catch (error: any) {
    console.error("Error generating candidate summary:", error)
    // Don't throw - return null so upload can continue
    return null
  }
}

/**
 * Build a text representation of candidate profile for AI analysis
 */
function buildCandidateProfileText(candidate: Awaited<ReturnType<typeof prisma.candidate.findUnique>>): string {
  const parts: string[] = []

  parts.push(`Name: ${candidate.fullName}`)
  
  if (candidate.jobTitle) {
    parts.push(`Current Title: ${candidate.jobTitle}`)
  }
  
  if (candidate.currentCompany) {
    parts.push(`Current Company: ${candidate.currentCompany}`)
    if (candidate.currentCompanyTenureYears || candidate.currentCompanyTenureMonths) {
      parts.push(`Tenure: ${candidate.currentCompanyTenureYears || 0} years, ${candidate.currentCompanyTenureMonths || 0} months`)
    }
  }
  
  if (candidate.location) {
    parts.push(`Location: ${candidate.location}`)
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
  
  if (candidate.fieldsOfStudy) {
    try {
      const fields = JSON.parse(candidate.fieldsOfStudy)
      if (Array.isArray(fields) && fields.length > 0) {
        parts.push(`Fields of Study: ${fields.join(", ")}`)
      }
    } catch {
      parts.push(`Fields of Study: ${candidate.fieldsOfStudy}`)
    }
  }
  
  if (candidate.degrees) {
    parts.push(`Degrees: ${candidate.degrees}`)
  }
  
  if (candidate.certifications) {
    parts.push(`Certifications: ${candidate.certifications}`)
  }
  
  if (candidate.projects) {
    parts.push(`Projects: ${candidate.projects}`)
  }
  
  if (candidate.publications) {
    parts.push(`Publications: ${candidate.publications}`)
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
  
  if (candidate.languages) {
    parts.push(`Languages: ${candidate.languages}`)
  }
  
  if (candidate.skillsCount) {
    parts.push(`Skills Count: ${candidate.skillsCount}`)
  }

  return parts.join("\n")
}

