import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

interface CandidateMatch {
  candidateId: string
  candidateName: string
  matchScore: number
  reasoning: string
  strengths: string[]
  gaps: string[]
}

/**
 * GET /api/jobs/[id]/top-candidates
 * Find the top 5 candidates for a specific job
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: jobId } = await params

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Get active candidates (limit to reasonable number for AI processing)
    const candidates = await prisma.candidate.findMany({
      where: {
        status: "ACTIVE",
      },
      take: 100, // Limit to 100 candidates for AI processing
      orderBy: {
        createdAt: "desc",
      },
    })

    if (candidates.length === 0) {
      return NextResponse.json({
        jobId: job.id,
        jobTitle: job.title,
        candidates: [],
        message: "No active candidates found",
      })
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        jobId: job.id,
        jobTitle: job.title,
        candidates: [],
        message: "AI service not configured",
      })
    }

    try {
      const openai = getOpenAIClient()

      // Build job description
      const jobDescription = `
Title: ${job.title}
Company: ${job.company.name}
Location: ${job.location || "Not specified"}
Employment Type: ${job.employmentType}
${job.isRemote ? "Remote: Yes" : ""}
${job.isHybrid ? "Hybrid: Yes" : ""}
Description: ${job.description?.substring(0, 1000) || "Not specified"}${job.description && job.description.length > 1000 ? "..." : ""}
${job.requirements ? `Requirements: ${job.requirements.substring(0, 500)}${job.requirements.length > 500 ? "..." : ""}` : ""}
`

      // Build candidates text (limit to avoid token limits)
      const candidatesText = candidates.slice(0, 50).map((candidate: any) => {
        const companies = candidate.companies ? JSON.parse(candidate.companies) : []
        const universities = candidate.universities ? JSON.parse(candidate.universities) : []
        
        return `Candidate ID: ${candidate.id}
Name: ${candidate.fullName}
Current Title: ${candidate.jobTitle || "Not specified"}
Current Company: ${candidate.currentCompany || "Not specified"}
Experience: ${candidate.totalYearsExperience || "Not specified"} years
Education: ${candidate.degrees || "Not specified"}
Universities: ${universities.length > 0 ? universities.join(", ") : "Not specified"}
Previous Companies: ${companies.length > 0 ? companies.join(", ") : "Not specified"}
Location: ${candidate.location || "Not specified"}
${candidate.certifications ? `Certifications: ${candidate.certifications}` : ""}
${candidate.projects ? `Projects: ${candidate.projects.substring(0, 200)}` : ""}`
      }).join("\n\n---\n\n")

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert recruiter matching candidates to a job. Analyze how well each candidate fits the job and provide:
1. Match score (0-100) - how well the candidate fits
2. Reasoning - brief explanation of the match
3. Strengths - what makes them a good fit (array of strings)
4. Gaps - what might be missing (array of strings)

Return JSON object with a "matches" array, sorted by match score (highest first):
{
  "matches": [
    {
      "candidateId": "candidate-id-here",
      "matchScore": 85,
      "reasoning": "Strong match because...",
      "strengths": ["strength1", "strength2"],
      "gaps": ["gap1", "gap2"]
    },
    ...
  ]
}

Only return the top 5 matches.`
          },
          {
            role: "user",
            content: `Job Description:\n${jobDescription}\n\nCandidates:\n${candidatesText}\n\nFind the top 5 candidates for this job.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No content in OpenAI response")
      }

      const parsed = JSON.parse(content) as { matches: CandidateMatch[] }
      
      // Get full candidate details for the matches
      const matchedCandidates = parsed.matches.slice(0, 5).map((match) => {
        const candidate = candidates.find((c: any) => c.id === match.candidateId)
        return {
          ...match,
          candidateName: candidate?.fullName || match.candidateName,
          candidate: candidate ? {
            id: candidate.id,
            fullName: candidate.fullName,
            jobTitle: candidate.jobTitle,
            currentCompany: candidate.currentCompany,
            location: candidate.location,
            linkedinUrl: candidate.linkedinUrl,
          } : null,
        }
      })

      return NextResponse.json({
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.company.name,
        candidates: matchedCandidates,
        totalCandidatesAnalyzed: candidates.length,
      })
    } catch (aiError: any) {
      console.error("AI matching error:", aiError)
      return NextResponse.json(
        { error: "Failed to generate matches", details: aiError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Top candidates error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
