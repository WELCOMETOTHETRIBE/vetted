"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Target, ExternalLink, Eye, Users, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface JobCardProps {
  job: {
    id: string
    title: string
    description?: string | null
    company: {
      id: string
      name: string
      slug: string
      logo?: string | null
    }
    location?: string | null
    isRemote: boolean
    isHybrid: boolean
    employmentType: string
    salaryMin?: number | null
    salaryMax?: number | null
    salaryCurrency?: string | null
    createdAt: Date
    views: number
    applications?: Array<{ id: string }>
    originalUrl?: string | null
  }
}

const JobCard = ({ job }: JobCardProps) => {
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [loadingMatch, setLoadingMatch] = useState(false)

  const loadMatchScore = async () => {
    setLoadingMatch(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/match`)
      if (response.ok) {
        const data = await response.json()
        setMatchScore(data.matchScore)
      }
    } catch {
      // Silently fail - match score is optional
    } finally {
      setLoadingMatch(false)
    }
  }

  const locationText = job.isRemote
    ? "Remote"
    : job.isHybrid
    ? `Hybrid • ${job.location || "Location TBD"}`
    : job.location || "Location TBD"

  const salaryText =
    job.salaryMin && job.salaryMax
      ? `${job.salaryCurrency || "$"}${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`
      : null

  const matchTier =
    matchScore === null
      ? null
      : matchScore >= 80
      ? "high"
      : matchScore >= 60
      ? "med"
      : matchScore >= 40
      ? "low"
      : "none"

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="transition-colors group hover:border-primary/40">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-md bg-secondary border border-border flex items-center justify-center flex-shrink-0 text-primary">
              <Building2 className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              {/*
               * Per brief §15 #1: link to /companies/{slug} not the deleted
               * singular /company/{slug} route.
               */}
              <Link
                href={`/companies/${job.company.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary/80 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {job.company.name}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {loadingMatch ? (
              <Badge variant="outline" className="gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                Analyzing…
              </Badge>
            ) : matchScore !== null ? (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5",
                  matchTier === "high" && "text-success border-success/40",
                  matchTier === "med" && "text-primary border-primary/40",
                  matchTier === "low" && "text-warning border-warning/40",
                  matchTier === "none" && "text-muted-foreground",
                )}
              >
                <Target className="h-3 w-3" aria-hidden />
                {matchScore}% Match
              </Badge>
            ) : (
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  loadMatchScore()
                }}
                size="sm"
                variant="outline"
                className="h-7 gap-1.5"
              >
                <Target className="h-3 w-3" aria-hidden />
                Check Match
              </Button>
            )}
            <Badge variant="outline">{locationText}</Badge>
            <Badge variant="outline">{job.employmentType.replace("_", " ")}</Badge>
            {salaryText && (
              <Badge variant="outline" className="text-success border-success/40">
                {salaryText}
              </Badge>
            )}
          </div>

          {job.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
              {job.description.length > 200
                ? `${job.description.substring(0, 200)}…`
                : job.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="font-mono inline-flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded">
                <span className="select-all">{job.id.slice(0, 8)}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" aria-hidden />
                {job.views || 0} views
              </span>
              {job.applications && job.applications.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden />
                  {job.applications.length}{" "}
                  {job.applications.length === 1 ? "applicant" : "applicants"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {job.originalUrl && (
                <a
                  href={job.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  Original Post
                </a>
              )}
              <span className="text-xs text-muted-foreground">
                Posted{" "}
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year:
                    new Date(job.createdAt).getFullYear() !== new Date().getFullYear()
                      ? "numeric"
                      : undefined,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default JobCard
