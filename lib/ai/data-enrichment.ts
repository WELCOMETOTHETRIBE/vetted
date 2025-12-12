import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface EnrichedCandidateData {
  // Basic Info
  fullName?: string
  jobTitle?: string
  currentCompany?: string
  location?: string
  
  // Experience
  totalYearsExperience?: string
  currentCompanyStartDate?: string
  currentCompanyEndDate?: string
  currentCompanyTenureYears?: string
  currentCompanyTenureMonths?: string
  previousTargetCompany?: string
  previousTitles?: string
  companies?: string[]
  
  // Education
  universities?: string[]
  fieldsOfStudy?: string[]
  degrees?: string
  undergradGraduationYear?: string
  
  // Additional
  certifications?: string
  languages?: string
  projects?: string
  publications?: string
  volunteerOrganizations?: string
  courses?: string
  honorsAwards?: string
  organizations?: string
  patents?: string
  testScores?: string
  
  // Contact
  emails?: string
  phones?: string
  socialLinks?: string
  
  // Metadata
  skillsCount?: number
  experienceCount?: number
  educationCount?: number
}

/**
 * Enrich candidate data using AI to parse raw HTML/text and fill missing fields
 */
export async function enrichCandidateDataWithAI(
  existingData: Record<string, any>,
  rawHtml?: string,
  rawText?: string
): Promise<EnrichedCandidateData | null> {
  if (!isOpenAIConfigured()) {
    console.warn("OpenAI not configured, skipping AI enrichment")
    return null
  }

  try {
    const openai = getOpenAIClient()

    // Build context from existing data
    const existingFields: string[] = []
    Object.entries(existingData).forEach(([key, value]) => {
      if (value && value !== "" && value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            existingFields.push(`${key}: ${JSON.stringify(value)}`)
          }
        } else {
          existingFields.push(`${key}: ${value}`)
        }
      }
    })

    // Prepare raw data (limit size to avoid token limits)
    const rawDataText = rawText || rawHtml || ""
    const truncatedRawData = rawDataText.substring(0, 8000) // Limit to 8000 chars
    const hasMoreData = rawDataText.length > 8000

    const prompt = `You are an expert data extraction assistant. Analyze the raw HTML/text data from a LinkedIn profile and extract candidate information.

EXISTING DATA (already parsed):
${existingFields.length > 0 ? existingFields.join("\n") : "None"}

RAW DATA (from LinkedIn profile):
${truncatedRawData}${hasMoreData ? "\n\n[Note: Data truncated, but analyze what's available]" : ""}

TASK:
1. Extract any missing fields that are not in the existing data
2. Fill in gaps where existing data is incomplete or empty
3. Parse dates, companies, education, and other structured information
4. Extract arrays (companies, universities, fields of study) as JSON arrays
5. Be precise and only extract information that is clearly present in the raw data

Return JSON object with ONLY the fields you can extract/fill. Use null for fields you cannot determine.
Structure:
{
  "fullName": "string or null",
  "jobTitle": "string or null",
  "currentCompany": "string or null",
  "location": "string or null",
  "totalYearsExperience": "string or null (e.g., '5' or '5 years')",
  "currentCompanyStartDate": "string or null (e.g., 'Jan 2020' or '2020-01')",
  "currentCompanyEndDate": "string or null",
  "currentCompanyTenureYears": "string or null",
  "currentCompanyTenureMonths": "string or null",
  "previousTargetCompany": "string or null",
  "previousTitles": "string or null (semicolon-separated)",
  "companies": ["array", "of", "companies"] or null,
  "universities": ["array", "of", "universities"] or null,
  "fieldsOfStudy": ["array", "of", "fields"] or null,
  "degrees": "string or null",
  "undergradGraduationYear": "string or null",
  "certifications": "string or null (semicolon-separated)",
  "languages": "string or null",
  "projects": "string or null",
  "publications": "string or null",
  "volunteerOrganizations": "string or null",
  "courses": "string or null",
  "honorsAwards": "string or null",
  "organizations": "string or null",
  "patents": "string or null",
  "testScores": "string or null",
  "emails": "string or null",
  "phones": "string or null",
  "socialLinks": "string or null",
  "skillsCount": number or null,
  "experienceCount": number or null,
  "educationCount": number or null
}

IMPORTANT:
- Only include fields you can confidently extract from the raw data
- Use null for fields you cannot determine
- For arrays, use JSON array format: ["item1", "item2"]
- For semicolon-separated strings, use: "item1; item2; item3"
- Extract dates in formats like "Jan 2020", "2020-01", "2020-01-01"
- Be conservative - only extract what's clearly present`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert data extraction assistant specializing in parsing LinkedIn profile data from HTML/text. Extract structured information accurately and conservatively."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent extraction
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    const parsed = JSON.parse(content) as EnrichedCandidateData

    // Validate and clean the response
    const enriched: EnrichedCandidateData = {}

    // Only include non-null fields
    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        enriched[key as keyof EnrichedCandidateData] = value
      }
    })

    return Object.keys(enriched).length > 0 ? enriched : null
  } catch (error: any) {
    console.error("Error enriching candidate data with AI:", error)
    return null
  }
}

/**
 * Merge enriched data with existing data, prioritizing enriched data for missing fields
 */
export function mergeEnrichedData(
  existingData: Record<string, any>,
  enrichedData: EnrichedCandidateData
): Record<string, any> {
  const merged = { ...existingData }

  // Merge arrays intelligently
  if (enrichedData.companies && Array.isArray(enrichedData.companies)) {
    const existingCompanies = existingData.companies
      ? (Array.isArray(existingData.companies) ? existingData.companies : JSON.parse(existingData.companies || "[]"))
      : []
    const allCompanies = [...new Set([...existingCompanies, ...enrichedData.companies])]
    merged.companies = allCompanies.length > 0 ? allCompanies : undefined
  }

  if (enrichedData.universities && Array.isArray(enrichedData.universities)) {
    const existingUniversities = existingData.universities
      ? (Array.isArray(existingData.universities) ? existingData.universities : JSON.parse(existingData.universities || "[]"))
      : []
    const allUniversities = [...new Set([...existingUniversities, ...enrichedData.universities])]
    merged.universities = allUniversities.length > 0 ? allUniversities : undefined
  }

  if (enrichedData.fieldsOfStudy && Array.isArray(enrichedData.fieldsOfStudy)) {
    const existingFields = existingData.fieldsOfStudy
      ? (Array.isArray(existingData.fieldsOfStudy) ? existingData.fieldsOfStudy : JSON.parse(existingData.fieldsOfStudy || "[]"))
      : []
    const allFields = [...new Set([...existingFields, ...enrichedData.fieldsOfStudy])]
    merged.fieldsOfStudy = allFields.length > 0 ? allFields : undefined
  }

  // Merge other fields - only fill if existing is empty/null
  Object.entries(enrichedData).forEach(([key, value]) => {
    if (key === "companies" || key === "universities" || key === "fieldsOfStudy") {
      return // Already handled above
    }

    const existingValue = merged[key]
    if (!existingValue || existingValue === "" || existingValue === null) {
      merged[key] = value
    }
  })

  return merged
}
