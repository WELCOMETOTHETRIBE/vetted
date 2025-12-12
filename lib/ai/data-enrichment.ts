import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface Correction {
  field: string
  originalValue: string
  correctedValue: string
  reason: string
}

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
  
  // Validation
  corrections?: Correction[]
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

    const prompt = `You are an expert data extraction and validation assistant. Analyze the raw HTML/text data from a LinkedIn profile to extract, validate, and correct candidate information.

EXISTING DATA (already parsed - may contain errors):
${existingFields.length > 0 ? existingFields.join("\n") : "None"}

RAW DATA (from LinkedIn profile):
${truncatedRawData}${hasMoreData ? "\n\n[Note: Data truncated, but analyze what's available]" : ""}

TASK:
1. VALIDATE existing data - check if fields are correctly placed:
   - Job titles should NOT be in company fields
   - Company names should NOT be in job title fields (e.g., "AutogenAI" should not be a job title)
   - Locations should NOT be in company fields (e.g., "England" should not be a company)
   - Names should NOT be in location fields
   - Dates should be in date fields, not text fields
   - Companies should be actual company names, not job titles or locations
   - Locations should be actual locations (city, state, country), not names or company names

2. CORRECT mismatched fields:
   - If a COMPANY NAME is in the job title field (e.g., "AutogenAI" in title), move it to currentCompany and extract the correct title
   - If a LOCATION is in the company field (e.g., "England" in company), move it to location and extract the correct company
   - If a job title is in the company field, move it to jobTitle and extract the correct company
   - If names are in location field, remove them and extract the correct location
   - If dates are in wrong fields, move them to correct date fields
   - Fix any other obvious data placement errors

3. EXTRACT missing fields that are not in the existing data

4. FILL gaps where existing data is incomplete or empty

5. Parse dates, companies, education, and other structured information accurately

6. Extract arrays (companies, universities, fields of study) as JSON arrays

7. Be precise and only extract/correct information that is clearly present in the raw data

Return JSON object with:
- Fields you can extract/fill (use null if cannot determine)
- Fields you need to CORRECT (override existing incorrect values)
- Include a "corrections" array listing what was corrected and why

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
  "educationCount": number or null,
  "corrections": [
    {
      "field": "fieldName",
      "originalValue": "what was wrong",
      "correctedValue": "what it should be",
      "reason": "why it was corrected"
    }
  ] or null
}

IMPORTANT:
- VALIDATE and CORRECT existing data if it's clearly wrong
- Only include fields you can confidently extract/correct from the raw data
- Use null for fields you cannot determine
- For arrays, use JSON array format: ["item1", "item2"]
- For semicolon-separated strings, use: "item1; item2; item3"
- Extract dates in formats like "Jan 2020", "2020-01", "2020-01-01"
- Be conservative - only extract/correct what's clearly present
- Common errors to fix:
  * Job titles in company fields (e.g., "Senior Engineer" should not be a company)
  * Names in location fields (e.g., "John Smith" should not be a location)
  * Duplicate concatenated data (e.g., "DirectorDirector" should be "Director")
  * Dates in wrong format or wrong field`

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
    const corrections: Correction[] = []

    // Process corrections first
    if (parsed.corrections && Array.isArray(parsed.corrections)) {
      parsed.corrections.forEach((correction: any) => {
        if (correction.field && correction.originalValue && correction.correctedValue) {
          corrections.push({
            field: correction.field,
            originalValue: String(correction.originalValue),
            correctedValue: String(correction.correctedValue),
            reason: String(correction.reason || "Data validation correction")
          })
        }
      })
    }

    // Only include non-null fields (except corrections which we handle separately)
    Object.entries(parsed).forEach(([key, value]) => {
      if (key === "corrections") {
        return // Handle corrections separately
      }
      if (value !== null && value !== undefined && value !== "") {
        enriched[key as keyof EnrichedCandidateData] = value
      }
    })

    // Add corrections if any
    if (corrections.length > 0) {
      enriched.corrections = corrections
    }

    return Object.keys(enriched).length > 0 ? enriched : null
  } catch (error: any) {
    console.error("Error enriching candidate data with AI:", error)
    return null
  }
}

/**
 * Merge enriched data with existing data, applying corrections and prioritizing enriched data
 */
export function mergeEnrichedData(
  existingData: Record<string, any>,
  enrichedData: EnrichedCandidateData
): Record<string, any> {
  const merged = { ...existingData }

  // Apply corrections first (these override existing data)
  if (enrichedData.corrections && enrichedData.corrections.length > 0) {
    console.log(`Applying ${enrichedData.corrections.length} corrections:`)
    enrichedData.corrections.forEach((correction) => {
      console.log(`  - ${correction.field}: "${correction.originalValue}" → "${correction.correctedValue}" (${correction.reason})`)
      
      // Map correction field names to our data structure
      const fieldMap: Record<string, string> = {
        "currentCompany": "Current Company",
        "jobTitle": "Job title",
        "location": "Location",
        "fullName": "Full Name",
      }
      
      const mappedField = fieldMap[correction.field] || correction.field
      
      // Apply correction - override existing value
      if (enrichedData[correction.field as keyof EnrichedCandidateData]) {
        merged[mappedField] = enrichedData[correction.field as keyof EnrichedCandidateData]
      } else {
        merged[mappedField] = correction.correctedValue
      }
    })
  }

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

  // Merge other fields - prioritize corrections, then fill if existing is empty/null
  Object.entries(enrichedData).forEach(([key, value]) => {
    if (key === "companies" || key === "universities" || key === "fieldsOfStudy" || key === "corrections") {
      return // Already handled above
    }

    const existingValue = merged[key]
    
    // If this field was corrected, use the corrected value
    const wasCorrected = enrichedData.corrections?.some(c => c.field === key)
    if (wasCorrected) {
      merged[key] = value
    } else if (!existingValue || existingValue === "" || existingValue === null) {
      // Only fill if existing is empty/null (don't override existing good data)
      merged[key] = value
    }
  })

  return merged
}
