import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import CandidatesContent from "@/components/CandidatesContent"
import { Suspense } from "react"

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

  console.log("Candidates page - Found candidates:", {
    total,
    count: candidates.length,
    candidateIds: candidates.map((c: { id: string; fullName: string }) => c.id),
    candidateNames: candidates.map((c: { id: string; fullName: string }) => c.fullName)
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
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <div className="text-sm text-gray-600">
            Total: {data.total} candidates
          </div>
        </div>
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
          <Navbar />
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

