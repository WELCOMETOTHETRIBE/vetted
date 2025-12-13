import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface ResumeUpdateData {
  suggestions: string[]
  updatedSections: Record<string, string>
  summary: string
}

/**
 * Generate resume updates/modifications for a candidate based on a job
 */
export async function generateResumeUpdates(
  candidateId: string,
  jobId: string
): Promise<ResumeUpdateData | null> {
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

    // Build candidate profile text
    const candidateProfile = `
Name: ${candidate.fullName}
Current Title: ${candidate.jobTitle || "Not specified"}
Current Company: ${candidate.currentCompany || "Not specified"}
Location: ${candidate.location || "Not specified"}
Experience: ${candidate.totalYearsExperience || "Not specified"}
Summary: ${candidate.aiSummary || candidate.rawData ? JSON.parse(candidate.rawData || "{}").summary || "No summary available" : "No summary available"}
Skills: ${candidate.skillsCount || 0} skills listed
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
          content: `You are an expert resume writer and career coach. Analyze the candidate's resume and the job description, then provide:
1. Specific suggestions for resume updates/modifications to better align with the job
2. Updated sections (like summary, skills, experience descriptions) tailored to the role
3. A brief summary of key changes

Return your response as JSON with this structure:
{
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "updatedSections": {
    "summary": "Updated professional summary",
    "skills": "Updated skills section",
    "experience": "Updated experience descriptions"
  },
  "summary": "Brief summary of key changes and why they matter"
}

Be specific, actionable, and focus on aligning the candidate's resume with the job requirements.`
        },
        {
          role: "user",
          content: `Analyze this candidate's resume and suggest updates for this job:

Candidate Profile:
${candidateProfile}

Job Description:
${jobDescription}

Provide specific resume updates and modifications.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    const parsed = JSON.parse(content) as ResumeUpdateData

    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      updatedSections: parsed.updatedSections || {},
      summary: parsed.summary || "Resume updates generated successfully.",
    }
  } catch (error: any) {
    console.error("Error generating resume updates:", error)
    return null
  }
}

