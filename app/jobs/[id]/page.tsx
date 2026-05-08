import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  Users,
  Calendar,
  Sparkles,
  FileText,
  Target,
  ScrollText,
  Building2,
} from "lucide-react"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import UserJobMatchAnalysis from "@/components/UserJobMatchAnalysis"
import JobMatchAnalysis from "@/components/JobMatchAnalysis"

async function getJob(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId, isActive: true },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            about: true,
            website: true,
            location: true,
            size: true,
            industry: true,
          },
        },
        applications: { select: { id: true } },
      },
    })
    if (!job) return null
    return job
  } catch (error) {
    console.error("Error fetching job:", error)
    return null
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, accountType: true },
  })

  const canAccessJobs = user?.role === "ADMIN" || user?.accountType !== "EMPLOYER"
  if (!canAccessJobs) {
    redirect("/feed")
  }

  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  const locationText = job.isRemote
    ? "Remote"
    : job.isHybrid
    ? `Hybrid • ${job.location || "Location TBD"}`
    : job.location || "Location TBD"

  const salaryText =
    job.salaryMin && job.salaryMax
      ? `${job.salaryCurrency || "$"}${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`
      : null

  return (
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        accountType: session.user.accountType,
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-3">
          <Link href="/jobs">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to Jobs
          </Link>
        </Button>

        {/* Job Header */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0 border border-border">
                {job.company.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
                  {job.title}
                </h1>
                <Link
                  href={`/companies/${job.company.slug}`}
                  className="text-base text-primary hover:text-primary/80 font-medium inline-block transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {job.company.name}
                </Link>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">{locationText}</Badge>
                  <Badge variant="outline">{job.employmentType.replace("_", " ")}</Badge>
                  {salaryText && (
                    <Badge variant="outline" className="text-success border-success/40">
                      {salaryText}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-border flex-wrap text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" aria-hidden />
                {job.views || 0} views
              </span>
              {job.applications && job.applications.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden />
                  {job.applications.length}{" "}
                  {job.applications.length === 1 ? "applicant" : "applicants"}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden />
                Posted{" "}
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        {job.description && (
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Job Description
              </h2>
              <div
                className="text-muted-foreground leading-relaxed [&_*]:text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_a]:text-primary"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </CardContent>
          </Card>
        )}

        {/* Company Info */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 inline-flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" aria-hidden />
              About the Company
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">{job.company.name}</h3>
                {job.company.about && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {job.company.about}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {job.company.location && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Location
                    </span>
                    <p className="text-sm text-foreground mt-0.5">{job.company.location}</p>
                  </div>
                )}
                {job.company.industry && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Industry
                    </span>
                    <p className="text-sm text-foreground mt-0.5">{job.company.industry}</p>
                  </div>
                )}
                {job.company.size && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Size
                    </span>
                    <p className="text-sm text-foreground mt-0.5">{job.company.size}</p>
                  </div>
                )}
                {job.company.website && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Website
                    </span>
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:text-primary/80 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {job.company.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Quick Actions */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 inline-flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              AI-Powered Tools
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-md hover:border-primary/40 transition-colors bg-secondary/30">
                <UserJobMatchAnalysis jobId={job.id} compact={true} />
              </div>

              {user?.role === "ADMIN" && (
                <div className="p-4 border border-border rounded-md hover:border-primary/40 transition-colors bg-secondary/30">
                  <JobMatchAnalysis jobId={job.id} compact={true} />
                </div>
              )}

              <Link
                href={`/jobs/${job.id}/apply`}
                className="p-4 border border-border rounded-md hover:border-primary/40 hover:bg-secondary/40 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-primary" aria-hidden />
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Generate Cover Letter
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI-generated cover letter tailored to this role.
                </p>
              </Link>

              <Link
                href={`/jobs/${job.id}/apply?tab=interview-prep`}
                className="p-4 border border-border rounded-md hover:border-primary/40 hover:bg-secondary/40 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-primary" aria-hidden />
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Interview Prep
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Get personalized interview questions and prep tips.
                </p>
              </Link>

              <Link
                href={`/jobs/${job.id}/apply?tab=resume-improvement`}
                className="p-4 border border-border rounded-md hover:border-primary/40 hover:bg-secondary/40 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3 mb-2">
                  <ScrollText className="h-5 w-5 text-primary" aria-hidden />
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Resume Improvement
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload your resume for AI-powered optimization.
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Apply CTA */}
        <Card>
          <CardContent className="p-6 md:p-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Interested in this role?
              </h3>
              <p className="text-sm text-muted-foreground">
                Apply now to get started with your application.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {job.originalUrl && (
                <Button asChild variant="secondary">
                  <a
                    href={job.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Original Post
                  </a>
                </Button>
              )}
              <Button asChild>
                <Link href={`/jobs/${job.id}/apply`}>Apply Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClearDShell>
  )
}
