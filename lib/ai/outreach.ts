import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { Candidate, Job } from "@prisma/client"

/**
 * Generate personalized outreach message for a candidate
 */
export async function generateOutreachMessage(
  candidate: Candidate,
  job?: Job | null,
  recruiterName?: string,
  companyName?: string
): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    // Build candidate context
    const candidateContext = `
Name: ${candidate.fullName}
Current Title: ${candidate.jobTitle || "Not specified"}
Current Company: ${candidate.currentCompany || "Not specified"}
Location: ${candidate.location || "Not specified"}
Experience: ${candidate.totalYearsExperience || "Not specified"} years
${candidate.degrees ? `Education: ${candidate.degrees}` : ""}
${candidate.certifications ? `Certifications: ${candidate.certifications}` : ""}
`

    const jobContext = job
      ? `
Job Title: ${job.title}
Company: ${(job as any).company?.name || companyName || "Our company"}
Location: ${job.location || "Not specified"}
Description: ${job.description.substring(0, 500)}${job.description.length > 500 ? "..." : ""}
`
      : ""

    const recruiterContext = recruiterName
      ? `Recruiter: ${recruiterName}`
      : ""

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional recruiter writing personalized outreach messages. Write a concise, friendly, and professional message that:
1. Introduces yourself/company
2. Mentions something specific about the candidate's background
3. Explains why they might be interested
4. Includes a clear call-to-action
5. Is warm but not overly casual
6. Is 2-3 short paragraphs maximum

Keep it professional, personalized, and engaging.`
        },
        {
          role: "user",
          content: `Write an outreach message for this candidate:${candidateContext}${jobContext}${recruiterContext ? `\n${recruiterContext}` : ""}`
        }
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || null
  } catch (error: any) {
    console.error("Error generating outreach message:", error)
    return null
  }
}

