"use client"

import { useEffect, useState } from "react"

interface TimelineEvent {
  id: string
  type: "ENGAGEMENT" | "STATUS_CHANGE" | "NOTE" | "SCORE_CALCULATED"
  title: string
  description?: string
  timestamp: string
  metadata?: Record<string, any>
  icon?: string
  color?: string
}

interface RelationshipHealth {
  score: number
  level: "excellent" | "good" | "fair" | "poor" | "cold"
  factors: Array<{
    factor: string
    impact: "positive" | "negative" | "neutral"
    description: string
  }>
  lastInteraction?: string
  daysSinceLastInteraction: number
  totalInteractions: number
  responseRate: number
}

interface NextAction {
  action: string
  type: "EMAIL" | "CALL" | "MESSAGE" | "LINKEDIN" | "WAIT" | "FOLLOW_UP"
  priority: "high" | "medium" | "low"
  reason: string
  suggestedDate?: string
}

interface CandidateTimelineProps {
  candidateId: string
}

export default function CandidateTimeline({ candidateId }: CandidateTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [health, setHealth] = useState<RelationshipHealth | null>(null)
  const [nextActions, setNextActions] = useState<NextAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTimeline()
  }, [candidateId])

  const fetchTimeline = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/candidates/${candidateId}/timeline`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch timeline`)
      }
      const data = await response.json()
      setTimeline(data.timeline || [])
      setHealth(data.health || null)
      setNextActions(data.nextActions || [])
    } catch (err: any) {
      console.error("[CandidateTimeline] Error:", err)
      setError(err.message || "Failed to load timeline")
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-300"
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "poor":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "cold":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "EMAIL":
        return "📧"
      case "CALL":
        return "📞"
      case "MESSAGE":
        return "💬"
      case "LINKEDIN":
        return "💼"
      case "WAIT":
        return "⏳"
      default:
        return "📨"
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Relationship Timeline</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTimeline}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Relationship Timeline</h3>
        <button
          onClick={fetchTimeline}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Relationship Health Score */}
      {health && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Relationship Health</p>
              <p className="text-3xl font-bold text-gray-900">{health.score}/100</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-lg border ${getHealthColor(
                health.level
              )}`}
            >
              {health.level.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Interactions:</span>{" "}
              <strong className="text-gray-900">{health.totalInteractions}</strong>
            </div>
            <div>
              <span className="text-gray-600">Response Rate:</span>{" "}
              <strong className="text-gray-900">{health.responseRate}%</strong>
            </div>
            {health.lastInteraction && (
              <div className="col-span-2">
                <span className="text-gray-600">Last Interaction:</span>{" "}
                <strong className="text-gray-900">
                  {new Date(health.lastInteraction).toLocaleDateString()} (
                  {health.daysSinceLastInteraction} days ago)
                </strong>
              </div>
            )}
          </div>
          {health.factors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Key Factors:</p>
              <div className="space-y-1">
                {health.factors.slice(0, 3).map((factor, idx) => (
                  <div
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${
                      factor.impact === "positive"
                        ? "bg-green-100 text-green-700"
                        : factor.impact === "negative"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {factor.factor}: {factor.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Next Actions</h4>
          <div className="space-y-2">
            {nextActions.map((action, idx) => (
              <div
                key={idx}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(action.type)}</span>
                      <span className="font-medium text-gray-900">{action.action}</span>
                    </div>
                    <p className="text-xs text-gray-600">{action.reason}</p>
                    {action.suggestedDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested: {new Date(action.suggestedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(
                      action.priority
                    )}`}
                  >
                    {action.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Re-engagement Section */}
      {health && health.daysSinceLastInteraction > 30 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Re-engagement Opportunity</h4>
              <p className="text-xs text-gray-600 mt-1">
                No contact for {health.daysSinceLastInteraction} days - consider re-engaging
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/candidates/${candidateId}/re-engage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                })
                if (response.ok) {
                  alert("Re-engagement workflow triggered!")
                  fetchTimeline()
                }
              } catch (error) {
                console.error("Error triggering re-engagement:", error)
              }
            }}
            className="mt-2 px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Trigger Re-engagement Workflow
          </button>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Timeline ({timeline.length} events)
        </h4>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No timeline events yet.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((event, idx) => (
              <div
                key={event.id}
                className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {event.icon || "📅"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h5 className="font-medium text-gray-900">{event.title}</h5>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  )}
                  {event.metadata && event.metadata.status && (
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                        event.metadata.status === "RESPONDED"
                          ? "bg-green-100 text-green-700"
                          : event.metadata.status === "OPENED"
                            ? "bg-purple-100 text-purple-700"
                            : event.metadata.status === "SENT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {event.metadata.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

