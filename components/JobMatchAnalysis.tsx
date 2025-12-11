"use client"

import { useState, useEffect } from "react"

interface JobMatchAnalysisProps {
  jobId: string
}

interface MatchResult {
  matchScore: number
  reasoning: string
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}

export default function JobMatchAnalysis({ jobId }: JobMatchAnalysisProps) {
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
        setExpanded(true)
      }
    } catch (error) {
      console.error("Error loading match:", error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200"
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  if (!match && !loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span>📊</span>
              <span>How Well Do You Match?</span>
            </h3>
            <p className="text-sm text-gray-600">
              Get an AI-powered analysis of how your profile matches this job
            </p>
          </div>
          <button
            onClick={loadMatch}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
          >
            <span>🤖</span>
            <span>Analyze Match</span>
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Analyzing your match...</p>
      </div>
    )
  }

  if (!match) return null

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📊</span>
          <span>Match Analysis</span>
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div className="mb-4">
        <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-bold text-2xl ${getScoreColor(match.matchScore)}`}>
          {match.matchScore}% Match
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Analysis</h4>
            <p className="text-sm text-gray-700">{match.reasoning}</p>
          </div>

          {match.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                <span>✅</span>
                <span>Strengths</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {match.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {match.gaps.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                <span>⚠️</span>
                <span>Areas to Improve</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {match.gaps.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {match.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
                <span>💡</span>
                <span>Recommendations</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
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

