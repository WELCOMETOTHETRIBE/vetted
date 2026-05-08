"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Sparkles,
  Loader2,
  Users,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface JobMatchAnalysisProps {
  jobId: string
  compact?: boolean
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

const scoreClass = (score: number) => {
  if (score >= 80) return "text-success border-success/40"
  if (score >= 60) return "text-primary border-primary/40"
  if (score >= 40) return "text-warning border-warning/40"
  return "text-muted-foreground"
}

export default function JobMatchAnalysis({ jobId, compact = false }: JobMatchAnalysisProps) {
  const [data, setData] = useState<TopCandidatesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set())

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
    if (newExpanded.has(candidateId)) newExpanded.delete(candidateId)
    else newExpanded.add(candidateId)
    setExpandedCandidates(newExpanded)
  }

  if (!data && !loading) {
    if (compact) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-5 w-5 text-primary" aria-hidden />
            <h4 className="font-semibold text-foreground">Find Top Candidates</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            AI analysis of the top 3 candidates for this role.
          </p>
          <Button
            onClick={loadTopCandidates}
            disabled={loading}
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Find Top 3
          </Button>
        </div>
      )
    }
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-md bg-secondary border border-border flex items-center justify-center text-primary">
            <Search className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Find Top Candidates
          </h3>
          <p className="text-sm text-muted-foreground">
            AI analysis of the top 3 candidates for this role.
          </p>
          <Button onClick={loadTopCandidates} disabled={loading} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            Find Top 3 Candidates
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 h-full min-h-[120px]">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Analyzing…</p>
      </div>
    )
  }

  if (!data || data.candidates.length === 0) {
    if (compact) {
      return (
        <div className="h-full flex flex-col">
          <div className="text-center flex-1 flex flex-col justify-center">
            <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" aria-hidden />
            <h4 className="font-semibold text-foreground mb-1 text-sm">
              No candidates found
            </h4>
            <p className="text-xs text-muted-foreground">
              {data?.totalCandidatesAnalyzed === 0
                ? "No active candidates"
                : "No strong matches"}
            </p>
          </div>
        </div>
      )
    }
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-6 w-6 text-muted-foreground mx-auto mb-3" aria-hidden />
          <h3 className="text-base font-semibold text-foreground mb-2">
            No candidates found
          </h3>
          <p className="text-sm text-muted-foreground">
            {data?.totalCandidatesAnalyzed === 0
              ? "No active candidates in the system."
              : "No strong matches found for this role."}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-4 w-4 text-primary" aria-hidden />
          <h4 className="font-semibold text-foreground">Top 3 Candidates</h4>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {data.candidates.slice(0, 3).map((candidate) => (
            <div
              key={candidate.candidateId}
              className="rounded border border-border p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-foreground text-sm truncate">
                    {candidate.candidateName}
                  </h5>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {candidate.reasoning}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("font-semibold text-xs", scoreClass(candidate.matchScore))}
                >
                  {candidate.matchScore}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={loadTopCandidates}
          className="mt-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" aria-hidden />
              Top 3 Candidates
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTopCandidates}
            >
              Refresh
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyzed {data.totalCandidatesAnalyzed} candidates • Showing top 3 matches
          </p>
        </div>

        <div className="space-y-3">
          {data.candidates.map((candidate, index) => (
            <div
              key={candidate.candidateId}
              className="rounded-md border border-border p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm border border-border">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground truncate">
                      {candidate.candidateName}
                    </h4>
                    <Badge
                      variant="outline"
                      className={cn("font-semibold", scoreClass(candidate.matchScore))}
                    >
                      {candidate.matchScore}%
                    </Badge>
                  </div>
                  {candidate.candidate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
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
              </div>

              <p className="text-sm text-muted-foreground my-3 line-clamp-2">
                {candidate.reasoning}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {candidate.candidate && (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/candidates?search=${encodeURIComponent(candidate.candidateName)}`}
                    >
                      View Profile
                    </Link>
                  </Button>
                )}
                {candidate.candidate?.linkedinUrl && (
                  <Button asChild size="sm" variant="secondary">
                    <a
                      href={candidate.candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-1"
                    >
                      LinkedIn
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleCandidate(candidate.candidateId)}
                >
                  {expandedCandidates.has(candidate.candidateId) ? "Show Less" : "Show Details"}
                </Button>
              </div>

              {expandedCandidates.has(candidate.candidateId) && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {candidate.strengths && candidate.strengths.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-success mb-2 inline-flex items-center gap-1 text-sm">
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Strengths
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-5">
                        {candidate.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.gaps && candidate.gaps.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-warning mb-2 inline-flex items-center gap-1 text-sm">
                        <AlertTriangle className="h-4 w-4" aria-hidden />
                        Areas to Explore
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-5">
                        {candidate.gaps.map((gap, idx) => (
                          <li key={idx}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
