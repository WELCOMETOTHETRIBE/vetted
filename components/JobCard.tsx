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
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
            <Link
              href={`/company/${job.company.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline"
            >
              {job.company.name}
            </Link>
          </div>
          {job.company.logo && (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🏢</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
          <span>{locationText}</span>
          <span>•</span>
          <span>{job.employmentType.replace("_", " ")}</span>
          {salaryText && (
            <>
              <span>•</span>
              <span className="font-semibold text-gray-900">{salaryText}</span>
            </>
          )}
        </div>

        {job.description && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              {job.description.length > 150 
                ? `${job.description.substring(0, 150)}...` 
                : job.description}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {job.applications ? `${job.applications.length} applicants` : `${job.views} views`}
          </span>
          <span>
            {new Date(job.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default JobCard

