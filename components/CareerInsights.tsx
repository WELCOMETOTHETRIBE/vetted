"use client"

import { useState } from "react"

export default function CareerInsights() {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const loadInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile/career-insights")
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
        setExpanded(true)
      } else {
        alert("Failed to load career insights")
      }
    } catch (error) {
      console.error("Error loading insights:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!insights && !loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span>📈</span>
              <span>Career Insights</span>
            </h3>
            <p className="text-sm text-gray-600">
              Get AI-powered analysis of your career trajectory and recommendations
            </p>
          </div>
          <button
            onClick={loadInsights}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            <span>🤖</span>
            <span>Analyze</span>
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Analyzing your career...</p>
      </div>
    )
  }

  if (!insights) return null

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📈</span>
          <span>Career Insights</span>
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Career Trajectory</h4>
            <p className="text-sm text-gray-700">{insights.trajectory}</p>
          </div>

          {insights.strengths && insights.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                <span>✅</span>
                <span>Key Strengths</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {insights.strengths.map((strength: string, idx: number) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.nextSteps && insights.nextSteps.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
                <span>🎯</span>
                <span>Next Steps</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {insights.nextSteps.map((step: string, idx: number) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.skillGaps && insights.skillGaps.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                <span>📚</span>
                <span>Skills to Consider</span>
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                {insights.skillGaps.map((gap: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-medium">{gap.skill}:</span>
                    <span>{gap.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.recommendations && insights.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-1">
                <span>💡</span>
                <span>Recommendations</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {insights.recommendations.map((rec: string, idx: number) => (
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

