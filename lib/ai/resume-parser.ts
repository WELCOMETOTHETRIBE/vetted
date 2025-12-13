import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface ParsedResume {
  name: string | null
  email: string | null
  phone: string | null
  summary: string | null
  headline: string | null
  location: string | null
  website: string | null
  currentTitle: string | null
  currentCompany: string | null
  industry: string | null
  skills: string[]
  experience: Array<{
    title: string
    company: string
    location: string | null
    startDate: string | null
    endDate: string | null
    description: string | null
    isCurrent: boolean
  }>
  education: Array<{
    school: string
    degree: string | null
    fieldOfStudy: string | null
    graduationYear: string | null
    gpa: string | null
  }>
  certifications: string[]
  languages: string[]
  projects: Array<{
    name: string
    description: string | null
    url: string | null
  }>
  publications: string[]
  volunteerWork: Array<{
    organization: string
    role: string | null
    description: string | null
  }>
  awards: string[]
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
          content: `You are an expert at parsing resumes. Extract comprehensive structured data from the resume text and return it as JSON.

Return JSON with this exact structure:
{
  "name": "Full Name or null",
  "email": "email@example.com or null",
  "phone": "phone number or null",
  "summary": "Professional summary/objective or null",
  "headline": "Professional headline or current title or null",
  "location": "City, State/Country or null",
  "website": "Personal website or portfolio URL or null",
  "currentTitle": "Current job title or null",
  "currentCompany": "Current company name or null",
  "industry": "Industry sector or null",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location or null",
      "startDate": "YYYY-MM or YYYY or null",
      "endDate": "YYYY-MM or YYYY or Present or null",
      "description": "Job description/bullet points or null",
      "isCurrent": true or false
    }
  ],
  "education": [
    {
      "school": "School/University Name",
      "degree": "Degree Type (BS, MS, PhD, etc.) or null",
      "fieldOfStudy": "Major/Field of Study or null",
      "graduationYear": "YYYY or null",
      "gpa": "GPA or null"
    }
  ],
  "certifications": ["cert1", "cert2", ...],
  "languages": ["language1 (proficiency)", "language2", ...],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description or null",
      "url": "Project URL or null"
    }
  ],
  "publications": ["publication1", "publication2", ...],
  "volunteerWork": [
    {
      "organization": "Organization Name",
      "role": "Role/Title or null",
      "description": "Description or null"
    }
  ],
  "awards": ["award1", "award2", ...]
}

Extract ALL available information comprehensively. If a field is not found, use null or empty array. Be thorough and extract everything you can find.`
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
      headline: parsed.headline || parsed.currentTitle || null,
      location: parsed.location || null,
      website: parsed.website || null,
      currentTitle: parsed.currentTitle || null,
      currentCompany: parsed.currentCompany || null,
      industry: parsed.industry || null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience.map((exp: any) => ({
        ...exp,
        isCurrent: exp.isCurrent ?? (exp.endDate === null || exp.endDate?.toLowerCase().includes("present") || exp.endDate === ""),
      })) : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      publications: Array.isArray(parsed.publications) ? parsed.publications : [],
      volunteerWork: Array.isArray(parsed.volunteerWork) ? parsed.volunteerWork : [],
      awards: Array.isArray(parsed.awards) ? parsed.awards : [],
    }
  } catch (error: any) {
    console.error("Error parsing resume:", error)
    return null
  }
}

/**
 * Extract text from resume file buffer
 * Supports PDF and DOCX files
 */
export async function extractTextFromResume(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()
  
  if (ext === 'pdf') {
    try {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text || ""
    } catch (error: any) {
      console.error("Error parsing PDF:", error)
      throw new Error(`Failed to parse PDF: ${error.message}`)
    }
  } else if (ext === 'docx') {
    try {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ""
    } catch (error: any) {
      console.error("Error parsing DOCX:", error)
      throw new Error(`Failed to parse DOCX: ${error.message}`)
    }
  } else if (ext === 'doc') {
    // Old .doc format - try mammoth first, fallback to error
    try {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ""
    } catch (error: any) {
      throw new Error(`Failed to parse DOC file. Please convert to DOCX or PDF. Error: ${error.message}`)
    }
  } else if (ext === 'txt') {
    // Plain text files
    return buffer.toString('utf-8')
  } else {
    throw new Error(`Unsupported file type: ${ext}. Supported: PDF, DOCX, DOC, TXT`)
  }
}

/**
 * Parse resume from file buffer (with text extraction)
 * This is a convenience function that extracts text then parses it
 */
export async function parseResumeFromFile(
  buffer: Buffer,
  filename: string
): Promise<ParsedResume | null> {
  try {
    const text = await extractTextFromResume(buffer, filename)
    return await parseResumeText(text)
  } catch (error: any) {
    console.error("Error parsing resume file:", error)
    return null
  }
}

