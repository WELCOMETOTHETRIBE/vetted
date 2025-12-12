import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCandidateSummary } from "@/lib/ai/candidate-ai"

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
        
        console.log("Processing candidate data:", {
          keys: dataKeys,
          linkedinUrl,
          fullName,
          hasRawData: !!candidateData["Raw Data"],
          hasCompanies: !!candidateData["Companies"],
          hasUniversities: !!candidateData["Universities"],
          hasFieldsOfStudy: !!candidateData["Fields of Study"],
          sampleFields: {
            currentCompany: candidateData["Current Company"],
            jobTitle: candidateData["Job title"],
            location: candidateData["Location"]
          }
        })

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

        // Check if candidate already exists
        const existing = await prisma.candidate.findUnique({
          where: { linkedinUrl },
        })

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

        const allCompanies = extractAllCompanies(candidateData)
        const allUniversities = extractAllUniversities(candidateData)
        const allFieldsOfStudy = extractAllFieldsOfStudy(candidateData)

        const candidatePayload = {
          linkedinUrl,
          fullName: candidateData["Full Name"] || candidateData.fullName || "",
          currentCompany: safeStringify(candidateData["Current Company"] || candidateData.currentCompany) || null,
          currentCompanyStartDate: safeStringify(candidateData["Current Company Start Date"]) || null,
          currentCompanyEndDate: safeStringify(candidateData["Current Company End Date"]) || null,
          currentCompanyTenureYears: safeStringify(candidateData["Current Company Tenure Years"]) || null,
          currentCompanyTenureMonths: safeStringify(candidateData["Current Company Tenure Months"]) || null,
          jobTitle: safeStringify(candidateData["Job title"] || candidateData.jobTitle) || null,
          location: safeStringify(candidateData["Location"] || candidateData.location) || null,
          previousTargetCompany: safeStringify(candidateData["Previous target company"]) || null,
          previousTargetCompanyStartDate: safeStringify(candidateData["Previous target company Start Date"]) || null,
          previousTargetCompanyEndDate: safeStringify(candidateData["Previous target company End Date"]) || null,
          previousTargetCompanyTenureYears: safeStringify(candidateData["Previous target company Tenure Years"]) || null,
          previousTargetCompanyTenureMonths: safeStringify(candidateData["Previous target company Tenure Months"]) || null,
          tenurePreviousTarget: safeStringify(candidateData["Tenure at previous target (Year start to year end)"]) || null,
          previousTitles: safeStringify(candidateData["Previous title(s)"] || candidateData.previousTitles) || null,
          totalYearsExperience: safeStringify(candidateData["Total Years full time experience"]) || null,
          universities: allUniversities.length > 0 ? JSON.stringify(allUniversities) : null,
          fieldsOfStudy: allFieldsOfStudy.length > 0 ? JSON.stringify(allFieldsOfStudy) : null,
          degrees: safeStringify(candidateData["Degrees"]) || null,
          undergradGraduationYear: safeStringify(candidateData["Year of Undergrad Graduation"]) || null,
          certifications: safeStringify(candidateData["Certifications"]) || null,
          languages: safeStringify(candidateData["Languages"]) || null,
          projects: safeStringify(candidateData["Projects"]) || null,
          publications: safeStringify(candidateData["Publications"]) || null,
          volunteerOrganizations: safeStringify(candidateData["Volunteer Organizations"]) || null,
          courses: safeStringify(candidateData["Courses"]) || null,
          honorsAwards: safeStringify(candidateData["Honors & Awards"]) || null,
          organizations: safeStringify(candidateData["Organizations"]) || null,
          patents: safeStringify(candidateData["Patents"]) || null,
          testScores: safeStringify(candidateData["Test Scores"]) || null,
          emails: safeStringify(candidateData["Emails"]) || null,
          phones: safeStringify(candidateData["Phones"]) || null,
          socialLinks: safeStringify(candidateData["Social Links"]) || null,
          skillsCount: safeParseInt(candidateData["Skills Count"]),
          experienceCount: safeParseInt(candidateData["Experience Count"]),
          educationCount: safeParseInt(candidateData["Education Count"]),
          companies: allCompanies.length > 0 ? JSON.stringify(allCompanies) : null,
          rawData: rawDataValue,
          addedById: session.user.id,
          status: "ACTIVE" as const,
        }

        // Log payload summary before saving
        console.log("Candidate payload summary:", {
          linkedinUrl: candidatePayload.linkedinUrl,
          fullName: candidatePayload.fullName,
          currentCompany: candidatePayload.currentCompany,
          jobTitle: candidatePayload.jobTitle,
          location: candidatePayload.location,
          companiesCount: candidatePayload.companies ? JSON.parse(candidatePayload.companies).length : 0,
          universitiesCount: candidatePayload.universities ? JSON.parse(candidatePayload.universities).length : 0,
          rawDataSize: candidatePayload.rawData ? candidatePayload.rawData.length : 0,
          hasAllFields: {
            currentCompany: !!candidatePayload.currentCompany,
            jobTitle: !!candidatePayload.jobTitle,
            location: !!candidatePayload.location,
            companies: !!candidatePayload.companies,
            universities: !!candidatePayload.universities,
            certifications: !!candidatePayload.certifications,
            projects: !!candidatePayload.projects,
            rawData: !!candidatePayload.rawData
          }
        })

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
          console.log("Created candidate:", {
            id: savedCandidate.id,
            fullName: savedCandidate.fullName,
            currentCompany: savedCandidate.currentCompany,
            createdAt: savedCandidate.createdAt,
            rawDataSize: savedCandidate.rawData ? savedCandidate.rawData.length : 0
          })
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

