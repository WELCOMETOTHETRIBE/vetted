import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import JobCard from "@/components/JobCard"

type JobForCard = {
  id: string
  title: string
  description?: string | null
  company: {
    id: string
    name: string
    slug: string
    logo?: string | null
  }
  location?: string | null
  isRemote: boolean
  isHybrid: boolean
  employmentType: string
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  createdAt: Date
  views: number
  applications?: Array<{ id: string }>
  originalUrl?: string | null
}

async function getJobs(): Promise<JobForCard[]> {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
      },
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
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    type PrismaJob = typeof jobs[0]
    return jobs.map((job: PrismaJob) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      company: {
        id: job.company.id,
        name: job.company.name,
        slug: job.company.slug,
        logo: job.company.logo,
      },
      location: job.location,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      createdAt: job.createdAt,
      views: job.views || 0,
      applications: job.applications,
      originalUrl: job.originalUrl,
    }))
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return []
  }
}

export default async function JobsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const jobs = await getJobs()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
          <p className="text-gray-600">
            Discover opportunities from top companies
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No jobs available
            </h2>
            <p className="text-gray-600">
              Check back soon for new opportunities!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job: JobForCard) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}