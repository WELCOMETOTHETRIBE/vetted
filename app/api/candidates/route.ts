import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema matching the extension's processed profile format
const candidateSchema = z.object({
  "Linkedin URL": z.string().url(),
  "Full Name": z.string().min(1),
  "Current Company": z.string().optional(),
  "Current Company Start Date": z.string().optional(),
  "Current Company End Date": z.string().optional(),
  "Current Company Tenure Years": z.string().optional(),
  "Current Company Tenure Months": z.string().optional(),
  "Job title": z.string().optional(),
  "Location": z.string().optional(),
  "Previous target company": z.string().optional(),
  "Previous target company Start Date": z.string().optional(),
  "Previous target company End Date": z.string().optional(),
  "Previous target company Tenure Years": z.string().optional(),
  "Previous target company Tenure Months": z.string().optional(),
  "Tenure at previous target (Year start to year end)": z.string().optional(),
  "Companies": z.array(z.string()).optional(),
  "Previous title(s)": z.string().optional(),
  "Total Years full time experience": z.string().optional(),
  "Universities": z.array(z.string()).optional(),
  "Fields of Study": z.array(z.string()).optional(),
  "Degrees": z.string().optional(),
  "Year of Undergrad Graduation": z.string().optional(),
  "Certifications": z.string().optional(),
  "Languages": z.string().optional(),
  "Projects": z.string().optional(),
  "Publications": z.string().optional(),
  "Volunteer Organizations": z.string().optional(),
  "Courses": z.string().optional(),
  "Honors & Awards": z.string().optional(),
  "Organizations": z.string().optional(),
  "Patents": z.string().optional(),
  "Test Scores": z.string().optional(),
  "Emails": z.string().optional(),
  "Phones": z.string().optional(),
  "Social Links": z.string().optional(),
  "Skills Count": z.number().optional(),
  "Experience Count": z.number().optional(),
  "Education Count": z.number().optional(),
  "Raw Data": z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    
    // Handle both single candidate and array of candidates
    const candidates = Array.isArray(body) ? body : [body]
    const created = []

    for (const candidateData of candidates) {
      const validated = candidateSchema.parse(candidateData)
      const linkedinUrl = validated["Linkedin URL"]

      // Check if candidate already exists
      const existing = await prisma.candidate.findUnique({
        where: { linkedinUrl },
      })

      if (existing) {
        // Update existing candidate
        const updated = await prisma.candidate.update({
          where: { linkedinUrl },
          data: {
            fullName: validated["Full Name"],
            currentCompany: validated["Current Company"] || null,
            currentCompanyStartDate: validated["Current Company Start Date"] || null,
            currentCompanyEndDate: validated["Current Company End Date"] || null,
            currentCompanyTenureYears: validated["Current Company Tenure Years"] || null,
            currentCompanyTenureMonths: validated["Current Company Tenure Months"] || null,
            jobTitle: validated["Job title"] || null,
            location: validated["Location"] || null,
            previousTargetCompany: validated["Previous target company"] || null,
            previousTargetCompanyStartDate: validated["Previous target company Start Date"] || null,
            previousTargetCompanyEndDate: validated["Previous target company End Date"] || null,
            previousTargetCompanyTenureYears: validated["Previous target company Tenure Years"] || null,
            previousTargetCompanyTenureMonths: validated["Previous target company Tenure Months"] || null,
            tenurePreviousTarget: validated["Tenure at previous target (Year start to year end)"] || null,
            previousTitles: validated["Previous title(s)"] || null,
            totalYearsExperience: validated["Total Years full time experience"] || null,
            universities: validated["Universities"] ? JSON.stringify(validated["Universities"]) : null,
            fieldsOfStudy: validated["Fields of Study"] ? JSON.stringify(validated["Fields of Study"]) : null,
            degrees: validated["Degrees"] || null,
            undergradGraduationYear: validated["Year of Undergrad Graduation"] || null,
            certifications: validated["Certifications"] || null,
            languages: validated["Languages"] || null,
            projects: validated["Projects"] || null,
            publications: validated["Publications"] || null,
            volunteerOrganizations: validated["Volunteer Organizations"] || null,
            courses: validated["Courses"] || null,
            honorsAwards: validated["Honors & Awards"] || null,
            organizations: validated["Organizations"] || null,
            patents: validated["Patents"] || null,
            testScores: validated["Test Scores"] || null,
            emails: validated["Emails"] || null,
            phones: validated["Phones"] || null,
            socialLinks: validated["Social Links"] || null,
            skillsCount: validated["Skills Count"] || null,
            experienceCount: validated["Experience Count"] || null,
            educationCount: validated["Education Count"] || null,
            companies: validated["Companies"] ? JSON.stringify(validated["Companies"]) : null,
            rawData: validated["Raw Data"] || null,
            addedById: session.user.id,
          },
        })
        created.push(updated)
      } else {
        // Create new candidate
        const newCandidate = await prisma.candidate.create({
          data: {
            linkedinUrl,
            fullName: validated["Full Name"],
            currentCompany: validated["Current Company"] || null,
            currentCompanyStartDate: validated["Current Company Start Date"] || null,
            currentCompanyEndDate: validated["Current Company End Date"] || null,
            currentCompanyTenureYears: validated["Current Company Tenure Years"] || null,
            currentCompanyTenureMonths: validated["Current Company Tenure Months"] || null,
            jobTitle: validated["Job title"] || null,
            location: validated["Location"] || null,
            previousTargetCompany: validated["Previous target company"] || null,
            previousTargetCompanyStartDate: validated["Previous target company Start Date"] || null,
            previousTargetCompanyEndDate: validated["Previous target company End Date"] || null,
            previousTargetCompanyTenureYears: validated["Previous target company Tenure Years"] || null,
            previousTargetCompanyTenureMonths: validated["Previous target company Tenure Months"] || null,
            tenurePreviousTarget: validated["Tenure at previous target (Year start to year end)"] || null,
            previousTitles: validated["Previous title(s)"] || null,
            totalYearsExperience: validated["Total Years full time experience"] || null,
            universities: validated["Universities"] ? JSON.stringify(validated["Universities"]) : null,
            fieldsOfStudy: validated["Fields of Study"] ? JSON.stringify(validated["Fields of Study"]) : null,
            degrees: validated["Degrees"] || null,
            undergradGraduationYear: validated["Year of Undergrad Graduation"] || null,
            certifications: validated["Certifications"] || null,
            languages: validated["Languages"] || null,
            projects: validated["Projects"] || null,
            publications: validated["Publications"] || null,
            volunteerOrganizations: validated["Volunteer Organizations"] || null,
            courses: validated["Courses"] || null,
            honorsAwards: validated["Honors & Awards"] || null,
            organizations: validated["Organizations"] || null,
            patents: validated["Patents"] || null,
            testScores: validated["Test Scores"] || null,
            emails: validated["Emails"] || null,
            phones: validated["Phones"] || null,
            socialLinks: validated["Social Links"] || null,
            skillsCount: validated["Skills Count"] || null,
            experienceCount: validated["Experience Count"] || null,
            educationCount: validated["Education Count"] || null,
            companies: validated["Companies"] ? JSON.stringify(validated["Companies"]) : null,
            rawData: validated["Raw Data"] || null,
            addedById: session.user.id,
            status: "ACTIVE",
          },
        })
        created.push(newCandidate)
      }
    }

    return NextResponse.json(
      { success: true, count: created.length, candidates: created },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Create candidate error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { currentCompany: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { linkedinUrl: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.candidate.count({ where }),
    ])

    return NextResponse.json({
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get candidates error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

