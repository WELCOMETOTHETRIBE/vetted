import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import JobCard from "@/components/JobCard"
import JobFilters from "@/components/JobFilters"

async function getJobs(searchParams: { [key: string]: string | undefined }) {
  const params = searchParams
  const where: any = {
    isActive: true,
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
      { company: { name: { contains: params.search, mode: "insensitive" } } },
    ]
  }

  if (params.location) {
    where.location = { contains: params.location, mode: "insensitive" }
  }

  if (params.remote === "true") {
    where.isRemote = true
  }

  if (params.employmentType) {
    where.employmentType = params.employmentType
  }

  const jobs = await prisma.job.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      isRemote: true,
      isHybrid: true,
      employmentType: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      createdAt: true,
      views: true,
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      applications: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return jobs
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const jobs = await getJobs(params)

  // Extract URLs from descriptions for each job
  const extractUrl = (desc: string | null | undefined): string | null => {
    if (!desc) return null
    const urlMatch = desc.match(/Apply at:\s*(https?:\/\/[^\s\n]+)/i) || 
                     desc.match(/(https?:\/\/jobs\.ashbyhq\.com[^\s\n]+)/i)
    return urlMatch ? urlMatch[1] : null
  }

  const jobsWithUrls = jobs.map((job: {
    id: string
    title: string
    description?: string | null
    location?: string | null
    isRemote: boolean
    isHybrid: boolean
    employmentType: string
    salaryMin?: number | null
    salaryMax?: number | null
    salaryCurrency?: string | null
    createdAt: Date
    views: number
    company: {
      id: string
      name: string
      slug: string
      logo?: string | null
    }
    applications?: Array<{ id: string }>
  }) => ({
    ...job,
    originalUrl: extractUrl(job.description),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-72 flex-shrink-0">
            <JobFilters />
          </aside>
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
                <p className="text-gray-600 mt-1">
                  {jobs.length === 0 
                    ? "No jobs found" 
                    : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} available`}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your filters or check back later for new opportunities.
                    </p>
                    <button
                      onClick={() => window.location.href = '/jobs'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                jobsWithUrls.map((job: any) => <JobCard key={job.id} job={job} />)
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

