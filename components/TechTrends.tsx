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
      engineering: "bg-green-100 text-green-800", // Same color as software_engineering
      ai: "bg-purple-100 text-purple-800",
      innovation: "bg-indigo-100 text-indigo-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      startups: "Startups",
      software_engineering: "Engineering",
      engineering: "Engineering",
      ai: "AI",
      innovation: "Innovation",
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
        <div className="text-center py-6">
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      )
    }

    if (trends.length === 0 && !loading) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">No trends available</p>
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
            className="block group"
          >
            <div className="py-2 border-b border-gray-100 last:border-0 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 group-hover:text-gray-700">
                  {trend.title}
                </h4>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                  trend.category === "ai"
                    ? "bg-purple-50 text-purple-700"
                    : trend.category === "software_engineering" || trend.category === "engineering"
                    ? "bg-green-50 text-green-700"
                    : trend.category === "startups"
                    ? "bg-blue-50 text-blue-700"
                    : trend.category === "innovation"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-gray-50 text-gray-700"
                }`}>
                  {getCategoryLabel(trend.category)}
                </span>
              </div>
              {(trend.highlight || trend.raw_excerpt) && (
                <p className="text-xs text-gray-600 line-clamp-3 mt-1.5 mb-1.5 leading-relaxed">
                  {trend.highlight || trend.raw_excerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
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
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    if (startupsError) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-gray-600">{startupsError}</p>
        </div>
      )
    }

    if (startups.length === 0 && !loadingStartups) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">No startups available</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {startups.slice(0, 5).map((startup, idx) => {
          const companyUrl = startup.website
            ? (startup.website.startsWith('http') ? startup.website : `https://${startup.website}`)
            : startup.url

          return (
            <div key={idx} className="py-2 border-b border-gray-100 last:border-0">
              {companyUrl ? (
                <a
                  href={companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-gray-700">
                        {startup.name}
                      </h4>
                      {startup.industry && (
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          {startup.industry}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 flex items-center gap-1 ${
                      startup.type === "ipo"
                        ? "bg-green-100 text-green-800"
                        : startup.type === "cutting_edge"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      <span>{startup.type === "ipo" ? "🚀" : startup.type === "cutting_edge" ? "⚡" : "🦄"}</span>
                      <span>{startup.type === "ipo" ? "IPO Ready" : startup.type === "cutting_edge" ? "Cutting Edge" : "Unicorn"}</span>
                    </span>
                  </div>
                  {(startup.description || startup.highlight || startup.usp) && (
                    <p className="text-xs text-gray-600 line-clamp-3 mt-1.5 mb-1.5 leading-relaxed">
                      {startup.description || startup.highlight || startup.usp}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                    {startup.source && <span>{startup.source}</span>}
                    {startup.published_at && (
                      <>
                        {startup.source && <span>•</span>}
                        <span>{formatTimeAgo(startup.published_at)}</span>
                      </>
                    )}
                  </div>
                </a>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {startup.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                          startup.type === "ipo"
                            ? "bg-green-100 text-green-800"
                            : startup.type === "cutting_edge"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          <span>{startup.type === "ipo" ? "🚀" : startup.type === "cutting_edge" ? "⚡" : "🦄"}</span>
                          <span>{startup.type === "ipo" ? "IPO Ready" : startup.type === "cutting_edge" ? "Cutting Edge" : "Unicorn"}</span>
                        </span>
                        {startup.industry && (
                          <span className="text-xs text-gray-500">
                            {startup.industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(startup.highlight || startup.usp || startup.description) && (
                    <p className="text-xs text-gray-700 line-clamp-3 mt-2 mb-1.5 leading-relaxed font-medium">
                      {startup.highlight || startup.usp || startup.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                    {startup.source && <span>{startup.source}</span>}
                    {startup.published_at && (
                      <>
                        {startup.source && <span>•</span>}
                        <span>{formatTimeAgo(startup.published_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("trends")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeTab === "trends"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setActiveTab("startups")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeTab === "startups"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Startups
            </button>
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
            className="p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            {refreshing ? (
              <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === "trends" ? renderTrendsContent() : renderStartupsContent()}
      </div>
    </div>
  )
}

