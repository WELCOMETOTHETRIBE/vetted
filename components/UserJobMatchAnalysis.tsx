"use client"

import { useState } from "react"

interface UserJobMatchAnalysisProps {
  jobId: string
  compact?: boolean
}

interface MatchResult {
  matchScore: number
  reasoning: string
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}

export default function UserJobMatchAnalysis({ jobId, compact = false }: UserJobMatchAnalysisProps) {
  const [match, setMatch] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const loadMatch = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/match`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data)
      }
    } catch (error) {
      console.error("Error loading match:", error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 bg-green-50 border-green-200"
    if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200"
    if (score >= 40) return "text-yellow-700 bg-yellow-50 border-yellow-200"
    return "text-gray-700 bg-gray-50 border-gray-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 h-full min-h-[120px]">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
        <p className="text-sm text-gray-600">Analyzing...</p>
      </div>
    )
  }

  if (!match && !loading) {
    if (compact) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎯</span>
            <h4 className="font-semibold text-gray-900">Analyze Match</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4 flex-1">
            Get AI-powered analysis of how well you match this job
          </p>
          <button
            onClick={loadMatch}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <span>🤖</span>
            <span>Analyze Match</span>
          </button>
        </div>
      )
    }
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze Your Match</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get AI-powered analysis of how well you match this job
          </p>
          <button
            onClick={loadMatch}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <span>🤖</span>
            <span>Analyze Match</span>
          </button>
        </div>
      </div>
    )
  }

  if (!match) {
    return null
  }

  if (compact) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🎯</span>
          <h4 className="font-semibold text-gray-900">Match Score</h4>
          <div className={`ml-auto inline-flex items-center px-3 py-1 rounded-lg border-2 font-bold text-lg ${getScoreColor(match.matchScore)}`}>
            {match.matchScore}%
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">{match.reasoning}</p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors text-left"
        >
          {expanded ? "Show Less" : "Show Details"}
        </button>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
            {match.strengths && match.strengths.length > 0 && (
              <div>
                <h5 className="font-semibold text-green-700 mb-1">Strengths</h5>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700 ml-2">
                  {match.strengths.slice(0, 2).map((strength, idx) => (
                    <li key={idx} className="line-clamp-1">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🎯</span>
              <span>Your Match Score</span>
            </h3>
            <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-bold text-xl ${getScoreColor(match.matchScore)}`}>
              {match.matchScore}%
            </div>
          </div>
          <p className="text-sm text-gray-700">{match.reasoning}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {expanded ? "Show Less" : "Show Details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
          {match.strengths && match.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2 text-sm">
                <span>✅</span>
                <span>Your Strengths</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                {match.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {match.gaps && match.gaps.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2 text-sm">
                <span>⚠️</span>
                <span>Areas to Improve</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                {match.gaps.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {match.recommendations && match.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2 text-sm">
                <span>💡</span>
                <span>Recommendations</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                {match.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

