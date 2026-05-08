"use client"

import { useState } from "react"
import { Sparkles, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Optimization {
  headline?: string
  about?: string
  skillSuggestions?: string[]
  overallFeedback?: string
}

interface ProfileOptimizationProps {
  onApplyHeadline?: (headline: string) => void
  onApplyAbout?: (about: string) => void
  onAddSkill?: (skill: string) => void
}

export default function ProfileOptimization({
  onApplyHeadline,
  onApplyAbout,
  onAddSkill,
}: ProfileOptimizationProps) {
  const [optimization, setOptimization] = useState<Optimization | null>(null)
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
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1 inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              AI Profile Optimization
            </h3>
            <p className="text-sm text-muted-foreground">
              Get AI-powered suggestions to improve your profile.
            </p>
          </div>
          <Button onClick={loadOptimization} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            Optimize
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Analyzing your profile…</p>
        </CardContent>
      </Card>
    )
  }

  if (!optimization) return null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Optimization Suggestions
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
          <div className="space-y-4">
            {optimization.headline && (
              <div className="rounded-md p-4 border border-border">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground">Improved Headline</h4>
                  {onApplyHeadline && (
                    <Button
                      size="sm"
                      onClick={() => onApplyHeadline(optimization.headline!)}
                    >
                      Apply
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{optimization.headline}</p>
              </div>
            )}

            {optimization.about && (
              <div className="rounded-md p-4 border border-border">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground">Improved About Section</h4>
                  {onApplyAbout && (
                    <Button
                      size="sm"
                      onClick={() => onApplyAbout(optimization.about!)}
                    >
                      Apply
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {optimization.about}
                </p>
              </div>
            )}

            {optimization.skillSuggestions && optimization.skillSuggestions.length > 0 && (
              <div className="rounded-md p-4 border border-border">
                <h4 className="font-semibold text-foreground mb-2">Suggested Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {optimization.skillSuggestions.map((skill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onAddSkill?.(skill)}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      <Badge
                        variant="outline"
                        className="text-primary border-primary/30 gap-1"
                      >
                        <Plus className="h-3 w-3" aria-hidden />
                        {skill}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {optimization.overallFeedback && (
              <div className="rounded-md p-4 border border-border">
                <h4 className="font-semibold text-foreground mb-2">Overall Feedback</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {optimization.overallFeedback}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
