import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

/**
 * Generate a personalized cover letter for a candidate applying to a job
 */
export async function generateCoverLetterForCandidate(
  candidateId: string,
  jobId: string
): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    // Get candidate data
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (!candidate) {
      throw new Error("Candidate not found")
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!job) {
      throw new Error("Job not found")
    }

    // Safely parse rawData to extract summary
    let candidateSummary = candidate.aiSummary || "No summary available"
    if (!candidate.aiSummary && candidate.rawData) {
      try {
        // Limit rawData size to prevent parsing issues with very large JSON
        const rawDataToParse = candidate.rawData.length > 100000 
          ? candidate.rawData.substring(0, 100000) + "..." 
          : candidate.rawData
        const parsed = JSON.parse(rawDataToParse)
        candidateSummary = parsed.summary || candidateSummary
      } catch (parseError) {
        // If JSON parsing fails, try to extract summary from raw text
        console.warn("Failed to parse candidate rawData JSON, using fallback:", parseError)
        // Try to find summary in raw text if it's not valid JSON
        const summaryMatch = candidate.rawData.match(/"summary"\s*:\s*"([^"]+)"/i)
        if (summaryMatch) {
          candidateSummary = summaryMatch[1]
        }
      }
    }

    // Build candidate profile text
    const candidateProfile = `
Name: ${candidate.fullName}
Current Title: ${candidate.jobTitle || "Not specified"}
Current Company: ${candidate.currentCompany || "Not specified"}
Location: ${candidate.location || "Not specified"}
Experience: ${candidate.totalYearsExperience || "Not specified"}
Summary: ${candidateSummary}
${candidate.certifications ? `Certifications: ${candidate.certifications}` : ""}
${candidate.languages ? `Languages: ${candidate.languages}` : ""}
${candidate.projects ? `Projects: ${candidate.projects}` : ""}
${candidate.publications ? `Publications: ${candidate.publications}` : ""}
${candidate.honorsAwards ? `Awards: ${candidate.honorsAwards}` : ""}
`

    // Build job description
    const jobDescription = `
Title: ${job.title}
Company: ${job.company.name}
Location: ${job.location || "Not specified"}
Description: ${job.description?.substring(0, 1500) || "No description"}${job.description && job.description.length > 1500 ? "..." : ""}
${job.requirements ? `Requirements: ${job.requirements.substring(0, 800)}${job.requirements.length > 800 ? "..." : ""}` : ""}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert career coach writing personalized cover letters. Write a compelling cover letter that:
1. Opens with a strong introduction mentioning the specific role and company
2. Highlights relevant experience and skills that match the job
3. Shows enthusiasm and cultural fit
4. Closes with a clear call to action
5. Uses professional and polished tone
6. Is 3-4 paragraphs (250-350 words)

Make it specific, authentic, and tailored to this exact role. Avoid generic phrases.`
        },
        {
          role: "user",
          content: `Write a cover letter for this candidate applying to this job:

Candidate Profile:
${candidateProfile}

Job Details:
${jobDescription}`
        }
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || null
  } catch (error: any) {
    console.error("Error generating cover letter for candidate:", error)
    return null
  }
}

