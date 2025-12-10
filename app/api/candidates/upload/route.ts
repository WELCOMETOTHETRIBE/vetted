import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
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
    
    // Handle both single candidate and array of candidates
    const candidates = Array.isArray(body) ? body : [body]
    const created = []
    const errors = []

    for (const candidateData of candidates) {
      try {
        const linkedinUrl = candidateData["Linkedin URL"] || candidateData.linkedinUrl

        if (!linkedinUrl) {
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
          totalYearsExperience: candidateData["Total Years full time experience"] || null,
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
          skillsCount: candidateData["Skills Count"] || null,
          experienceCount: candidateData["Experience Count"] || null,
          educationCount: candidateData["Education Count"] || null,
          companies: candidateData["Companies"] ? JSON.stringify(candidateData["Companies"]) : null,
          rawData: candidateData["Raw Data"] || JSON.stringify(candidateData),
          addedById: session.user.id,
          status: "ACTIVE" as const,
        }

        if (existing) {
          // Update existing candidate
          const updated = await prisma.candidate.update({
            where: { linkedinUrl },
            data: candidatePayload,
          })
          created.push(updated)
        } else {
          // Create new candidate
          const newCandidate = await prisma.candidate.create({
            data: candidatePayload,
          })
          created.push(newCandidate)
        }
      } catch (error: any) {
        errors.push({
          candidate: candidateData,
          error: error.message || "Unknown error",
        })
      }
    }

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
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

