"use client"

import { useState } from "react"
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Target,
  BookOpen,
  Lightbulb,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SkillGap {
  skill: string
  reason: string
}

interface Insights {
  trajectory?: string
  strengths?: string[]
  nextSteps?: string[]
  skillGaps?: SkillGap[]
  recommendations?: string[]
}

export default function CareerInsights() {
  const [insights, setInsights] = useState<Insights | null>(null)
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
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1 inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Career Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Get AI-powered analysis of your career trajectory and recommendations.
            </p>
          </div>
          <Button onClick={loadInsights} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            Analyze
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Analyzing your career…</p>
        </CardContent>
      </Card>
    )
  }

  if (!insights) return null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            Career Insights
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>

        {expanded && (
          <div className="space-y-4 text-sm text-muted-foreground">
            {insights.trajectory && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Career Trajectory
                </h4>
                <p>{insights.trajectory}</p>
              </div>
            )}

            {insights.strengths && insights.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-success mb-2 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Key Strengths
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {insights.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.nextSteps && insights.nextSteps.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-2 inline-flex items-center gap-1.5">
                  <Target className="h-4 w-4" aria-hidden />
                  Next Steps
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {insights.nextSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.skillGaps && insights.skillGaps.length > 0 && (
              <div>
                <h4 className="font-semibold text-warning mb-2 inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Skills to Consider
                </h4>
                <ul className="space-y-2">
                  {insights.skillGaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-medium text-foreground">{gap.skill}:</span>
                      <span>{gap.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.recommendations && insights.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-2 inline-flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" aria-hidden />
                  Recommendations
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {insights.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
