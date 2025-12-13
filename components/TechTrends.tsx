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
}

export default function TechTrends() {
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("[TechTrends] Fetching trends from /api/trends")
        const response = await fetch("/api/trends")
        
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
        })
        
        setTrends(data.items || [])
        setError(null)
      } catch (err: any) {
        console.error("[TechTrends] Failed to fetch trends:", err)
        setError(err.message || "Unable to load trends. Check console for details.")
        setTrends([])
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [])

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Tech Trends</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Tech Trends</h3>
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Tech Trends</h3>
        <p className="text-sm text-gray-600">
          No trends available at the moment. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Tech Trends</h3>
        <span className="text-xs text-gray-500">
          {formatTimeAgo(trends[0]?.published_at)}
        </span>
      </div>
      
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
    </div>
  )
}

