import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import Link from "next/link"

async function getJob(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
        isActive: true,
      },
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
        applications: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!job) {
      return null
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      company: {
        id: job.company.id,
        name: job.company.name,
        slug: job.company.slug,
        logo: job.company.logo,
        about: job.company.about,
        website: job.company.website,
        location: job.company.location,
        size: job.company.size,
        industry: job.company.industry,
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
    }
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
      ? `${job.salaryCurrency || "$"}${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
      : null

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <span>←</span>
          <span>Back to Jobs</span>
        </Link>

        {/* Job Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {job.company.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title}
              </h1>
              <Link
                href={`/company/${job.company.slug}`}
                className="text-xl text-primary-600 hover:text-primary-700 font-semibold mb-4 inline-block transition-colors"
              >
                {job.company.name}
              </Link>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200">
                  {locationText}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  {job.employmentType.replace("_", " ")}
                </span>
                {salaryText && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
                    💰 {salaryText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Job Stats */}
          <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>👁️</span>
              <span>{job.views} views</span>
            </div>
            {job.applications && job.applications.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>👥</span>
                <span>{job.applications.length} {job.applications.length === 1 ? 'applicant' : 'applicants'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📅</span>
              <span>
                Posted {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Job Description */}
        {job.description && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Job Description
            </h2>
            <div
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
        )}

        {/* Company Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Company</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{job.company.name}</h3>
              {job.company.about && (
                <p className="text-gray-600">{job.company.about}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {job.company.location && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Location:</span>
                  <p className="text-gray-600">{job.company.location}</p>
                </div>
              )}
              {job.company.industry && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Industry:</span>
                  <p className="text-gray-600">{job.company.industry}</p>
                </div>
              )}
              {job.company.size && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Size:</span>
                  <p className="text-gray-600">{job.company.size}</p>
                </div>
              )}
              {job.company.website && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Website:</span>
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {job.company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Interested in this role?
              </h3>
              <p className="text-gray-600">
                Apply now to get started with your application.
              </p>
            </div>
            <div className="flex gap-4">
              {job.originalUrl && (
                <a
                  href={job.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  View Original Post
                </a>
              )}
              <Link
                href={`/jobs/${job.id}/apply`}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}