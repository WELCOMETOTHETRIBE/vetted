"use client"

import { useState } from "react"

interface PredictiveScoreProps {
  candidateId: string
  onScoreCalculated?: (score: number) => void
}

interface TopJob {
  jobId: string
  jobTitle: string
  companyName: string
  companyId?: string
  location?: string | null
  isRemote: boolean
  isHybrid: boolean
  employmentType: string
  score: number
  confidence: "HIGH" | "MEDIUM" | "LOW"
  riskFactors: string[]
  reasoning: string
  strengths: string[]
  concerns: string[]
}

interface TopJobsResponse {
  candidateId: string
  candidateName: string
  topJobs: TopJob[]
  count: number
}

export default function PredictiveScore({
  candidateId,
  onScoreCalculated,
}: PredictiveScoreProps) {
  const [loading, setLoading] = useState(false)
  const [topJobs, setTopJobs] = useState<TopJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadTopJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/candidates/${candidateId}/top-jobs`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load top jobs")
      }

      const data: TopJobsResponse = await response.json()
      setTopJobs(data.topJobs || [])
      setHasLoaded(true)

      // Call callback with highest score if available
      if (data.topJobs && data.topJobs.length > 0 && onScoreCalculated) {
        onScoreCalculated(data.topJobs[0].score)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load recommended jobs")
      console.error("Error loading top jobs:", err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 bg-green-50 border-green-200"
    if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200"
    if (score >= 40) return "text-yellow-700 bg-yellow-50 border-yellow-200"
    return "text-red-700 bg-red-50 border-red-200"
  }

  const getConfidenceColor = (confidence: string) => {
    if (confidence === "HIGH") return "text-green-700 bg-green-100"
    if (confidence === "MEDIUM") return "text-blue-700 bg-blue-100"
    return "text-yellow-700 bg-yellow-100"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Exceptional Fit"
    if (score >= 75) return "Strong Fit"
    if (score >= 65) return "Good Fit"
    if (score >= 50) return "Moderate Fit"
    return "Weak Fit"
  }

  const getRankBadge = (index: number) => {
    const colors = [
      "bg-yellow-500 text-white", // Gold for #1
      "bg-gray-400 text-white",   // Silver for #2
      "bg-orange-600 text-white",  // Bronze for #3
    ]
    return colors[index] || "bg-gray-300 text-gray-700"
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Top 3 Recommended Jobs
          </h3>
          <p className="text-sm text-gray-600">
            Jobs with highest predictive success scores for this candidate
          </p>
        </div>
        {hasLoaded && (
          <button
            onClick={loadTopJobs}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors flex items-center gap-1"
            title="Refresh recommendations"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {!hasLoaded && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Get AI-powered job recommendations for this candidate</p>
          <button
            onClick={loadTopJobs}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Get Top 3 Recommended Jobs</span>
              </>
            )}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-sm text-gray-600">Analyzing jobs and calculating scores...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadTopJobs}
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        </div>
      )}

      {hasLoaded && !loading && !error && topJobs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">No recommended jobs found</p>
          <p className="text-sm text-gray-500">
            There may not be any active jobs in the system, or scores could not be calculated.
          </p>
        </div>
      )}

      {hasLoaded && !loading && !error && topJobs.length > 0 && (
        <div className="space-y-4">
          {topJobs.map((job, index) => (
            <div
              key={job.jobId}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Rank Badge */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadge(
                        index
                      )}`}
                    >
                      {index + 1}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {job.jobTitle}
                        </h4>
                        <div
                          className={`px-3 py-1 rounded-lg border-2 font-bold text-xl flex-shrink-0 ${getScoreColor(
                            job.score
                          )}`}
                        >
                          {Math.round(job.score)}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{job.companyName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {job.location}
                          </span>
                        )}
                        {job.isRemote && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            Remote
                          </span>
                        )}
                        {job.isHybrid && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            Hybrid
                          </span>
                        )}
                        {job.employmentType && (
                          <span>{job.employmentType}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Label and Confidence */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {getScoreLabel(job.score)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(
                      job.confidence
                    )}`}
                  >
                    {job.confidence} Confidence
                  </span>
                </div>

                {/* Expandable Details */}
                <button
                  onClick={() =>
                    setExpandedJobId(
                      expandedJobId === job.jobId ? null : job.jobId
                    )
                  }
                  className="w-full text-left text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mb-2"
                >
                  {expandedJobId === job.jobId ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      Hide Details
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Show Details
                    </>
                  )}
                </button>

                {expandedJobId === job.jobId && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <p className="text-sm text-gray-700">{job.reasoning}</p>

                    {/* Strengths */}
                    {job.strengths && job.strengths.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                          <span>✅</span>
                          <span>Success Predictors</span>
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                          {job.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Risk Factors */}
                    {job.riskFactors && job.riskFactors.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Risk Factors</span>
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                          {job.riskFactors.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns */}
                    {job.concerns && job.concerns.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1">
                          <span>📋</span>
                          <span>Areas to Explore</span>
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                          {job.concerns.map((concern, idx) => (
                            <li key={idx}>{concern}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* View Job Link */}
                    <div className="pt-2">
                      <a
                        href={`/jobs/${job.jobId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <span>View Job Details</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
