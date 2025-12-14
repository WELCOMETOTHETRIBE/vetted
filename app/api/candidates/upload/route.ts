import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCandidateSummary } from "@/lib/ai/candidate-ai"
import { enrichCandidateDataWithAI, mergeEnrichedData } from "@/lib/ai/data-enrichment"

/**
 * This endpoint accepts processed profile JSON from the extension
 * The extension should send data in the format from profileProcessor.js
 */
// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
}

// Export route config to ensure proper handling
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Log the request for debugging
    console.log("POST /api/candidates/upload - Request received")
    
    const session = await auth()
    if (!session?.user) {
      console.log("POST /api/candidates/upload - Unauthorized: No session")
      return NextResponse.json(
        { error: "Unauthorized: Please log in to Vetted as an admin user" },
        { status: 401, headers: corsHeaders }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await req.json()
    console.log("POST /api/candidates/upload - Body received:", Array.isArray(body) ? `${body.length} candidates` : "1 candidate")
    
    // Handle both single candidate and array of candidates
    const candidates = Array.isArray(body) ? body : [body]
    const created = []
    const errors = []

    for (const candidateData of candidates) {
      try {
        // Log incoming data structure for debugging
        const dataKeys = Object.keys(candidateData)
        const linkedinUrl = candidateData["Linkedin URL"] || candidateData.linkedinUrl
        const fullName = candidateData["Full Name"] || candidateData.fullName
        
        console.log(`\n========== [CANDIDATE UPLOAD] Processing ${linkedinUrl || "unknown"} ==========`)
        console.log(`[INPUT] Incoming candidate data structure:`)
        console.log(`  - All keys:`, dataKeys)
        console.log(`  - Full Name: ${fullName || "NOT FOUND"}`)
        console.log(`  - LinkedIn URL: ${linkedinUrl || "NOT FOUND"}`)
        console.log(`  - Current Company: ${candidateData["Current Company"] || "NOT FOUND"}`)
        console.log(`  - Job Title: ${candidateData["Job title"] || "NOT FOUND"}`)
        console.log(`  - Location: ${candidateData["Location"] || "NOT FOUND"}`)
        console.log(`  - Total Years Experience: ${candidateData["Total Years full time experience"] || "NOT FOUND"}`)
        console.log(`  - Companies: ${candidateData["Companies"] ? JSON.stringify(candidateData["Companies"]) : "NOT FOUND"}`)
        console.log(`  - Universities: ${candidateData["Universities"] ? JSON.stringify(candidateData["Universities"]) : "NOT FOUND"}`)
        console.log(`  - Fields of Study: ${candidateData["Fields of Study"] ? JSON.stringify(candidateData["Fields of Study"]) : "NOT FOUND"}`)
        console.log(`  - Certifications: ${candidateData["Certifications"] || "NOT FOUND"}`)
        console.log(`  - Languages: ${candidateData["Languages"] || "NOT FOUND"}`)
        console.log(`  - Projects: ${candidateData["Projects"] || "NOT FOUND"}`)
        console.log(`  - Publications: ${candidateData["Publications"] || "NOT FOUND"}`)
        console.log(`  - Has Raw Data: ${!!candidateData["Raw Data"]}`)
        if (candidateData["Raw Data"]) {
          try {
            const rawDataParsed = typeof candidateData["Raw Data"] === "string" 
              ? JSON.parse(candidateData["Raw Data"]) 
              : candidateData["Raw Data"]
            console.log(`  - Raw Data structure:`, {
              hasPersonalInfo: !!rawDataParsed.personal_info,
              personalInfoKeys: rawDataParsed.personal_info ? Object.keys(rawDataParsed.personal_info) : [],
              hasExperience: !!rawDataParsed.experience,
              experienceCount: rawDataParsed.experience?.length || 0,
              hasEducation: !!rawDataParsed.education,
              educationCount: rawDataParsed.education?.length || 0,
              hasSkills: !!rawDataParsed.skills,
              skillsCount: rawDataParsed.skills?.length || 0,
              hasComprehensiveData: !!rawDataParsed.comprehensive_data,
              comprehensiveDataLength: rawDataParsed.comprehensive_data?.length || 0,
            })
          } catch (e) {
            console.log(`  - Raw Data parse error:`, e)
          }
        }

        if (!linkedinUrl) {
          console.error("Missing LinkedIn URL in candidate data. Available keys:", dataKeys)
          errors.push({ 
            candidate: { fullName: fullName || "Unknown", keys: dataKeys }, 
            error: "Missing LinkedIn URL" 
          })
          continue
        }

        if (!fullName || fullName.trim().length < 2) {
          console.warn("Candidate has invalid or missing full name:", { linkedinUrl, fullName })
          // Don't fail, but log warning
        }

        // Extract raw HTML/text for AI enrichment
        let rawHtml: string | undefined
        let rawText: string | undefined
        
        if (candidateData["Raw Data"]) {
          try {
            const rawData = typeof candidateData["Raw Data"] === "string" 
              ? JSON.parse(candidateData["Raw Data"]) 
              : candidateData["Raw Data"]
            
            // Try to extract raw_html and raw_text from comprehensive_data or structured format
            if (rawData.raw_html) {
              rawHtml = rawData.raw_html
            }
            if (rawData.raw_text) {
              rawText = rawData.raw_text
            }
            // Also check comprehensive_data array
            if (rawData.comprehensive_data && Array.isArray(rawData.comprehensive_data)) {
              const rawDataItem = rawData.comprehensive_data.find((item: any) => 
                item.category === "raw_data" && item.type === "raw_html"
              )
              if (rawDataItem?.data?.html) {
                rawHtml = rawDataItem.data.html
              }
              if (rawDataItem?.data?.text) {
                rawText = rawDataItem.data.text
              }
            }
          } catch (e) {
            console.warn("Could not parse Raw Data for AI enrichment:", e)
          }
        }

        // Check for missing or incomplete fields that could benefit from AI enrichment
        // Use AI enrichment if:
        // 1. We have raw data (HTML or text)
        // 2. AND we're missing critical fields OR have empty arrays that should have data
        const hasRawData = !!(rawHtml || rawText)
        const missingCriticalFields = !candidateData["Current Company"] || 
          !candidateData["Job title"] || 
          !candidateData["Location"] ||
          !candidateData["Total Years full time experience"]
        
        // Check if arrays are empty but should have data (based on raw data structure)
        let hasEmptyArrays = false
        if (candidateData["Raw Data"]) {
          try {
            const rawData = typeof candidateData["Raw Data"] === "string" 
              ? JSON.parse(candidateData["Raw Data"]) 
              : candidateData["Raw Data"]
            
            // If raw data has experience/education/skills but arrays are empty, we need AI enrichment
            const hasExperienceInRaw = rawData.experience && rawData.experience.length > 0
            const hasEducationInRaw = rawData.education && rawData.education.length > 0
            const hasSkillsInRaw = rawData.skills && rawData.skills.length > 0
            
            const companiesEmpty = !candidateData["Companies"] || 
              (Array.isArray(candidateData["Companies"]) && candidateData["Companies"].length === 0) ||
              (typeof candidateData["Companies"] === "string" && (!candidateData["Companies"] || candidateData["Companies"] === "[]"))
            
            const universitiesEmpty = !candidateData["Universities"] || 
              (Array.isArray(candidateData["Universities"]) && candidateData["Universities"].length === 0) ||
              (typeof candidateData["Universities"] === "string" && (!candidateData["Universities"] || candidateData["Universities"] === "[]"))
            
            if ((hasExperienceInRaw && companiesEmpty) || 
                (hasEducationInRaw && universitiesEmpty) ||
                (hasSkillsInRaw && !candidateData["Skills Count"])) {
              hasEmptyArrays = true
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        // Use AI enrichment if we have raw data and (missing fields OR empty arrays)
        let enrichedData = candidateData
        let aiEnrichmentAttempted = false
        let aiEnrichmentSuccess = false
        let aiEnrichmentRetries = 0
        
        if (hasRawData && (missingCriticalFields || hasEmptyArrays)) {
          console.log(`[AI ENRICHMENT] Attempting comprehensive AI enrichment for ${fullName || linkedinUrl}`)
          console.log(`  - Has raw data: ${hasRawData}`)
          console.log(`  - Missing critical fields: ${missingCriticalFields}`)
          console.log(`  - Has empty arrays: ${hasEmptyArrays}`)
          aiEnrichmentAttempted = true
          
          // Retry logic: if first attempt fails and we have large HTML, try with trimmed text
          const maxRetries = 2
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              let textToUse = rawText
              
              // On retry, use trimmed text if HTML is very large
              if (attempt > 0 && rawHtml && rawHtml.length > 50000) {
                console.log(`[AI ENRICHMENT] Retry ${attempt}: Using trimmed text (original: ${rawText?.length || 0} chars)`)
                textToUse = rawText?.substring(0, 5000) || ""
              }
              
              const aiEnriched = await enrichCandidateDataWithAI(candidateData, rawHtml, textToUse)
              if (aiEnriched && Object.keys(aiEnriched).length > 0) {
                console.log(`[AI ENRICHMENT] Success for ${fullName || linkedinUrl}${attempt > 0 ? ` (retry ${attempt})` : ""}`)
                console.log(`  - Enriched fields:`, Object.keys(aiEnriched))
                if (aiEnriched.corrections && aiEnriched.corrections.length > 0) {
                  console.log(`  - Corrections applied: ${aiEnriched.corrections.length}`)
                  aiEnriched.corrections.forEach((correction: any) => {
                    console.log(`    * ${correction.field}: "${correction.originalValue}" -> "${correction.correctedValue}" (${correction.reason})`)
                  })
                }
                enrichedData = mergeEnrichedData(candidateData, aiEnriched)
                aiEnrichmentSuccess = true
                aiEnrichmentRetries = attempt
                break
              } else {
                if (attempt < maxRetries - 1) {
                  console.log(`[AI ENRICHMENT] Attempt ${attempt + 1} returned no data, retrying...`)
                  aiEnrichmentRetries = attempt + 1
                } else {
                  console.log(`[AI ENRICHMENT] All attempts failed - returned no data for ${fullName || linkedinUrl}`)
                }
              }
            } catch (error: any) {
              if (attempt < maxRetries - 1) {
                console.warn(`[AI ENRICHMENT] Attempt ${attempt + 1} failed: ${error.message}, retrying...`)
                aiEnrichmentRetries = attempt + 1
              } else {
                console.error(`[AI ENRICHMENT] All attempts failed for ${fullName || linkedinUrl}:`, error)
                // Continue with original data if enrichment fails
              }
            }
          }
        } else if (hasRawData) {
          console.log(`[AI ENRICHMENT] Skipped for ${fullName || linkedinUrl} - data appears complete`)
        } else {
          console.log(`[AI ENRICHMENT] Skipped for ${fullName || linkedinUrl} - no raw data available`)
        }
        
        // Log enrichment summary
        if (aiEnrichmentAttempted) {
          console.log(`[AI ENRICHMENT SUMMARY] ${fullName || linkedinUrl}:`)
          console.log(`  - Attempted: Yes`)
          console.log(`  - Success: ${aiEnrichmentSuccess ? "Yes" : "No"}`)
          console.log(`  - Retries: ${aiEnrichmentRetries}`)
        }

        // Check if candidate already exists
        const existing = await prisma.candidate.findUnique({
          where: { linkedinUrl },
        })
        
        if (existing) {
          console.log(`[SKIP] Candidate already exists: ${linkedinUrl}`)
        }

        // Helper function to safely convert values to strings, handling arrays and objects
        const safeStringify = (value: any, maxLength?: number): string | null => {
          if (value === null || value === undefined || value === "") return null
          if (typeof value === "string") {
            return maxLength && value.length > maxLength ? value.substring(0, maxLength) : value
          }
          if (Array.isArray(value)) {
            const str = JSON.stringify(value)
            return maxLength && str.length > maxLength ? str.substring(0, maxLength) : str
          }
          if (typeof value === "object") {
            const str = JSON.stringify(value)
            return maxLength && str.length > maxLength ? str.substring(0, maxLength) : str
          }
          return String(value)
        }

        // Helper function to safely parse arrays from various formats
        const safeParseArray = (value: any): string | null => {
          if (!value) return null
          if (Array.isArray(value)) {
            return JSON.stringify(value)
          }
          if (typeof value === "string") {
            // Try to parse if it's a JSON string
            try {
              const parsed = JSON.parse(value)
              return Array.isArray(parsed) ? JSON.stringify(parsed) : value
            } catch {
              // If it's not JSON, return as-is (might be semicolon-separated)
              return value
            }
          }
          return JSON.stringify([value])
        }

        // Helper function to safely convert to number
        const safeParseInt = (value: any): number | null => {
          if (value === null || value === undefined || value === "") return null
          const parsed = parseInt(String(value), 10)
          return isNaN(parsed) ? null : parsed
        }

        // Extract all company fields (Company 1, Company 2, etc.) and merge with Companies array
        const extractAllCompanies = (data: any): string[] => {
          const companies: string[] = []
          
          // First, try to get Companies array
          if (data["Companies"]) {
            if (Array.isArray(data["Companies"])) {
              companies.push(...data["Companies"].filter((c: any) => c && String(c).trim()))
            } else if (typeof data["Companies"] === "string") {
              try {
                const parsed = JSON.parse(data["Companies"])
                if (Array.isArray(parsed)) {
                  companies.push(...parsed.filter((c: any) => c && String(c).trim()))
                }
              } catch {
                // Not JSON, might be semicolon-separated
                companies.push(...data["Companies"].split(";").map((c: string) => c.trim()).filter(Boolean))
              }
            }
          }
          
          // Then add individual company fields (Company 1, Company 2, etc.)
          for (let i = 1; i <= 10; i++) {
            const companyKey = `Company ${i}`
            const company = data[companyKey]
            if (company && String(company).trim()) {
              const companyStr = String(company).trim()
              if (!companies.includes(companyStr)) {
                companies.push(companyStr)
              }
            }
          }
          
          return companies.slice(0, 50) // Limit to 50 companies to prevent excessive data
        }

        // Extract all universities
        const extractAllUniversities = (data: any): string[] => {
          const universities: string[] = []
          
          if (data["Universities"]) {
            if (Array.isArray(data["Universities"])) {
              universities.push(...data["Universities"].filter((u: any) => u && String(u).trim()))
            } else if (typeof data["Universities"] === "string") {
              try {
                const parsed = JSON.parse(data["Universities"])
                if (Array.isArray(parsed)) {
                  universities.push(...parsed.filter((u: any) => u && String(u).trim()))
                }
              } catch {
                universities.push(...data["Universities"].split(";").map((u: string) => u.trim()).filter(Boolean))
              }
            }
          }
          
          // Add individual university fields
          for (let i = 1; i <= 10; i++) {
            const uniKey = `University ${i}`
            const uni = data[uniKey]
            if (uni && String(uni).trim()) {
              const uniStr = String(uni).trim()
              if (!universities.includes(uniStr)) {
                universities.push(uniStr)
              }
            }
          }
          
          return universities.slice(0, 20) // Limit to 20 universities
        }

        // Extract all fields of study
        const extractAllFieldsOfStudy = (data: any): string[] => {
          const fields: string[] = []
          
          if (data["Fields of Study"]) {
            if (Array.isArray(data["Fields of Study"])) {
              fields.push(...data["Fields of Study"].filter((f: any) => f && String(f).trim()))
            } else if (typeof data["Fields of Study"] === "string") {
              try {
                const parsed = JSON.parse(data["Fields of Study"])
                if (Array.isArray(parsed)) {
                  fields.push(...parsed.filter((f: any) => f && String(f).trim()))
                }
              } catch {
                fields.push(...data["Fields of Study"].split(";").map((f: string) => f.trim()).filter(Boolean))
              }
            }
          }
          
          // Add individual field of study fields
          for (let i = 1; i <= 10; i++) {
            const fieldKey = `Field of Study ${i}`
            const field = data[fieldKey]
            if (field && String(field).trim()) {
              const fieldStr = String(field).trim()
              if (!fields.includes(fieldStr)) {
                fields.push(fieldStr)
              }
            }
          }
          
          return fields.slice(0, 20) // Limit to 20 fields
        }

        // Prepare rawData - preserve full original data, but compress if needed
        let rawDataValue: string | null = null
        if (candidateData["Raw Data"]) {
          // If Raw Data is already a string, use it
          if (typeof candidateData["Raw Data"] === "string") {
            rawDataValue = candidateData["Raw Data"]
          } else {
            // If it's an object, stringify it
            rawDataValue = JSON.stringify(candidateData["Raw Data"])
          }
        } else {
          // If no Raw Data field, store the entire candidateData as rawData
          rawDataValue = JSON.stringify(candidateData)
        }
        
        // PostgreSQL TEXT can handle up to ~1GB, but we'll limit to 10MB for practical reasons
        // This is much larger than the previous 1MB limit to preserve more data
        const MAX_RAWDATA_SIZE = 10 * 1024 * 1024 // 10MB
        if (rawDataValue && rawDataValue.length > MAX_RAWDATA_SIZE) {
          console.warn(`Raw data for ${linkedinUrl} is ${rawDataValue.length} bytes, truncating to ${MAX_RAWDATA_SIZE} bytes`)
          rawDataValue = rawDataValue.substring(0, MAX_RAWDATA_SIZE) + "\n... [TRUNCATED - Original size: " + rawDataValue.length + " bytes]"
        }

        // Use enriched data for extraction
        const allCompanies = extractAllCompanies(enrichedData)
        const allUniversities = extractAllUniversities(enrichedData)
        const allFieldsOfStudy = extractAllFieldsOfStudy(enrichedData)

        const candidatePayload = {
          linkedinUrl,
          fullName: enrichedData.fullName || candidateData["Full Name"] || candidateData.fullName || "",
          currentCompany: safeStringify(enrichedData.currentCompany || candidateData["Current Company"] || candidateData.currentCompany) || null,
          currentCompanyStartDate: safeStringify(enrichedData.currentCompanyStartDate || candidateData["Current Company Start Date"]) || null,
          currentCompanyEndDate: safeStringify(enrichedData.currentCompanyEndDate || candidateData["Current Company End Date"]) || null,
          currentCompanyTenureYears: safeStringify(enrichedData.currentCompanyTenureYears || candidateData["Current Company Tenure Years"]) || null,
          currentCompanyTenureMonths: safeStringify(enrichedData.currentCompanyTenureMonths || candidateData["Current Company Tenure Months"]) || null,
          jobTitle: safeStringify(enrichedData.jobTitle || candidateData["Job title"] || candidateData.jobTitle) || null,
          location: safeStringify(enrichedData.location || candidateData["Location"] || candidateData.location) || null,
          previousTargetCompany: safeStringify(candidateData["Previous target company"]) || null,
          previousTargetCompanyStartDate: safeStringify(candidateData["Previous target company Start Date"]) || null,
          previousTargetCompanyEndDate: safeStringify(candidateData["Previous target company End Date"]) || null,
          previousTargetCompanyTenureYears: safeStringify(candidateData["Previous target company Tenure Years"]) || null,
          previousTargetCompanyTenureMonths: safeStringify(candidateData["Previous target company Tenure Months"]) || null,
          tenurePreviousTarget: safeStringify(candidateData["Tenure at previous target (Year start to year end)"]) || null,
          previousTitles: safeStringify(enrichedData.previousTitles || candidateData["Previous title(s)"] || candidateData.previousTitles) || null,
          totalYearsExperience: safeStringify(enrichedData.totalYearsExperience || candidateData["Total Years full time experience"]) || null,
          universities: allUniversities.length > 0 ? JSON.stringify(allUniversities) : null,
          fieldsOfStudy: allFieldsOfStudy.length > 0 ? JSON.stringify(allFieldsOfStudy) : null,
          degrees: safeStringify(enrichedData.degrees || candidateData["Degrees"]) || null,
          undergradGraduationYear: safeStringify(enrichedData.undergradGraduationYear || candidateData["Year of Undergrad Graduation"]) || null,
          certifications: safeStringify(enrichedData.certifications || candidateData["Certifications"]) || null,
          languages: safeStringify(enrichedData.languages || candidateData["Languages"]) || null,
          projects: safeStringify(enrichedData.projects || candidateData["Projects"]) || null,
          publications: safeStringify(enrichedData.publications || candidateData["Publications"]) || null,
          volunteerOrganizations: safeStringify(enrichedData.volunteerOrganizations || candidateData["Volunteer Organizations"]) || null,
          courses: safeStringify(enrichedData.courses || candidateData["Courses"]) || null,
          honorsAwards: safeStringify(enrichedData.honorsAwards || candidateData["Honors & Awards"]) || null,
          organizations: safeStringify(enrichedData.organizations || candidateData["Organizations"]) || null,
          patents: safeStringify(enrichedData.patents || candidateData["Patents"]) || null,
          testScores: safeStringify(enrichedData.testScores || candidateData["Test Scores"]) || null,
          emails: safeStringify(enrichedData.emails || candidateData["Emails"]) || null,
          phones: safeStringify(enrichedData.phones || candidateData["Phones"]) || null,
          socialLinks: safeStringify(enrichedData.socialLinks || candidateData["Social Links"]) || null,
          skillsCount: enrichedData.skillsCount ?? safeParseInt(candidateData["Skills Count"]),
          experienceCount: enrichedData.experienceCount ?? safeParseInt(candidateData["Experience Count"]),
          educationCount: enrichedData.educationCount ?? safeParseInt(candidateData["Education Count"]),
          companies: allCompanies.length > 0 ? JSON.stringify(allCompanies) : null,
          rawData: rawDataValue,
          addedById: session.user.id,
          status: "ACTIVE",
        }

        // Quality assessment: Check if this candidate needs review
        const needsReview = !candidatePayload.fullName ||
          !candidatePayload.jobTitle ||
          !candidatePayload.currentCompany ||
          !candidatePayload.location ||
          (!candidatePayload.companies && !candidatePayload.currentCompany) ||
          (!candidatePayload.universities && !candidatePayload.degrees)

        if (needsReview) {
          candidatePayload.status = "NEEDS_REVIEW"
          console.log(`[QUALITY] ⚠️  Candidate flagged for review - missing critical fields`)
        } else {
          candidatePayload.status = "ACTIVE"
          console.log(`[QUALITY] ✓ Candidate looks complete`)
        }

        // Log payload summary before saving - COMPREHENSIVE
        console.log(`[PAYLOAD] Candidate payload before database save (${candidatePayload.status}):`)
        console.log(`  - Full Name: ${candidatePayload.fullName || "NULL"}`)
        console.log(`  - Job Title: ${candidatePayload.jobTitle || "NULL"}`)
        console.log(`  - Current Company: ${candidatePayload.currentCompany || "NULL"}`)
        console.log(`  - Location: ${candidatePayload.location || "NULL"}`)
        console.log(`  - Total Years Experience: ${candidatePayload.totalYearsExperience || "NULL"}`)
        console.log(`  - Companies: ${candidatePayload.companies ? JSON.parse(candidatePayload.companies).length + " items" : "NULL"}`)
        if (candidatePayload.companies) {
          console.log(`  - Companies list:`, JSON.parse(candidatePayload.companies))
        }
        console.log(`  - Universities: ${candidatePayload.universities ? JSON.parse(candidatePayload.universities).length + " items" : "NULL"}`)
        if (candidatePayload.universities) {
          console.log(`  - Universities list:`, JSON.parse(candidatePayload.universities))
        }
        console.log(`  - Fields of Study: ${candidatePayload.fieldsOfStudy ? JSON.parse(candidatePayload.fieldsOfStudy).length + " items" : "NULL"}`)
        console.log(`  - Certifications: ${candidatePayload.certifications || "NULL"}`)
        console.log(`  - Languages: ${candidatePayload.languages || "NULL"}`)
        console.log(`  - Projects: ${candidatePayload.projects || "NULL"}`)
        console.log(`  - Publications: ${candidatePayload.publications || "NULL"}`)
        console.log(`  - Skills Count: ${candidatePayload.skillsCount || "NULL"}`)
        console.log(`  - Experience Count: ${candidatePayload.experienceCount || "NULL"}`)
        console.log(`  - Education Count: ${candidatePayload.educationCount || "NULL"}`)
        console.log(`  - AI Enrichment Applied: ${aiEnrichmentApplied}`)
        console.log(`  - AI Corrections: ${correctionsCount}`)
        console.log(`  - Raw Data size: ${candidatePayload.rawData ? candidatePayload.rawData.length + " chars" : "NULL"}`)

        let savedCandidate
        if (existing) {
          // Update existing candidate
          console.log("Updating existing candidate:", linkedinUrl, "ID:", existing.id)
          savedCandidate = await prisma.candidate.update({
            where: { linkedinUrl },
            data: candidatePayload,
          })
          console.log("Updated candidate:", {
            id: savedCandidate.id,
            fullName: savedCandidate.fullName,
            currentCompany: savedCandidate.currentCompany,
            updatedAt: savedCandidate.updatedAt
          })
        } else {
          // Create new candidate
          console.log("Creating new candidate:", linkedinUrl, candidatePayload.fullName)
          savedCandidate = await prisma.candidate.create({
            data: candidatePayload,
          })
          console.log(`[DATABASE] Created candidate in database:`)
          console.log(`  - ID: ${savedCandidate.id}`)
          console.log(`  - Full Name: ${savedCandidate.fullName || "NULL"}`)
          console.log(`  - Job Title: ${savedCandidate.jobTitle || "NULL"}`)
          console.log(`  - Current Company: ${savedCandidate.currentCompany || "NULL"}`)
          console.log(`  - Location: ${savedCandidate.location || "NULL"}`)
          console.log(`  - Total Years Experience: ${savedCandidate.totalYearsExperience || "NULL"}`)
          console.log(`  - Companies: ${savedCandidate.companies || "NULL"}`)
          console.log(`  - Universities: ${savedCandidate.universities || "NULL"}`)
          console.log(`  - Fields of Study: ${savedCandidate.fieldsOfStudy || "NULL"}`)
          console.log(`  - Certifications: ${savedCandidate.certifications || "NULL"}`)
          console.log(`  - Languages: ${savedCandidate.languages || "NULL"}`)
          console.log(`  - Projects: ${savedCandidate.projects || "NULL"}`)
          console.log(`  - Publications: ${savedCandidate.publications || "NULL"}`)
          console.log(`  - Raw Data size: ${savedCandidate.rawData?.length || 0} chars`)
          console.log(`  - Skills Count: ${savedCandidate.skillsCount || "NULL"}`)
          console.log(`  - Experience Count: ${savedCandidate.experienceCount || "NULL"}`)
          console.log(`  - Education Count: ${savedCandidate.educationCount || "NULL"}`)
          console.log(`========== [CANDIDATE UPLOAD] Complete for ${linkedinUrl} ==========\n`)
        }

        // Generate AI summary asynchronously (don't block upload)
        generateCandidateSummary(savedCandidate)
          .then(async (summary) => {
            if (summary) {
              await prisma.candidate.update({
                where: { id: savedCandidate.id },
                data: {
                  aiSummary: summary.summary,
                  aiKeyStrengths: JSON.stringify(summary.keyStrengths),
                  aiBestFitRoles: JSON.stringify(summary.bestFitRoles),
                  aiHighlights: JSON.stringify(summary.highlights),
                  aiConcerns: JSON.stringify(summary.concerns),
                  aiSummaryGeneratedAt: new Date(),
                },
              })
              console.log("AI summary generated for candidate:", savedCandidate.id)
            }
          })
          .catch((error) => {
            console.error("Error generating AI summary (non-blocking):", error)
          })

        created.push(savedCandidate)
      } catch (error: any) {
        console.error("Error processing candidate:", {
          linkedinUrl: candidateData["Linkedin URL"] || candidateData.linkedinUrl,
          error: error.message,
          stack: error.stack,
          errorName: error.name
        })
        errors.push({
          candidate: candidateData,
          error: error.message || "Unknown error",
        })
      }
    }

    console.log("Upload complete:", {
      created: created.length,
      errors: errors.length,
      candidateIds: created.map(c => c.id),
      candidateNames: created.map(c => c.fullName)
    })

    return NextResponse.json(
      {
        success: true,
        created: created.length,
        errors: errors.length,
        candidates: created,
        errorDetails: errors,
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error("Upload candidates error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

