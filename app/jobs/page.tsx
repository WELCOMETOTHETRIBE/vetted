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
    include: {
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
    take: 50,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="w-64">
            <JobFilters />
          </aside>
          <main className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Jobs</h1>
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">No jobs found. Try adjusting your filters.</p>
                </div>
              ) : (
                jobs.map((job: any) => <JobCard key={job.id} job={job} />)
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

