"use client"

import { useEffect, useState } from "react"

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
  type: "ipo" | "cutting_edge"
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
      console.log("[TechTrends] Fetching trends from /api/trends", forceRefresh ? "(force refresh)" : "")
      const url = forceRefresh ? "/api/trends?refresh=true" : "/api/trends"
      const response = await fetch(url, {
        cache: forceRefresh ? "no-store" : "default",
      })
      
      console.log("[TechTrends] Response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[TechTrends] API error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch trends`)
      }
      
      const data: TrendsResponse = await response.json()
      console.log("[TechTrends] Received data:", {
        itemsCount: data.items?.length || 0,
        lastUpdated: data.last_updated,
        cached: data.cached,
        stale: data.stale,
      })
      
      // Always update trends if we got data, even if stale
      if (data.items && data.items.length > 0) {
        setTrends(data.items)
        setError(null)
      } else if (trends.length === 0) {
        // Only show error if we don't have any trends cached
        setError("No trends available")
      }
    } catch (err: any) {
      console.error("[TechTrends] Failed to fetch trends:", err)
      // Don't clear existing trends on error - keep showing what we have
      if (trends.length === 0) {
        setError(err.message || "Unable to load trends. Check console for details.")
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
      console.log("[TechTrends] Fetching startups from /api/startups", forceRefresh ? "(force refresh)" : "")
      const url = forceRefresh ? "/api/startups?refresh=true" : "/api/startups"
      const response = await fetch(url, {
        cache: forceRefresh ? "no-store" : "default",
      })
      
      console.log("[TechTrends] Startups response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[TechTrends] Startups API error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch startups`)
      }
      
      const data: StartupsResponse = await response.json()
      console.log("[TechTrends] Received startups data:", {
        itemsCount: data.items?.length || 0,
        lastUpdated: data.last_updated,
        cached: data.cached,
      })
      
      if (data.items && data.items.length > 0) {
        setStartups(data.items)
        setStartupsError(null)
      } else if (startups.length === 0) {
        setStartupsError("No startups available")
      }
    } catch (err: any) {
      console.error("[TechTrends] Failed to fetch startups:", err)
      if (startups.length === 0) {
        setStartupsError(err.message || "Unable to load startups. Check console for details.")
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      startups: "bg-blue-100 text-blue-800",
      software_engineering: "bg-green-100 text-green-800",
      ai: "bg-purple-100 text-purple-800",
      engineering: "bg-orange-100 text-orange-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      startups: "Startups",
      software_engineering: "Engineering",
      ai: "AI",
      engineering: "Engineering",
    }
    return labels[category] || category
  }

  const renderTrendsContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <>
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:underline"
          >
            Refresh page
          </button>
        </>
      )
    }

    if (trends.length === 0 && !loading) {
      return (
        <p className="text-sm text-gray-600">
          No trends available at the moment. Check back soon!
        </p>
      )
    }

    return (
      <>
        <div className="space-y-4">
          {trends.slice(0, 5).map((trend, idx) => (
            <div
              key={idx}
              className="group p-4 rounded-xl bg-surface-secondary/50 hover:bg-surface-tertiary transition-all duration-200 border border-transparent hover:border-surface-tertiary/50"
            >
              <a
                href={trend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="text-sm font-semibold text-content-primary line-clamp-2 group-hover:text-primary-600 transition-colors leading-relaxed">
                    {trend.title}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${getCategoryColor(
                      trend.category
                    )}`}
                  >
                    {getCategoryLabel(trend.category)}
                  </span>
                </div>

                {trend.highlight && (
                  <p className="text-xs text-content-secondary line-clamp-2 mb-3 leading-relaxed">
                    {trend.highlight}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-content-tertiary font-medium">{trend.source}</span>
                    <span className="text-xs text-content-tertiary">•</span>
                    <span className="text-xs text-content-tertiary">
                      {formatTimeAgo(trend.published_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-content-tertiary group-hover:text-primary-600 transition-colors">
                    <span className="text-xs">Read more</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
        
        {trends.length > 5 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Showing top 5 of {trends.length} trends
            </p>
          </div>
        )}
      </>
    )
  }

  const renderStartupsContent = () => {
    if (loadingStartups) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    if (startupsError) {
      return (
        <>
          <p className="text-sm text-red-600 mb-2">{startupsError}</p>
          <button
            onClick={() => {
              setRefreshing(true)
              fetchStartups(true)
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Try again
          </button>
        </>
      )
    }

    if (startups.length === 0 && !loadingStartups) {
      return (
        <p className="text-sm text-gray-600">
          No startups available at the moment. Check back soon!
        </p>
      )
    }

    return (
      <>
        <div className="space-y-4">
          {startups.slice(0, 5).map((startup, idx) => {
            const companyUrl = startup.website
              ? (startup.website.startsWith('http') ? startup.website : `https://${startup.website}`)
              : startup.url

            return (
              <div
                key={idx}
                className="group p-4 rounded-xl bg-surface-secondary/50 hover:bg-surface-tertiary transition-all duration-200 border border-transparent hover:border-surface-tertiary/50"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {companyUrl ? (
                      <a
                        href={companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h4 className="text-sm font-semibold text-content-primary line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {startup.name}
                        </h4>
                      </a>
                    ) : (
                      <h4 className="text-sm font-semibold text-content-primary line-clamp-1">
                        {startup.name}
                      </h4>
                    )}
                    {startup.industry && (
                      <span className="text-xs text-accent-purple-600 font-medium mt-1 inline-block px-2 py-1 bg-accent-purple-100 rounded-full">
                        {startup.industry}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                      startup.type === "ipo"
                        ? "bg-success-100 text-success-700"
                        : "bg-accent-teal-100 text-accent-teal-700"
                    }`}
                  >
                    {startup.type === "ipo" ? "🚀 IPO" : "⚡ Cutting Edge"}
                  </span>
                </div>

                {startup.usp && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-content-primary mb-1 uppercase tracking-wide">Unique Value Proposition</p>
                    <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">
                      {startup.usp}
                    </p>
                  </div>
                )}

                {startup.highlight && (
                  <p className="text-xs text-content-secondary line-clamp-2 mb-3 leading-relaxed">
                    {startup.highlight}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {(startup.valuation || startup.funding) && (
                      <span className="text-xs font-semibold text-success-600 bg-success-100 px-2 py-1 rounded-full">
                        {startup.valuation || startup.funding}
                      </span>
                    )}
                    {startup.source && (
                      <span className="text-xs text-content-tertiary">{startup.source}</span>
                    )}
                    {startup.published_at && (
                      <span className="text-xs text-content-tertiary">
                        {formatTimeAgo(startup.published_at)}
                      </span>
                    )}
                  </div>
                  {companyUrl && (
                    <div className="flex items-center gap-1 text-content-tertiary group-hover:text-primary-600 transition-colors">
                      <span className="text-xs">Visit site</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {startups.length > 5 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Showing top 5 of {startups.length} companies
            </p>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="glass-elevated rounded-2xl border border-surface-tertiary/50 p-6 shadow-elevation-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 border-b border-surface-tertiary -mb-6 flex-1">
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 rounded-t-lg ${
              activeTab === "trends"
                ? "border-primary-500 text-primary-600 bg-primary-50/50"
                : "border-transparent text-content-secondary hover:text-content-primary hover:bg-surface-secondary/50"
            }`}
          >
            🚀 Tech Trends
          </button>
          <button
            onClick={() => setActiveTab("startups")}
            className={`px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 rounded-t-lg ${
              activeTab === "startups"
                ? "border-primary-500 text-primary-600 bg-primary-50/50"
                : "border-transparent text-content-secondary hover:text-content-primary hover:bg-surface-secondary/50"
            }`}
          >
            💡 Startups
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true)
              if (activeTab === "trends") {
                fetchTrends(true)
              } else {
                fetchStartups(true)
              }
            }}
            disabled={refreshing}
            className="p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
            title={`Refresh ${activeTab === "trends" ? "trends" : "startups"}`}
          >
            {refreshing ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            {activeTab === "trends" ? "Tech Trends" : "Startups to Watch"}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true)
                if (activeTab === "trends") {
                  fetchTrends(true)
                } else {
                  fetchStartups(true)
                }
              }}
              disabled={refreshing}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Refresh ${activeTab === "trends" ? "trends" : "startups"}`}
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh"}
            </button>
            {activeTab === "trends" && trends.length > 0 && (
              <span className="text-xs text-gray-500">
                {formatTimeAgo(trends[0]?.published_at)}
              </span>
            )}
            {activeTab === "startups" && startups.length > 0 && (
              <span className="text-xs text-gray-500">
                {formatTimeAgo(startups[0]?.published_at)}
              </span>
            )}
          </div>
        </div>
        
        {activeTab === "trends" ? renderTrendsContent() : renderStartupsContent()}
      </div>
    </div>
  )
}

