import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Briefcase } from "lucide-react"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import JobCard from "@/components/JobCard"
import JobFilters from "@/components/JobFilters"

type JobForCard = {
  id: string
  title: string
  description?: string | null
  company: { id: string; name: string; slug: string; logo?: string | null }
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
      where: { isActive: true },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true } },
        applications: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, accountType: true },
  })

  const canAccess = user?.role === "ADMIN" || user?.accountType !== "EMPLOYER"
  if (!canAccess) {
    redirect("/feed")
  }

  const jobs = await getJobs()

  return (
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        accountType: session.user.accountType,
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Jobs"
          description="Mission-aligned roles from cleared employers and partner contractors."
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <JobFilters />
          </aside>

          <div className="lg:col-span-3">
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-md bg-secondary border border-border flex items-center justify-center mb-3 text-muted-foreground">
                    <Briefcase className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="text-base font-semibold text-foreground mb-1">
                    No jobs available
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Check back soon for new opportunities.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job: JobForCard) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClearDShell>
  )
}
