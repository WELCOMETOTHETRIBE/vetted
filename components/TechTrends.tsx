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
              className="group relative p-5 rounded-2xl bg-gradient-to-r from-white/80 to-white/40 hover:from-white/90 hover:to-white/60 transition-all duration-300 border border-surface-tertiary/30 hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary-500/10 backdrop-blur-sm transform hover:-translate-y-1"
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <a
                href={trend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative z-10"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h4 className="text-base font-bold text-content-primary line-clamp-2 group-hover:text-primary-700 transition-colors leading-snug flex-1">
                    {trend.title}
                  </h4>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0 shadow-sm ${
                        trend.category === "ai"
                          ? "bg-gradient-to-r from-accent-purple-100 to-accent-purple-200 text-accent-purple-700 border border-accent-purple-300"
                          : trend.category === "software_engineering"
                          ? "bg-gradient-to-r from-accent-teal-100 to-accent-teal-200 text-accent-teal-700 border border-accent-teal-300"
                          : trend.category === "startups"
                          ? "bg-gradient-to-r from-success-100 to-success-200 text-success-700 border border-success-300"
                          : "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 border border-primary-300"
                      }`}
                    >
                      {getCategoryLabel(trend.category)}
                    </span>
                  </div>
                </div>

                {trend.highlight && (
                  <div className="mb-4 p-3 bg-surface-secondary/40 rounded-lg border border-surface-tertiary/20">
                    <p className="text-sm text-content-secondary line-clamp-2 leading-relaxed italic">
                      "{trend.highlight}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-tertiary/30">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-content-tertiary rounded-full" />
                      <span className="text-xs font-medium text-content-secondary">{trend.source}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-content-secondary">
                        {formatTimeAgo(trend.published_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary-600 group-hover:text-primary-700 transition-colors font-semibold">
                    <span className="text-sm">Explore</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="group relative p-5 rounded-2xl bg-gradient-to-r from-white/80 to-white/40 hover:from-white/90 hover:to-white/60 transition-all duration-300 border border-surface-tertiary/30 hover:border-accent-purple-300/50 hover:shadow-lg hover:shadow-accent-purple-500/10 backdrop-blur-sm transform hover:-translate-y-1"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple-500/5 to-accent-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      {companyUrl ? (
                        <a
                          href={companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h4 className="text-lg font-bold text-content-primary line-clamp-1 group-hover:text-accent-purple-700 transition-colors">
                            {startup.name}
                          </h4>
                        </a>
                      ) : (
                        <h4 className="text-lg font-bold text-content-primary line-clamp-1">
                          {startup.name}
                        </h4>
                      )}
                      {startup.industry && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-accent-purple-100 to-accent-purple-200 text-accent-purple-700 border border-accent-purple-300 rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 bg-accent-purple-500 rounded-full animate-pulse" />
                            {startup.industry}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full font-bold shadow-sm ${
                          startup.type === "ipo"
                            ? "bg-gradient-to-r from-success-100 to-success-200 text-success-700 border border-success-300"
                            : "bg-gradient-to-r from-accent-teal-100 to-accent-teal-200 text-accent-teal-700 border border-accent-teal-300"
                        }`}
                      >
                        <span className="text-sm">{startup.type === "ipo" ? "🚀" : "⚡"}</span>
                        <span>{startup.type === "ipo" ? "IPO Ready" : "Cutting Edge"}</span>
                      </span>
                      {(startup.funding || startup.valuation) && (
                        <span className="text-xs font-semibold text-success-600 bg-success-50 px-2 py-1 rounded-full border border-success-200">
                          {startup.funding || startup.valuation}
                        </span>
                      )}
                    </div>
                  </div>

                  {startup.usp && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-accent-purple-50/50 to-accent-teal-50/50 rounded-xl border border-accent-purple-200/30">
                      <p className="text-xs font-bold text-accent-purple-700 mb-2 uppercase tracking-wider">Unique Value Proposition</p>
                      <p className="text-sm text-content-secondary line-clamp-2 leading-relaxed font-medium">
                        {startup.usp}
                      </p>
                    </div>
                  )}

                  {startup.highlight && (
                    <div className="mb-4 p-3 bg-surface-secondary/40 rounded-lg border border-surface-tertiary/20">
                      <p className="text-sm text-content-secondary line-clamp-2 leading-relaxed italic">
                        "{startup.highlight}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-tertiary/30">
                    <div className="flex items-center gap-4">
                      {startup.source && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-content-tertiary rounded-full" />
                          <span className="text-xs font-medium text-content-secondary">{startup.source}</span>
                        </div>
                      )}
                      {startup.published_at && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-accent-purple-400 rounded-full animate-pulse" />
                          <span className="text-xs font-medium text-content-secondary">
                            {formatTimeAgo(startup.published_at)}
                          </span>
                        </div>
                      )}
                    </div>
                    {companyUrl && (
                      <div className="flex items-center gap-2 text-accent-purple-600 group-hover:text-accent-purple-700 transition-colors font-semibold">
                        <span className="text-sm">Visit Site</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    )}
                  </div>
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-surface-primary to-surface-secondary shadow-xl border border-surface-tertiary/30 backdrop-blur-xl">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-accent-purple-500/5 to-accent-teal-500/5 animate-pulse opacity-50" />

      {/* Header with glassmorphism */}
      <div className="relative p-6 border-b border-surface-tertiary/20 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Tab Navigation with Modern Design */}
          <div className="flex p-1 bg-surface-secondary/50 rounded-xl border border-surface-tertiary/30">
            <button
              onClick={() => setActiveTab("trends")}
              className={`relative px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                activeTab === "trends"
                  ? "text-white shadow-lg transform scale-105"
                  : "text-content-secondary hover:text-content-primary hover:bg-white/50"
              }`}
              style={{
                background: activeTab === "trends"
                  ? "linear-gradient(135deg, hsl(var(--primary-500)), hsl(var(--primary-600)))"
                  : "transparent"
              }}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <span className="hidden sm:inline">Tech Trends</span>
                <span className="sm:hidden">Trends</span>
              </span>
              {activeTab === "trends" && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-bounce" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("startups")}
              className={`relative px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                activeTab === "startups"
                  ? "text-white shadow-lg transform scale-105"
                  : "text-content-secondary hover:text-content-primary hover:bg-white/50"
              }`}
              style={{
                background: activeTab === "startups"
                  ? "linear-gradient(135deg, hsl(var(--accent-purple-500)), hsl(var(--accent-purple-600)))"
                  : "transparent"
              }}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <span className="hidden sm:inline">Startups</span>
                <span className="sm:hidden">Startups</span>
              </span>
              {activeTab === "startups" && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-bounce" />
              )}
            </button>
          </div>

          {/* Refresh Button with Modern Design */}
          <div className="flex items-center gap-3">
            {/* Last Updated Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-surface-secondary/70 rounded-lg border border-surface-tertiary/30">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <span className="text-xs text-content-secondary font-medium">
                {activeTab === "trends" && trends.length > 0 && formatTimeAgo(trends[0]?.published_at)}
                {activeTab === "startups" && startups.length > 0 && formatTimeAgo(startups[0]?.published_at)}
                {((activeTab === "trends" && trends.length === 0) || (activeTab === "startups" && startups.length === 0)) && "Live"}
              </span>
            </div>

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
              className="group relative p-3 rounded-xl bg-white/70 hover:bg-white border border-surface-tertiary/30 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              title={`Refresh ${activeTab === "trends" ? "trends" : "startups"}`}
            >
              {refreshing ? (
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-primary-600 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Section Title with Animation */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-content-primary to-primary-600 bg-clip-text text-transparent">
            {activeTab === "trends" ? "🚀 Tech Trends" : "💡 Startups to Watch"}
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            {activeTab === "trends"
              ? "Stay ahead with the latest technology trends and insights"
              : "Discover innovative startups shaping the future of tech"
            }
          </p>
        </div>
      </div>

      {/* Content Area with Glassmorphism */}
      <div className="relative p-6 bg-white/40 backdrop-blur-sm">
        {activeTab === "trends" ? renderTrendsContent() : renderStartupsContent()}
      </div>
    </div>
  )
}

