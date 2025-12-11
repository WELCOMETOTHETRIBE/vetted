"use client"

import { useState } from "react"

interface ProfileOptimizationProps {
  onApplyHeadline?: (headline: string) => void
  onApplyAbout?: (about: string) => void
  onAddSkill?: (skill: string) => void
}

export default function ProfileOptimization({ onApplyHeadline, onApplyAbout, onAddSkill }: ProfileOptimizationProps) {
  const [optimization, setOptimization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const loadOptimization = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile/optimize")
      if (response.ok) {
        const data = await response.json()
        setOptimization(data)
        setExpanded(true)
      } else {
        alert("Failed to load optimization suggestions")
      }
    } catch (error) {
      console.error("Error loading optimization:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!optimization && !loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span>✨</span>
              <span>AI Profile Optimization</span>
            </h3>
            <p className="text-sm text-gray-600">
              Get AI-powered suggestions to improve your profile
            </p>
          </div>
          <button
            onClick={loadOptimization}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
          >
            <span>🤖</span>
            <span>Optimize</span>
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <p className="text-gray-600 text-center">Analyzing your profile...</p>
      </div>
    )
  }

  if (!optimization) return null

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>✨</span>
          <span>Optimization Suggestions</span>
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {optimization.headline && (
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Improved Headline</h4>
                {onApplyHeadline && (
                  <button
                    onClick={() => onApplyHeadline(optimization.headline)}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Apply
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700">{optimization.headline}</p>
            </div>
          )}

          {optimization.about && (
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Improved About Section</h4>
                {onApplyAbout && (
                  <button
                    onClick={() => onApplyAbout(optimization.about)}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Apply
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{optimization.about}</p>
            </div>
          )}

          {optimization.skillSuggestions && optimization.skillSuggestions.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-2">Suggested Skills</h4>
              <div className="flex flex-wrap gap-2">
                {optimization.skillSuggestions.map((skill: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => onAddSkill?.(skill)}
                    className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {optimization.overallFeedback && (
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-2">Overall Feedback</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{optimization.overallFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

