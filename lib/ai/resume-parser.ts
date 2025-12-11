import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface ParsedResume {
  name: string | null
  email: string | null
  phone: string | null
  summary: string | null
  skills: string[]
  experience: Array<{
    title: string
    company: string
    startDate: string | null
    endDate: string | null
    description: string | null
  }>
  education: Array<{
    school: string
    degree: string | null
    fieldOfStudy: string | null
    graduationYear: string | null
  }>
  certifications: string[]
  languages: string[]
}

/**
 * Parse resume text using OpenAI
 * Note: This assumes the resume text has already been extracted from PDF/DOCX
 * For production, use a library like pdf-parse or mammoth for file extraction
 */
export async function parseResumeText(resumeText: string): Promise<ParsedResume | null> {
  if (!isOpenAIConfigured()) {
    console.warn("OpenAI not configured, skipping resume parsing")
    return null
  }

  try {
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at parsing resumes. Extract structured data from the resume text and return it as JSON.

Return JSON with this exact structure:
{
  "name": "Full Name or null",
  "email": "email@example.com or null",
  "phone": "phone number or null",
  "summary": "Professional summary or null",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "YYYY-MM or YYYY or null",
      "endDate": "YYYY-MM or YYYY or null",
      "description": "Job description or null"
    }
  ],
  "education": [
    {
      "school": "School Name",
      "degree": "Degree Type or null",
      "fieldOfStudy": "Field of Study or null",
      "graduationYear": "YYYY or null"
    }
  ],
  "certifications": ["cert1", "cert2", ...],
  "languages": ["language1", "language2", ...]
}

Extract all available information. If a field is not found, use null or empty array.`
        },
        {
          role: "user",
          content: `Parse this resume:\n\n${resumeText.substring(0, 8000)}` // Limit to 8000 chars
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more accurate extraction
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    const parsed = JSON.parse(content) as ParsedResume

    // Validate and normalize
    return {
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      summary: parsed.summary || null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    }
  } catch (error: any) {
    console.error("Error parsing resume:", error)
    return null
  }
}

/**
 * Extract text from resume file buffer
 * This is a basic implementation - in production, use proper PDF/DOCX parsers
 */
export async function extractTextFromResume(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // For now, we'll need to handle this at the API level
  // This is a placeholder - actual implementation would use pdf-parse, mammoth, etc.
  throw new Error("Text extraction from files not yet implemented. Please extract text first.")
}

