"use client"

import Link from "next/link"

interface JobCardProps {
  job: {
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
  }
}

const JobCard = ({ job }: JobCardProps) => {
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
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group">
        <div className="flex items-start gap-4 mb-4">
          {job.company.logo ? (
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200">
              <span className="text-2xl">🏢</span>
            </div>
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200">
              <span className="text-2xl">🏢</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <Link
              href={`/company/${job.company.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-block"
            >
              {job.company.name}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {locationText}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            {job.employmentType.replace("_", " ")}
          </span>
          {salaryText && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              💰 {salaryText}
            </span>
          )}
        </div>

        {job.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {job.description.length > 200 
                ? `${job.description.substring(0, 200)}...` 
                : job.description}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span>👁️</span>
              <span>{job.views || 0} views</span>
            </span>
            {job.applications && job.applications.length > 0 && (
              <span className="flex items-center gap-1">
                <span>👥</span>
                <span>{job.applications.length} {job.applications.length === 1 ? 'applicant' : 'applicants'}</span>
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            Posted {new Date(job.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: new Date(job.createdAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
            })}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default JobCard

