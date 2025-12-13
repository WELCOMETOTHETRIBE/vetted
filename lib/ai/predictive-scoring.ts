import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface PredictiveScoreResult {
  score: number // 0-100
  confidence: "HIGH" | "MEDIUM" | "LOW"
  riskFactors: string[]
  reasoning: string
  strengths: string[]
  concerns: string[]
}

/**
 * Calculate predictive success score for a candidate-job match
 * This predicts the likelihood of candidate success in the role, not just skill match
 */
export async function calculatePredictiveScore(
  candidate: Awaited<ReturnType<typeof prisma.candidate.findUnique>>,
  job: Awaited<ReturnType<typeof prisma.job.findUnique>>
): Promise<PredictiveScoreResult | null> {
  if (!isOpenAIConfigured()) {
    console.warn("OpenAI not configured, skipping predictive scoring")
    return null
  }

  if (!candidate || !job) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    // Build candidate profile
    const candidateProfile = buildCandidateProfileText(candidate)

    // Build job description
    const jobDescription = `
Title: ${job.title}
Company: ${job.company?.name || "Unknown"}
Location: ${job.location || "Not specified"}
Employment Type: ${job.employmentType}
Remote: ${job.isRemote ? "Yes" : "No"}
Hybrid: ${job.isHybrid ? "Yes" : "No"}
Description: ${job.description.substring(0, 1000)}${job.description.length > 1000 ? "..." : ""}
Requirements: ${job.requirements?.substring(0, 500) || "Not specified"}
Salary Range: ${job.salaryMin ? `$${job.salaryMin}` : ""}${job.salaryMin && job.salaryMax ? " - " : ""}${job.salaryMax ? `$${job.salaryMax}` : ""}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert recruiter and talent analyst with years of experience predicting candidate success. 
Your task is to predict how likely a candidate is to succeed in a specific role, not just whether they match the skills.

Consider these factors:
1. **Skill Match (40%)**: How well do their skills align with requirements?
2. **Experience Level (20%)**: Is their experience appropriate (not over/underqualified)?
3. **Career Progression (15%)**: Does this role fit their career trajectory?
4. **Education Fit (10%)**: Does their education support the role?
5. **Location/Remote Fit (10%)**: Can they work in the required location/format?
6. **Red Flags (negative 5%)**: Job hopping, gaps, concerning patterns

Return a JSON object with:
{
  "score": 85,  // 0-100 success probability
  "confidence": "HIGH",  // HIGH (80%+ data), MEDIUM (50-79%), LOW (<50%)
  "riskFactors": ["risk1", "risk2"],  // Top 3 risk factors
  "reasoning": "Brief explanation of the score",
  "strengths": ["strength1", "strength2"],  // What predicts success
  "concerns": ["concern1", "concern2"]  // What might cause issues
}

Be realistic - most candidates should score 50-80. Only exceptional fits score 85+.
Only score 90+ for truly exceptional matches.`
        },
        {
          role: "user",
          content: `Predict success probability for this candidate in this role:

Candidate Profile:
${candidateProfile}

Job Details:
${jobDescription}

Provide a predictive success score with confidence level and risk factors.`
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

    // Validate and normalize
    const score = Math.min(100, Math.max(0, parsed.score || 0))
    const confidence = ["HIGH", "MEDIUM", "LOW"].includes(parsed.confidence)
      ? (parsed.confidence as "HIGH" | "MEDIUM" | "LOW")
      : "MEDIUM"

    return {
      score: Math.round(score * 10) / 10, // Round to 1 decimal
      confidence,
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      reasoning: parsed.reasoning || "Score calculated based on profile analysis",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    }
  } catch (error: any) {
    console.error("Error calculating predictive score:", error)
    return null
  }
}

/**
 * Build candidate profile text for predictive scoring
 */
function buildCandidateProfileText(
  candidate: Awaited<ReturnType<typeof prisma.candidate.findUnique>>
): string {
  const parts: string[] = []

  parts.push(`Name: ${candidate.fullName}`)

  if (candidate.jobTitle) {
    parts.push(`Current Title: ${candidate.jobTitle}`)
  }

  if (candidate.currentCompany) {
    parts.push(`Current Company: ${candidate.currentCompany}`)
    if (candidate.currentCompanyTenureYears || candidate.currentCompanyTenureMonths) {
      const years = candidate.currentCompanyTenureYears || "0"
      const months = candidate.currentCompanyTenureMonths || "0"
      parts.push(`Current Tenure: ${years} years, ${months} months`)
    }
    if (candidate.currentCompanyStartDate) {
      parts.push(`Started: ${candidate.currentCompanyStartDate}`)
    }
  }

  if (candidate.location) {
    parts.push(`Location: ${candidate.location}`)
  }

  if (candidate.totalYearsExperience) {
    parts.push(`Total Experience: ${candidate.totalYearsExperience} years`)
  }

  // Career progression analysis
  if (candidate.previousTitles) {
    parts.push(`Previous Titles: ${candidate.previousTitles}`)
  }

  if (candidate.previousTargetCompany) {
    parts.push(`Previous Company: ${candidate.previousTargetCompany}`)
    if (candidate.previousTargetCompanyTenureYears || candidate.previousTargetCompanyTenureMonths) {
      const years = candidate.previousTargetCompanyTenureYears || "0"
      const months = candidate.previousTargetCompanyTenureMonths || "0"
      parts.push(`Previous Tenure: ${years} years, ${months} months`)
    }
  }

  // Education
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

  if (candidate.undergradGraduationYear) {
    parts.push(`Graduation Year: ${candidate.undergradGraduationYear}`)
  }

  // Additional qualifications
  if (candidate.certifications) {
    parts.push(`Certifications: ${candidate.certifications}`)
  }

  if (candidate.projects) {
    parts.push(`Projects: ${candidate.projects}`)
  }

  if (candidate.publications) {
    parts.push(`Publications: ${candidate.publications}`)
  }

  // Company history for stability analysis
  if (candidate.companies) {
    try {
      const companies = JSON.parse(candidate.companies)
      if (Array.isArray(companies) && companies.length > 0) {
        parts.push(`Company History: ${companies.join(", ")}`)
      }
    } catch {
      parts.push(`Company History: ${candidate.companies}`)
    }
  }

  // Skills count as proxy for technical depth
  if (candidate.skillsCount) {
    parts.push(`Skills Listed: ${candidate.skillsCount}`)
  }

  // AI summary if available (provides context)
  if (candidate.aiSummary) {
    parts.push(`\nAI Summary: ${candidate.aiSummary.substring(0, 300)}`)
  }

  // AI concerns if available (important for risk assessment)
  if (candidate.aiConcerns) {
    try {
      const concerns = JSON.parse(candidate.aiConcerns)
      if (Array.isArray(concerns) && concerns.length > 0) {
        parts.push(`\nNoted Concerns: ${concerns.join(", ")}`)
      }
    } catch {
      parts.push(`\nNoted Concerns: ${candidate.aiConcerns}`)
    }
  }

  return parts.join("\n")
}

