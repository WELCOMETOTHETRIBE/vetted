"use client"

import { useEffect, useState } from "react"

interface SalaryInsight {
  role: string
  location: string
  averageSalary: number
  minSalary: number
  maxSalary: number
  currency: string
  jobCount: number
  trend: "increasing" | "decreasing" | "stable"
}

interface SkillDemandTrend {
  skill: string
  demandCount: number
  growthRate: number
  averageSalary: number
  jobCount: number
  trend: "hot" | "growing" | "stable" | "declining"
}

interface CompetitorInsight {
  company: string
  candidateCount: number
  averageTenure: number
  topRoles: Array<{ role: string; count: number }>
  movementTrend: "gaining" | "losing" | "stable"
}

interface SupplyDemandRatio {
  role: string
  candidateCount: number
  jobCount: number
  ratio: number
  status: "oversupplied" | "balanced" | "undersupplied"
}

interface MarketIntelligence {
  salaryInsights: SalaryInsight[]
  skillDemandTrends: SkillDemandTrend[]
  competitorInsights: CompetitorInsight[]
  supplyDemandRatios: SupplyDemandRatio[]
  lastUpdated: string
}

export default function MarketIntelligence() {
  const [data, setData] = useState<MarketIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"salary" | "skills" | "competitors" | "supply">(
    "salary"
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/market/intelligence")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch market intelligence`)
      }
      const intelligence = await response.json()
      setData(intelligence)
    } catch (err: any) {
      console.error("[MarketIntelligence] Error:", err)
      setError(err.message || "Failed to load market intelligence")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
      case "hot":
      case "growing":
        return "📈"
      case "decreasing":
      case "declining":
        return "📉"
      default:
        return "➡️"
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
      case "hot":
      case "growing":
        return "text-green-600"
      case "decreasing":
      case "declining":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Intelligence</h3>
        <p className="text-sm text-red-600 mb-4">{error || "No data available"}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Market Intelligence</h3>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {[
          { id: "salary", label: "💰 Salary Insights", count: data.salaryInsights.length },
          { id: "skills", label: "🔥 Skills Trends", count: data.skillDemandTrends.length },
          { id: "competitors", label: "🏢 Competitors", count: data.competitorInsights.length },
          { id: "supply", label: "⚖️ Supply/Demand", count: data.supplyDemandRatios.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Salary Insights */}
      {activeTab === "salary" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {data.salaryInsights.slice(0, 10).map((insight, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{insight.role}</h4>
                    <p className="text-sm text-gray-600">{insight.location}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-gray-700">
                        Avg: {formatCurrency(insight.averageSalary, insight.currency)}
                      </span>
                      <span className="text-gray-500">
                        Range: {formatCurrency(insight.minSalary, insight.currency)} -{" "}
                        {formatCurrency(insight.maxSalary, insight.currency)}
                      </span>
                      <span className="text-gray-500">{insight.jobCount} jobs</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${getTrendColor(insight.trend)}`}>
                    <span>{getTrendIcon(insight.trend)}</span>
                    <span className="text-xs capitalize">{insight.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Trends */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {data.skillDemandTrends.slice(0, 15).map((trend, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{trend.skill}</h4>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-gray-700">{trend.demandCount} mentions</span>
                      {trend.averageSalary > 0 && (
                        <span className="text-gray-600">
                          Avg Salary: {formatCurrency(trend.averageSalary)}
                        </span>
                      )}
                      <span className="text-gray-500">{trend.jobCount} jobs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${getTrendColor(trend.trend)}`}>
                      <span>{getTrendIcon(trend.trend)}</span>
                      <span className="text-xs capitalize">{trend.trend}</span>
                    </div>
                    {trend.growthRate !== 0 && (
                      <span
                        className={`text-xs font-medium ${
                          trend.growthRate > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {trend.growthRate > 0 ? "+" : ""}
                        {trend.growthRate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Insights */}
      {activeTab === "competitors" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {data.competitorInsights.slice(0, 10).map((insight, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{insight.company}</h4>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>{insight.candidateCount} candidates</span>
                      {insight.averageTenure > 0 && (
                        <span>Avg Tenure: {insight.averageTenure.toFixed(1)} months</span>
                      )}
                    </div>
                    {insight.topRoles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {insight.topRoles.map((role, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                          >
                            {role.role} ({role.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${getTrendColor(insight.movementTrend)}`}>
                    <span>{getTrendIcon(insight.movementTrend)}</span>
                    <span className="text-xs capitalize">{insight.movementTrend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supply/Demand Ratios */}
      {activeTab === "supply" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {data.supplyDemandRatios.slice(0, 15).map((ratio, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{ratio.role}</h4>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-gray-700">{ratio.candidateCount} candidates</span>
                      <span className="text-gray-600">{ratio.jobCount} jobs</span>
                      <span className="text-gray-600">Ratio: {ratio.ratio.toFixed(1)}:1</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        ratio.status === "undersupplied"
                          ? "bg-red-100 text-red-700"
                          : ratio.status === "oversupplied"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {ratio.status === "undersupplied"
                        ? "⚠️ Undersupplied"
                        : ratio.status === "oversupplied"
                          ? "📊 Oversupplied"
                          : "✅ Balanced"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

