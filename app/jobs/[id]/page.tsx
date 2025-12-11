import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import JobApplicationForm from "@/components/JobApplicationForm"

async function getJob(jobId: string, userId?: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: true,
      postedBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      applications: userId
        ? {
            where: { applicantId: userId },
            select: { id: true, status: true },
          }
        : false,
    },
  })

  if (job && userId) {
    // Increment view count
    await prisma.job.update({
      where: { id: jobId },
      data: { views: { increment: 1 } },
    })
  }

  return job
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const job = await getJob(id, session.user.id)

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Job not found</p>
          </div>
        </div>
      </div>
    )
  }

  const hasApplied = job.applications && job.applications.length > 0
  const application = hasApplied ? job.applications[0] : null

  // Extract original job URL from description
  const extractJobUrl = (description: string | null): string | null => {
    if (!description) return null
    const urlMatch = description.match(/Apply at:\s*(https?:\/\/[^\s\n]+)/i) || 
                     description.match(/(https?:\/\/jobs\.ashbyhq\.com[^\s\n]+)/i)
    return urlMatch ? urlMatch[1] : null
  }

  const originalJobUrl = extractJobUrl(job.description)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
            <div className="mb-4">
              <Link
                href={`/company/${job.company.slug}`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
              >
                <span>🏢</span>
                {job.company.name}
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 text-gray-700 border border-gray-300">
                {job.isRemote
                  ? "🌐 Remote"
                  : job.isHybrid
                  ? `🏢 Hybrid • ${job.location || "Location TBD"}`
                  : `📍 ${job.location || "Location TBD"}`}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 text-gray-700 border border-gray-300">
                {job.employmentType.replace("_", " ")}
              </span>
              {job.salaryMin && job.salaryMax && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
                  💰 {job.salaryCurrency || "$"}
                  {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                </span>
              )}
            </div>
            {originalJobUrl && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <a
                  href={originalJobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <span>🔗</span>
                  View Original Job Posting
                  <span className="text-xs opacity-90">↗</span>
                </a>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            <div className="prose max-w-none mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Job Description</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed space-y-4">
              {job.description?.split('\n').map((line: string, idx: number) => {
                // Skip "Apply at:" lines since we show the button above
                if (line.match(/^Apply at:/i)) {
                  return null
                }
                
                // Check if line contains a URL
                const urlMatch = line.match(/https?:\/\/[^\s]+/g)
                if (urlMatch) {
                  const parts = line.split(/(https?:\/\/[^\s]+)/g)
                  return (
                    <p key={idx} className="mb-4">
                      {parts.map((part: string, partIdx: number) => {
                        if (part.match(/^https?:\/\//)) {
                          return (
                            <a
                              key={partIdx}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline font-medium break-all"
                            >
                              {part}
                            </a>
                          )
                        }
                        return <span key={partIdx}>{part}</span>
                      })}
                    </p>
                  )
                }
                // Skip empty lines
                if (!line.trim()) {
                  return <br key={idx} />
                }
                    return <p key={idx} className="mb-4">{line}</p>
              })}
              </div>
            </div>
            {job.requirements && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Requirements
                </h2>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed space-y-3">
                  {job.requirements.split('\n').map((line: string, idx: number) => {
                    // Check if line contains a URL
                    const urlMatch = line.match(/https?:\/\/[^\s]+/g)
                    if (urlMatch) {
                      const parts = line.split(/(https?:\/\/[^\s]+)/g)
                      return (
                        <p key={idx} className="mb-3">
                          {parts.map((part: string, partIdx: number) => {
                            if (part.match(/^https?:\/\//)) {
                              return (
                                <a
                                  key={partIdx}
                                  href={part}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium break-all"
                                >
                                  {part}
                                </a>
                              )
                            }
                            return <span key={partIdx}>{part}</span>
                          })}
                        </p>
                      )
                    }
                    // Skip empty lines
                    if (!line.trim()) {
                      return <br key={idx} />
                    }
                    return <p key={idx} className="mb-3">{line}</p>
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Application Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            {hasApplied ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <p className="text-blue-900 font-semibold mb-1">
                      Application Submitted
                    </p>
                    <p className="text-blue-700 text-sm">
                      Status: <span className="font-semibold">{application?.status.replace("_", " ")}</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Apply for this Position</h3>
                <JobApplicationForm jobId={job.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

