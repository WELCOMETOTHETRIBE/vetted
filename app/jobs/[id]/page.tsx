import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import JobApplicationForm from "@/components/JobApplicationForm"
import JobMatchAnalysis from "@/components/JobMatchAnalysis"
import InterviewPrep from "@/components/InterviewPrep"

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
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/80 text-gray-600 border border-gray-300" title={`Job ID: ${job.id} - Select and copy this to use in Predictive Score`}>
                <span>🆔</span>
                <span className="select-all font-semibold cursor-text">{job.id}</span>
              </span>
            </div>
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

          {/* Match Analysis and Interview Prep Section - Moved to Top */}
          <div className="px-8 py-6 space-y-6 border-b border-gray-200">
            <div>
              <JobMatchAnalysis jobId={job.id} />
            </div>
            <div>
              <InterviewPrep jobId={job.id} jobTitle={job.title} />
            </div>
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            <div className="mb-8">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">📄</span>
                    Job Description
                  </h2>
                </div>
                <div className="px-6 py-6">
                  <div className="text-gray-700 leading-relaxed space-y-4">
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
                          <div key={idx} className="mb-4 pl-4 border-l-4 border-blue-300 bg-blue-50/30 rounded-r-md py-2">
                            <p className="text-gray-800">
                              {parts.map((part: string, partIdx: number) => {
                                if (part.match(/^https?:\/\//)) {
                                  return (
                                    <a
                                      key={partIdx}
                                      href={part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium break-all inline-flex items-center gap-1 transition-colors"
                                    >
                                      {part}
                                      <span className="text-xs opacity-70">↗</span>
                                    </a>
                                  )
                                }
                                return <span key={partIdx}>{part}</span>
                              })}
                            </p>
                          </div>
                        )
                      }
                      // Skip empty lines
                      if (!line.trim()) {
                        return <div key={idx} className="h-2" />
                      }
                      // Check if line starts with bullet points or dashes
                      const isListItem = /^[\-\•\*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim())
                      if (isListItem) {
                        return (
                          <div key={idx} className="flex items-start gap-3 mb-3 pl-4">
                            <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-800 flex-1 leading-7">{line.replace(/^[\-\•\*]\s/, '').replace(/^\d+\.\s/, '')}</p>
                          </div>
                        )
                      }
                      return (
                        <p key={idx} className="mb-4 text-gray-800 leading-7">
                          {line}
                        </p>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            {job.requirements && (
              <div className="mt-10">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-blue-600">📋</span>
                      Requirements
                    </h2>
                  </div>
                  <div className="px-6 py-6">
                    <div className="text-gray-700 leading-relaxed space-y-4">
                      {job.requirements.split('\n').map((line: string, idx: number) => {
                        // Check if line contains a URL
                        const urlMatch = line.match(/https?:\/\/[^\s]+/g)
                        if (urlMatch) {
                          const parts = line.split(/(https?:\/\/[^\s]+)/g)
                          return (
                            <div key={idx} className="mb-4 pl-4 border-l-4 border-blue-300 bg-blue-50/30 rounded-r-md py-2">
                              <p className="text-gray-800">
                                {parts.map((part: string, partIdx: number) => {
                                  if (part.match(/^https?:\/\//)) {
                                    return (
                                      <a
                                        key={partIdx}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium break-all inline-flex items-center gap-1 transition-colors"
                                      >
                                        {part}
                                        <span className="text-xs opacity-70">↗</span>
                                      </a>
                                    )
                                  }
                                  return <span key={partIdx}>{part}</span>
                                })}
                              </p>
                            </div>
                          )
                        }
                        // Skip empty lines
                        if (!line.trim()) {
                          return <div key={idx} className="h-2" />
                        }
                        // Check if line starts with bullet points or dashes
                        const isListItem = /^[\-\•\*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim())
                        if (isListItem) {
                          return (
                            <div key={idx} className="flex items-start gap-3 mb-3 pl-4">
                              <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                              <p className="text-gray-800 flex-1">{line.replace(/^[\-\•\*]\s/, '').replace(/^\d+\.\s/, '')}</p>
                            </div>
                          )
                        }
                        return (
                          <p key={idx} className="mb-3 text-gray-800 leading-7">
                            {line}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Application Section */}
          <div className="mt-10">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg overflow-hidden">
              <div className="bg-white/70 backdrop-blur-sm border-b border-blue-200 px-6 py-5">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-blue-600">✉️</span>
                  Application
                </h2>
              </div>
              <div className="px-6 py-6">
                {hasApplied ? (
                  <div className="bg-white/80 backdrop-blur-sm border-2 border-green-300 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-900 mb-2">
                          Application Submitted Successfully
                        </h3>
                        <div className="space-y-2">
                          <p className="text-gray-700">
                            <span className="font-semibold text-gray-900">Status:</span>{' '}
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {application?.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mt-3">
                            We'll keep you updated on your application status. You can check back here anytime to see updates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Apply for this Position</h3>
                      <p className="text-gray-600 text-sm">
                        Fill out the form below to submit your application. We'll review it and get back to you soon.
                      </p>
                    </div>
                    <JobApplicationForm jobId={job.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

