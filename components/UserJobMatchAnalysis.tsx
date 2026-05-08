"use client"

import { useState } from "react"
import {
  Target,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

const scoreClass = (score: number) => {
  if (score >= 80) return "text-success border-success/40"
  if (score >= 60) return "text-primary border-primary/40"
  if (score >= 40) return "text-warning border-warning/40"
  return "text-muted-foreground"
}

export default function UserJobMatchAnalysis({
  jobId,
  compact = false,
}: UserJobMatchAnalysisProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 h-full min-h-[120px]">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Analyzing…</p>
      </div>
    )
  }

  if (!match) {
    if (compact) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-primary" aria-hidden />
            <h4 className="font-semibold text-foreground">Analyze Match</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Get AI-powered analysis of how well you match this job.
          </p>
          <Button onClick={loadMatch} disabled={loading} className="gap-2 w-full">
            <Sparkles className="h-4 w-4" aria-hidden />
            Analyze Match
          </Button>
        </div>
      )
    }
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-md bg-secondary border border-border flex items-center justify-center text-primary">
            <Target className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Analyze Your Match
          </h3>
          <p className="text-sm text-muted-foreground">
            Get AI-powered analysis of how well you match this job.
          </p>
          <Button onClick={loadMatch} disabled={loading} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            Analyze Match
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" aria-hidden />
          <h4 className="font-semibold text-foreground">Match Score</h4>
          <Badge
            variant="outline"
            className={cn("ml-auto font-semibold text-sm", scoreClass(match.matchScore))}
          >
            {match.matchScore}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
          {match.reasoning}
        </p>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {expanded ? "Show Less" : "Show Details"}
        </button>
        {expanded && match.strengths && match.strengths.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
            <div>
              <h5 className="font-semibold text-success mb-1">Strengths</h5>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                {match.strengths.slice(0, 2).map((strength, idx) => (
                  <li key={idx} className="line-clamp-1">{strength}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" aria-hidden />
                Your Match Score
              </h3>
              <Badge
                variant="outline"
                className={cn("font-semibold text-base", scoreClass(match.matchScore))}
              >
                {match.matchScore}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{match.reasoning}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show Less" : "Show Details"}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            {match.strengths && match.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-success mb-2 inline-flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Your Strengths
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  {match.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {match.gaps && match.gaps.length > 0 && (
              <div>
                <h4 className="font-semibold text-warning mb-2 inline-flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  Areas to Improve
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  {match.gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {match.recommendations && match.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-2 inline-flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4" aria-hidden />
                  Recommendations
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  {match.recommendations.map((rec, idx) => (
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
