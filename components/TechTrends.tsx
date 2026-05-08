"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Loader2, Rocket, Zap, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TrendItem {
  title: string
  url: string
  source: string
  published_at: string | null
  highlight: string
  category: string
  raw_excerpt: string
}

interface TrendsResponse {
  items: TrendItem[]
  last_updated: string
  cached?: boolean
  stale?: boolean
  warning?: string
}

interface StartupItem {
  name: string
  description: string
  url?: string
  source?: string
  published_at: string | null
  highlight: string
  usp: string
  type: "ipo" | "cutting_edge" | "unicorn"
  valuation?: string
  funding?: string
  industry?: string
  website?: string
}

interface StartupsResponse {
  items: StartupItem[]
  last_updated: string
  cached?: boolean
  warning?: string
}

type TabType = "trends" | "startups"

const CATEGORY_LABEL: Record<string, string> = {
  startups: "Startups",
  software_engineering: "Engineering",
  engineering: "Engineering",
  ai: "AI",
  innovation: "Innovation",
}

export default function TechTrends() {
  const [activeTab, setActiveTab] = useState<TabType>("trends")
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [startups, setStartups] = useState<StartupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStartups, setLoadingStartups] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startupsError, setStartupsError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrends = async (forceRefresh = false) => {
    try {
      if (!refreshing) {
        setLoading(true)
      }
      setError(null)
      const url = forceRefresh ? "/api/trends?refresh=true" : "/api/trends"
      const response = await fetch(url, {
        cache: forceRefresh ? "no-store" : "default",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch trends`)
      }

      const data: TrendsResponse = await response.json()
      if (data.items && data.items.length > 0) {
        setTrends(data.items)
        setError(null)
      } else if (trends.length === 0) {
        setError("No trends available")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load trends."
      if (trends.length === 0) {
        setError(message)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchStartups = async (forceRefresh = false) => {
    try {
      if (!refreshing) {
        setLoadingStartups(true)
      }
      setStartupsError(null)
      const url = forceRefresh ? "/api/startups?refresh=true" : "/api/startups"
      const response = await fetch(url, {
        cache: forceRefresh ? "no-store" : "default",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch startups`)
      }

      const data: StartupsResponse = await response.json()
      if (data.items && data.items.length > 0) {
        setStartups(data.items)
        setStartupsError(null)
      } else if (startups.length === 0) {
        setStartupsError("No startups available")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load startups."
      if (startups.length === 0) {
        setStartupsError(message)
      }
    } finally {
      setLoadingStartups(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTrends()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === "startups" && startups.length === 0 && !loadingStartups) {
      fetchStartups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Recent"

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) return "Just now"
      if (diffInHours < 24) return `${diffInHours}h ago`

      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays}d ago`

      const diffInWeeks = Math.floor(diffInDays / 7)
      return `${diffInWeeks}w ago`
    } catch {
      return "Recent"
    }
  }

  const getCategoryLabel = (category: string) =>
    CATEGORY_LABEL[category] || category

  const renderTrendsContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-secondary rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )
    }

    if (trends.length === 0 && !loading) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No trends available</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {trends.slice(0, 5).map((trend, idx) => (
          <a
            key={idx}
            href={trend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="py-2 border-b border-border last:border-0 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                  {trend.title}
                </h4>
                <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                  {getCategoryLabel(trend.category)}
                </Badge>
              </div>
              {(trend.highlight || trend.raw_excerpt) && (
                <p className="text-xs text-muted-foreground line-clamp-3 mt-1.5 mb-1.5 leading-relaxed">
                  {trend.highlight || trend.raw_excerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{trend.source}</span>
                <span>•</span>
                <span>{formatTimeAgo(trend.published_at)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    )
  }

  const renderStartupsContent = () => {
    if (loadingStartups) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-secondary rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    if (startupsError) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">{startupsError}</p>
        </div>
      )
    }

    if (startups.length === 0 && !loadingStartups) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No startups available</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {startups.slice(0, 5).map((startup, idx) => {
          const companyUrl = startup.website
            ? (startup.website.startsWith("http") ? startup.website : `https://${startup.website}`)
            : startup.url

          const TypeIcon =
            startup.type === "ipo" ? Rocket : startup.type === "cutting_edge" ? Zap : Sparkles
          const typeLabel =
            startup.type === "ipo"
              ? "IPO Ready"
              : startup.type === "cutting_edge"
              ? "Cutting Edge"
              : "Unicorn"

          const body = (
            <>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {startup.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className="gap-1 text-[10px] border-primary/30 text-primary"
                    >
                      <TypeIcon className="h-3 w-3" aria-hidden />
                      {typeLabel}
                    </Badge>
                    {startup.industry && (
                      <span className="text-xs text-muted-foreground">{startup.industry}</span>
                    )}
                  </div>
                </div>
              </div>
              {(startup.highlight || startup.usp || startup.description) && (
                <p className="text-xs text-muted-foreground line-clamp-3 mt-2 mb-1.5 leading-relaxed">
                  {startup.highlight || startup.usp || startup.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                {startup.source && <span>{startup.source}</span>}
                {startup.published_at && (
                  <>
                    {startup.source && <span>•</span>}
                    <span>{formatTimeAgo(startup.published_at)}</span>
                  </>
                )}
              </div>
            </>
          )

          return (
            <div key={idx} className="py-2 border-b border-border last:border-0">
              {companyUrl ? (
                <a
                  href={companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {body}
                </a>
              ) : (
                <div className="group">{body}</div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div role="tablist" aria-label="Tech feed" className="flex gap-1">
            <button
              role="tab"
              onClick={() => setActiveTab("trends")}
              aria-selected={activeTab === "trends"}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "trends"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
              )}
            >
              Trends
            </button>
            <button
              role="tab"
              onClick={() => setActiveTab("startups")}
              aria-selected={activeTab === "startups"}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === "startups"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
              )}
            >
              Startups
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true)
              if (activeTab === "trends") {
                fetchTrends(true)
              } else {
                fetchStartups(true)
              }
            }}
            aria-label="Refresh feed"
            className="h-8 w-8"
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {activeTab === "trends" ? renderTrendsContent() : renderStartupsContent()}
      </CardContent>
    </Card>
  )
}
