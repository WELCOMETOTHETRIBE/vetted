"use client"

import { useState } from "react"
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
    originalUrl?: string | null
  }
}

const JobCard = ({ job }: JobCardProps) => {
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [loadingMatch, setLoadingMatch] = useState(false)

  const loadMatchScore = async () => {
    setLoadingMatch(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/match`)
      if (response.ok) {
        const data = await response.json()
        setMatchScore(data.matchScore)
      }
    } catch (error) {
      // Silently fail - match score is optional
    } finally {
      setLoadingMatch(false)
    }
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

  const getMatchColor = (score: number | null) => {
    if (score === null) return "gray"
    if (score >= 80) return "green"
    if (score >= 60) return "blue"
    if (score >= 40) return "yellow"
    return "gray"
  }

  const matchColor = getMatchColor(matchScore)

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6 hover:shadow-card-hover hover:border-primary-300 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start gap-4 mb-4">
          {job.company.logo ? (
            <div className="w-14 h-14 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-200 shadow-sm">
              <span className="text-2xl">🏢</span>
            </div>
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-neutral-200 shadow-sm">
              <span className="text-2xl">🏢</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
              {job.title}
            </h3>
            <Link
              href={`/company/${job.company.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary-600 hover:text-primary-700 font-semibold text-sm inline-block transition-colors"
            >
              {job.company.name}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {loadingMatch ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm bg-neutral-50 text-neutral-700 border-neutral-200">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-neutral-600 mr-1"></span>
              <span>Analyzing...</span>
            </span>
          ) : matchScore !== null ? (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
              matchColor === "green" ? "bg-success-50 text-success-700 border-success-200" :
              matchColor === "blue" ? "bg-primary-50 text-primary-700 border-primary-200" :
              matchColor === "yellow" ? "bg-warning-50 text-warning-700 border-warning-200" :
              "bg-neutral-50 text-neutral-700 border-neutral-200"
            }`}>
              <span>🎯</span>
              <span className="ml-1">{matchScore}% Match</span>
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                loadMatchScore()
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 transition-colors"
            >
              <span>🎯</span>
              <span className="ml-1">Check Match</span>
            </button>
          )}
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 shadow-sm">
            {locationText}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-50 text-neutral-700 border border-neutral-200 shadow-sm">
            {job.employmentType.replace("_", " ")}
          </span>
          {salaryText && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-success-50 text-success-700 border border-success-200 shadow-sm">
              💰 {salaryText}
            </span>
          )}
        </div>

        {job.description && (
          <div className="mb-4">
            <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
              {job.description.length > 200 
                ? `${job.description.substring(0, 200)}...` 
                : job.description}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200" title={`Job ID: ${job.id}`}>
              <span>🆔</span>
              <span className="select-all">{job.id}</span>
            </span>
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
          <div className="flex items-center gap-3">
            {job.originalUrl && (
              <a
                href={job.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200"
                title="View original job posting"
              >
                <span>🔗</span>
                <span>Original Post</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
            <span className="text-xs text-neutral-400">
              Posted {new Date(job.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: new Date(job.createdAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default JobCard

