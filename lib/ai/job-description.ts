import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface JobDescriptionInput {
  title: string
  companyName?: string
  location?: string
  employmentType?: string
  requirements?: string[]
  responsibilities?: string[]
  preferredQualifications?: string[]
}

/**
 * Generate or enhance a job description
 */
export async function generateJobDescription(
  input: JobDescriptionInput
): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    const requirementsText = input.requirements?.length
      ? `Requirements:\n${input.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : ""

    const responsibilitiesText = input.responsibilities?.length
      ? `Responsibilities:\n${input.responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : ""

    const preferredText = input.preferredQualifications?.length
      ? `Preferred Qualifications:\n${input.preferredQualifications.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : ""

    const prompt = `Create a professional, engaging job description for:

Title: ${input.title}
${input.companyName ? `Company: ${input.companyName}` : ""}
${input.location ? `Location: ${input.location}` : ""}
${input.employmentType ? `Employment Type: ${input.employmentType}` : ""}

${requirementsText}

${responsibilitiesText}

${preferredText}

Write a comprehensive job description that:
1. Starts with an engaging overview of the role
2. Lists key responsibilities clearly
3. Outlines required qualifications
4. Includes preferred qualifications if provided
5. Ends with a compelling call-to-action

Make it professional, clear, and attractive to qualified candidates.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at writing job descriptions. Create clear, engaging, and professional job postings that attract qualified candidates."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || null
  } catch (error: any) {
    console.error("Error generating job description:", error)
    return null
  }
}

/**
 * Enhance an existing job description
 */
export async function enhanceJobDescription(
  existingDescription: string,
  improvements?: string[]
): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    const improvementsText = improvements?.length
      ? `\n\nFocus on improving:\n${improvements.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`
      : ""

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at improving job descriptions. Enhance the provided description to make it more engaging, clear, and attractive to candidates while maintaining accuracy."
        },
        {
          role: "user",
          content: `Improve this job description:${improvementsText}\n\n${existingDescription}`
        }
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || null
  } catch (error: any) {
    console.error("Error enhancing job description:", error)
    return null
  }
}

