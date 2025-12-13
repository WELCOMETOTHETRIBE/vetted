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
  url: string
  source: string
  published_at: string | null
  highlight: string
  type: "ipo" | "cutting_edge"
  valuation?: string
  funding?: string
  industry?: string
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
              className="group border-b border-gray-100 last:border-b-0 pb-3 last:pb-0"
            >
              <a
                href={trend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {trend.title}
                  </h4>
                </div>
                
                {trend.highlight && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {trend.highlight}
                  </p>
                )}
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{trend.source}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(trend.published_at)}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                      trend.category
                    )}`}
                  >
                    {getCategoryLabel(trend.category)}
                  </span>
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
          {startups.slice(0, 5).map((startup, idx) => (
            <div
              key={idx}
              className="group border-b border-gray-100 last:border-b-0 pb-3 last:pb-0"
            >
              <a
                href={startup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {startup.name}
                    </h4>
                    {startup.industry && (
                      <span className="text-xs text-purple-600 font-medium">
                        {startup.industry}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      startup.type === "ipo"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {startup.type === "ipo" ? "IPO" : "Cutting Edge"}
                  </span>
                </div>
                
                {startup.highlight && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2 mt-1">
                    {startup.highlight}
                  </p>
                )}
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{startup.source}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(startup.published_at)}
                    </span>
                  </div>
                  {(startup.valuation || startup.funding) && (
                    <span className="text-xs text-gray-600 font-medium">
                      {startup.valuation || startup.funding}
                    </span>
                  )}
                </div>
              </a>
            </div>
          ))}
        </div>
        
        {startups.length > 5 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Showing top 5 of {startups.length} startups
            </p>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 border-b border-gray-200 -mb-4 flex-1">
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "trends"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Tech Trends
          </button>
          <button
            onClick={() => setActiveTab("startups")}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "startups"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Startups
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            {activeTab === "trends" ? "Tech Trends" : "Startups to Invest In"}
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

