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
        console.log("Processing candidate data:", {
          keys: Object.keys(candidateData),
          linkedinUrl: candidateData["Linkedin URL"] || candidateData.linkedinUrl,
          fullName: candidateData["Full Name"] || candidateData.fullName
        })
        
        const linkedinUrl = candidateData["Linkedin URL"] || candidateData.linkedinUrl

        if (!linkedinUrl) {
          console.error("Missing LinkedIn URL in candidate data:", candidateData)
          errors.push({ candidate: candidateData, error: "Missing LinkedIn URL" })
          continue
        }

        // Check if candidate already exists
        const existing = await prisma.candidate.findUnique({
          where: { linkedinUrl },
        })

        const candidatePayload = {
          linkedinUrl,
          fullName: candidateData["Full Name"] || candidateData.fullName || "",
          currentCompany: candidateData["Current Company"] || candidateData.currentCompany || null,
          currentCompanyStartDate: candidateData["Current Company Start Date"] || null,
          currentCompanyEndDate: candidateData["Current Company End Date"] || null,
          currentCompanyTenureYears: candidateData["Current Company Tenure Years"] || null,
          currentCompanyTenureMonths: candidateData["Current Company Tenure Months"] || null,
          jobTitle: candidateData["Job title"] || candidateData.jobTitle || null,
          location: candidateData["Location"] || candidateData.location || null,
          previousTargetCompany: candidateData["Previous target company"] || null,
          previousTargetCompanyStartDate: candidateData["Previous target company Start Date"] || null,
          previousTargetCompanyEndDate: candidateData["Previous target company End Date"] || null,
          previousTargetCompanyTenureYears: candidateData["Previous target company Tenure Years"] || null,
          previousTargetCompanyTenureMonths: candidateData["Previous target company Tenure Months"] || null,
          tenurePreviousTarget: candidateData["Tenure at previous target (Year start to year end)"] || null,
          previousTitles: candidateData["Previous title(s)"] || candidateData.previousTitles || null,
          totalYearsExperience: candidateData["Total Years full time experience"] ? String(candidateData["Total Years full time experience"]) : null,
          universities: candidateData["Universities"] ? JSON.stringify(candidateData["Universities"]) : null,
          fieldsOfStudy: candidateData["Fields of Study"] ? JSON.stringify(candidateData["Fields of Study"]) : null,
          degrees: candidateData["Degrees"] || null,
          undergradGraduationYear: candidateData["Year of Undergrad Graduation"] || null,
          certifications: candidateData["Certifications"] || null,
          languages: candidateData["Languages"] || null,
          projects: candidateData["Projects"] || null,
          publications: candidateData["Publications"] || null,
          volunteerOrganizations: candidateData["Volunteer Organizations"] || null,
          courses: candidateData["Courses"] || null,
          honorsAwards: candidateData["Honors & Awards"] || null,
          organizations: candidateData["Organizations"] || null,
          patents: candidateData["Patents"] || null,
          testScores: candidateData["Test Scores"] || null,
          emails: candidateData["Emails"] || null,
          phones: candidateData["Phones"] || null,
          socialLinks: candidateData["Social Links"] || null,
          skillsCount: candidateData["Skills Count"] ? parseInt(String(candidateData["Skills Count"])) || null : null,
          experienceCount: candidateData["Experience Count"] ? parseInt(String(candidateData["Experience Count"])) || null : null,
          educationCount: candidateData["Education Count"] ? parseInt(String(candidateData["Education Count"])) || null : null,
          companies: candidateData["Companies"] ? JSON.stringify(candidateData["Companies"]) : null,
          // Truncate rawData if it's too long (PostgreSQL TEXT has practical limits)
          rawData: candidateData["Raw Data"] 
            ? String(candidateData["Raw Data"]).substring(0, 1000000) // Limit to 1MB
            : JSON.stringify(candidateData).substring(0, 1000000),
          addedById: session.user.id,
          status: "ACTIVE" as const,
        }

        let savedCandidate
        if (existing) {
          // Update existing candidate
          console.log("Updating existing candidate:", linkedinUrl)
          savedCandidate = await prisma.candidate.update({
            where: { linkedinUrl },
            data: candidatePayload,
          })
          console.log("Updated candidate:", savedCandidate.id, savedCandidate.fullName)
        } else {
          // Create new candidate
          console.log("Creating new candidate:", linkedinUrl, candidatePayload.fullName)
          savedCandidate = await prisma.candidate.create({
            data: candidatePayload,
          })
          console.log("Created candidate:", savedCandidate.id, savedCandidate.fullName, savedCandidate.createdAt)
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

