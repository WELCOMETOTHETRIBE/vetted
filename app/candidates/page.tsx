import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import CandidatesContent from "@/components/CandidatesContent"
import { Suspense } from "react"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCandidates(searchParams: { [key: string]: string | undefined }) {
  const search = searchParams.search
  const status = searchParams.status
  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "50")
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

  // Log comprehensive candidate data for debugging
  const debugCandidates = await prisma.candidate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5, // Just the latest 5 for debugging
  })

  console.log(`\n========== [CANDIDATES PAGE] Loading candidates ==========`)
  console.log(`[QUERY] Found ${candidates.length} candidates (showing ${skip + 1}-${skip + candidates.length} of ${total})`)
  
  if (debugCandidates.length > 0) {
    console.log(`[DATABASE] Sample candidate data (latest ${debugCandidates.length}):`)
    debugCandidates.forEach((candidate: typeof debugCandidates[0], idx: number) => {
      console.log(`\n  Candidate ${idx + 1}: ${candidate.linkedinUrl}`)
      console.log(`    - ID: ${candidate.id}`)
      console.log(`    - Full Name: ${candidate.fullName || "NULL"}`)
      console.log(`    - Job Title: ${candidate.jobTitle || "NULL"}`)
      console.log(`    - Current Company: ${candidate.currentCompany || "NULL"}`)
      console.log(`    - Location: ${candidate.location || "NULL"}`)
      console.log(`    - Total Years Experience: ${candidate.totalYearsExperience || "NULL"}`)
      console.log(`    - Companies: ${candidate.companies || "NULL"}`)
      console.log(`    - Universities: ${candidate.universities || "NULL"}`)
      console.log(`    - Fields of Study: ${candidate.fieldsOfStudy || "NULL"}`)
      console.log(`    - Certifications: ${candidate.certifications ? candidate.certifications.substring(0, 100) + "..." : "NULL"}`)
      console.log(`    - Languages: ${candidate.languages || "NULL"}`)
      console.log(`    - Projects: ${candidate.projects ? candidate.projects.substring(0, 100) + "..." : "NULL"}`)
      console.log(`    - Publications: ${candidate.publications ? candidate.publications.substring(0, 100) + "..." : "NULL"}`)
      console.log(`    - Raw Data: ${candidate.rawData ? `${candidate.rawData.length} chars` : "NULL"}`)
      console.log(`    - Skills Count: ${candidate.skillsCount || "NULL"}`)
      console.log(`    - Experience Count: ${candidate.experienceCount || "NULL"}`)
      console.log(`    - Education Count: ${candidate.educationCount || "NULL"}`)
      
      // Check if rawData contains comprehensive_data
      if (candidate.rawData) {
        try {
          const rawDataParsed = JSON.parse(candidate.rawData)
          console.log(`    - Raw Data structure:`, {
            hasPersonalInfo: !!rawDataParsed.personal_info,
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
          console.log(`    - Raw Data parse error:`, e)
        }
      }
    })
  }
  console.log(`========== [CANDIDATES PAGE] Complete ==========\n`)

  console.log("Candidates page - Found candidates:", {
    total,
    count: candidates.length,
    candidateIds: candidates.map((c: { id: string; fullName: string }) => c.id),
    candidateNames: candidates.map((c: { id: string; fullName: string }) => c.fullName),
    whereClause: where,
    sampleCandidates: debugCandidates.map((c: typeof debugCandidates[0]) => ({
      id: c.id,
      name: c.fullName,
      url: c.linkedinUrl,
      status: c.status,
      createdAt: c.createdAt
    }))
  })

  return { candidates, total, page, limit }
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  try {
    const params = await searchParams
    const session = await auth()
    if (!session?.user) {
      redirect("/auth/signin")
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      redirect("/feed")
    }

    const data = await getCandidates(params)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="p-8 text-center text-gray-600">Loading...</div>}>
          <CandidatesContent
            initialCandidates={data.candidates}
            initialTotal={data.total}
            initialPage={data.page}
            initialLimit={data.limit}
          />
        </Suspense>
      </div>
    </div>
    )
  } catch (error: any) {
    console.error("Candidates page error:", error)
    // If it's a database schema error, provide helpful message
    if (error.message?.includes("Unknown column") || error.message?.includes("column") || error.code === "P2021") {
      return (
        <div className="min-h-screen bg-gray-50">
          <NavbarAdvanced />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-900 mb-2">Database Migration Required</h2>
              <p className="text-yellow-800 mb-4">
                The database schema needs to be updated to include the new AI fields. Please run the migration:
              </p>
              <div className="bg-white rounded p-4 mb-4">
                <code className="text-sm">
                  railway run npm run db:push
                </code>
              </div>
              <p className="text-sm text-yellow-700">
                Or use the migration endpoint: <code className="bg-yellow-100 px-2 py-1 rounded">POST /api/admin/migrate</code>
              </p>
            </div>
          </div>
        </div>
      )
    }
    // Re-throw other errors to show the error page
    throw error
  }
}

