"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface JobMatchAnalysisProps {
  jobId: string
}

interface CandidateMatch {
  candidateId: string
  candidateName: string
  matchScore: number
  reasoning: string
  strengths: string[]
  gaps: string[]
  candidate?: {
    id: string
    fullName: string
    jobTitle: string | null
    currentCompany: string | null
    location: string | null
    linkedinUrl: string
  } | null
}

interface TopCandidatesResponse {
  jobId: string
  jobTitle: string
  companyName: string
  candidates: CandidateMatch[]
  totalCandidatesAnalyzed: number
}

export default function JobMatchAnalysis({ jobId }: JobMatchAnalysisProps) {
  const [data, setData] = useState<TopCandidatesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTopCandidates()
  }, [jobId])

  const loadTopCandidates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/top-candidates`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        const error = await response.json()
        console.error("Error loading top candidates:", error)
      }
    } catch (error) {
      console.error("Error loading top candidates:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCandidate = (candidateId: string) => {
    const newExpanded = new Set(expandedCandidates)
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId)
    } else {
      newExpanded.add(candidateId)
    }
    setExpandedCandidates(newExpanded)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200"
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  if (!data && !loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span>🔍</span>
              <span>Find Top Candidates</span>
            </h3>
            <p className="text-sm text-gray-600">
              AI-powered analysis of the top 3 candidates for this role
            </p>
          </div>
          <button
            onClick={loadTopCandidates}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <span>🤖</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <p className="text-gray-600">Analyzing candidates...</p>
        </div>
      </div>
    )
  }

  if (!data || data.candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
          <p className="text-gray-600 text-sm">
            {data?.totalCandidatesAnalyzed === 0
              ? "No active candidates in the system"
              : "No strong matches found for this role"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-sm p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔍</span>
            <span>Top 3 Candidates</span>
          </h3>
          <button
            onClick={loadTopCandidates}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Analyzed {data.totalCandidatesAnalyzed} candidates • Showing top 3 matches
        </p>
      </div>

      <div className="space-y-4">
        {data.candidates.map((candidate, index) => (
          <div
            key={candidate.candidateId}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">
                        {candidate.candidateName}
                      </h4>
                      {candidate.candidate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          {candidate.candidate.jobTitle && (
                            <span className="truncate">{candidate.candidate.jobTitle}</span>
                          )}
                          {candidate.candidate.currentCompany && (
                            <>
                              <span>•</span>
                              <span className="truncate">{candidate.candidate.currentCompany}</span>
                            </>
                          )}
                          {candidate.candidate.location && (
                            <>
                              <span>•</span>
                              <span className="truncate">{candidate.candidate.location}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border-2 font-bold text-lg ${getScoreColor(candidate.matchScore)}`}>
                        {candidate.matchScore}%
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{candidate.reasoning}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {candidate.candidate && (
                      <Link
                        href={`/candidates?search=${encodeURIComponent(candidate.candidateName)}`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        View Profile
                      </Link>
                    )}
                    {candidate.candidate?.linkedinUrl && (
                      <a
                        href={candidate.candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                      >
                        LinkedIn
                        <span className="text-xs">↗</span>
                      </a>
                    )}
                    <button
                      onClick={() => toggleCandidate(candidate.candidateId)}
                      className="px-3 py-1 text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-medium transition-colors"
                    >
                      {expandedCandidates.has(candidate.candidateId) ? "Show Less" : "Show Details"}
                    </button>
                  </div>
                </div>
              </div>

              {expandedCandidates.has(candidate.candidateId) && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {candidate.strengths && candidate.strengths.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-green-700 mb-2 flex items-center gap-1 text-sm">
                        <span>✅</span>
                        <span>Strengths</span>
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                        {candidate.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.gaps && candidate.gaps.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-yellow-700 mb-2 flex items-center gap-1 text-sm">
                        <span>⚠️</span>
                        <span>Areas to Explore</span>
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                        {candidate.gaps.map((gap, idx) => (
                          <li key={idx}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
