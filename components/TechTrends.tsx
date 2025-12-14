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
        <div className="text-center py-8">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:underline"
          >
            Refresh page
          </button>
        </div>
      )
    }

    if (trends.length === 0 && !loading) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">
            No trends available at the moment. Check back soon!
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {trends.slice(0, 5).map((trend, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <a
              href={trend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h4 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
                  {trend.title}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  trend.category === "ai"
                    ? "bg-purple-100 text-purple-800"
                    : trend.category === "software_engineering"
                    ? "bg-blue-100 text-blue-800"
                    : trend.category === "startups"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {getCategoryLabel(trend.category)}
                </span>
              </div>

              {trend.highlight && (
                <div className="mb-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700 line-clamp-2 italic">
                    "{trend.highlight}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>{trend.source}</span>
                  <span>{formatTimeAgo(trend.published_at)}</span>
                </div>
                <span className="text-blue-600 font-medium">Read more →</span>
              </div>
            </a>
          </div>
        ))}

        {trends.length > 5 && (
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing top 5 of {trends.length} trends
            </p>
          </div>
        )}
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
        <div className="text-center py-8">
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
        </div>
      )
    }

    if (startups.length === 0 && !loadingStartups) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">
            No startups available at the moment. Check back soon!
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {startups.slice(0, 5).map((startup, idx) => {
          const companyUrl = startup.website
            ? (startup.website.startsWith('http') ? startup.website : `https://${startup.website}`)
            : startup.url

          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  {companyUrl ? (
                    <a
                      href={companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h4 className="text-lg font-semibold text-gray-900 line-clamp-1 hover:text-purple-700 transition-colors">
                        {startup.name}
                      </h4>
                    </a>
                  ) : (
                    <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {startup.name}
                    </h4>
                  )}
                  {startup.industry && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        {startup.industry}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
                    startup.type === "ipo"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    <span>{startup.type === "ipo" ? "🚀" : "⚡"}</span>
                    <span>{startup.type === "ipo" ? "IPO Ready" : "Cutting Edge"}</span>
                  </span>
                  {(startup.funding || startup.valuation) && (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      {startup.funding || startup.valuation}
                    </span>
                  )}
                </div>
              </div>

              {startup.usp && (
                <div className="mb-3 p-3 bg-purple-50 rounded-md">
                  <p className="text-xs font-semibold text-purple-800 mb-1 uppercase tracking-wide">Unique Value Proposition</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {startup.usp}
                  </p>
                </div>
              )}

              {startup.highlight && (
                <div className="mb-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700 line-clamp-2 italic">
                    "{startup.highlight}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  {startup.source && <span>{startup.source}</span>}
                  {startup.published_at && <span>{formatTimeAgo(startup.published_at)}</span>}
                </div>
                {companyUrl && (
                  <span className="text-purple-600 font-medium hover:text-purple-700 transition-colors">
                    Visit site →
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {startups.length > 5 && (
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing top 5 of {startups.length} companies
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab("trends")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "trends"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🚀</span>
                <span className="hidden sm:inline">Tech Trends</span>
                <span className="sm:hidden">Trends</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("startups")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "startups"
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>💡</span>
                <span className="hidden sm:inline">Startups</span>
                <span className="sm:hidden">Startups</span>
              </span>
            </button>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">
              {activeTab === "trends" && trends.length > 0 && formatTimeAgo(trends[0]?.published_at)}
              {activeTab === "startups" && startups.length > 0 && formatTimeAgo(startups[0]?.published_at)}
              {((activeTab === "trends" && trends.length === 0) || (activeTab === "startups" && startups.length === 0)) && "Live"}
            </span>

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
              className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              title={`Refresh ${activeTab === "trends" ? "trends" : "startups"}`}
            >
              {refreshing ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Section Title */}
        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-900">
            {activeTab === "trends" ? "🚀 Tech Trends" : "💡 Startups to Watch"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {activeTab === "trends"
              ? "Stay ahead with the latest technology trends and insights"
              : "Discover innovative startups shaping the future of tech"
            }
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === "trends" ? renderTrendsContent() : renderStartupsContent()}
      </div>
    </div>
  )
}

