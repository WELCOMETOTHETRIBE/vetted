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
  const [healthExpanded, setHealthExpanded] = useState(false)

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
      
      // Reset health when no correspondence
      const healthData = data.health || null
      if (healthData && healthData.totalInteractions === 0) {
        setHealth({
          ...healthData,
          score: 50, // Neutral score when no interactions
          level: "fair",
          factors: [
            {
              factor: "No Engagement Yet",
              impact: "neutral",
              description: "No interactions recorded - initiate first outreach to establish relationship",
            },
          ],
        })
      } else {
        setHealth(healthData)
      }
      
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
        return "bg-success/15 text-success border-green-300"
      case "good":
        return "bg-primary/15 text-primary border-blue-300"
      case "fair":
        return "bg-warning/15 text-warning border-yellow-300"
      case "poor":
        return "bg-warning/15 text-orange-800 border-warning/40"
      case "cold":
        return "bg-destructive/15 text-red-800 border-red-300"
      default:
        return "bg-secondary text-foreground border-border"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/15 text-red-800"
      case "medium":
        return "bg-warning/15 text-warning"
      case "low":
        return "bg-secondary text-foreground"
      default:
        return "bg-secondary text-foreground"
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
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-4 bg-secondary rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">Relationship Timeline</h3>
        <p className="text-sm text-destructive mb-4">{error}</p>
        <button
          onClick={fetchTimeline}
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Relationship Timeline</h3>
        <button
          onClick={fetchTimeline}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary/40 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Relationship Health Score */}
      {health && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setHealthExpanded(!healthExpanded)}
            className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Relationship Health</p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-foreground">{health.score}/100</p>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-lg border ${getHealthColor(
                      health.level
                    )}`}
                  >
                    {health.level.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-muted-foreground transition-transform ${healthExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {healthExpanded && (
            <div className="p-4 border-t border-border space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Interactions:</span>{" "}
                  <strong className="text-foreground">{health.totalInteractions}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Response Rate:</span>{" "}
                  <strong className="text-foreground">{health.responseRate}%</strong>
                </div>
                {health.lastInteraction && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Last Interaction:</span>{" "}
                    <strong className="text-foreground">
                      {new Date(health.lastInteraction).toLocaleDateString()} (
                      {health.daysSinceLastInteraction} days ago)
                    </strong>
                  </div>
                )}
              </div>
              {health.factors.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">Key Factors:</p>
                  <div className="space-y-1">
                    {health.factors.map((factor, idx) => (
                      <div
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${
                          factor.impact === "positive"
                            ? "bg-success/15 text-success"
                            : factor.impact === "negative"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-secondary text-foreground"
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
        </div>
      )}

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Recommended Next Actions</h4>
          <div className="space-y-2">
            {nextActions.map((action, idx) => (
              <div
                key={idx}
                className="p-3 border border-border rounded-lg hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(action.type)}</span>
                      <span className="font-medium text-foreground">{action.action}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.reason}</p>
                    {action.suggestedDate && (
                      <p className="text-xs text-muted-foreground mt-1">
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
        <div className="p-4 bg-warning/10 rounded-lg border border-warning/40">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Re-engagement Opportunity</h4>
              <p className="text-xs text-muted-foreground mt-1">
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
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Timeline ({timeline.length} events)
        </h4>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No timeline events yet.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((event, idx) => (
              <div
                key={event.id}
                className="flex gap-3 p-3 border border-border rounded-lg hover:border-primary/40 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                    {event.icon || "📅"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h5 className="font-medium text-foreground">{event.title}</h5>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                  {event.metadata && event.metadata.status && (
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                        event.metadata.status === "RESPONDED"
                          ? "bg-success/15 text-success"
                          : event.metadata.status === "OPENED"
                            ? "bg-primary/15 text-primary"
                            : event.metadata.status === "SENT"
                              ? "bg-primary/15 text-primary"
                              : "bg-secondary text-foreground"
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

