"use client"

import { useEffect, useState } from "react"

interface SkillGap {
  skill: string
  requiredCount: number
  availableCount: number
  gap: number
  gapPercentage: number
  severity: "critical" | "high" | "moderate" | "low"
  averageSalary: number
  jobCount: number
  candidateCount: number
}

interface UpskillingOpportunity {
  skill: string
  currentDemand: number
  projectedGrowth: number
  averageSalary: number
  learningResources: string[]
  estimatedTimeToLearn: string
  priority: "high" | "medium" | "low"
}

interface SkillsGapAnalysis {
  skillGaps: SkillGap[]
  upskillingOpportunities: UpskillingOpportunity[]
  overallGapScore: number
  lastUpdated: string
}

export default function SkillsGapAnalysis() {
  const [data, setData] = useState<SkillsGapAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"gaps" | "upskilling">("gaps")
  const [filterSeverity, setFilterSeverity] = useState<
    "all" | "critical" | "high" | "moderate" | "low"
  >("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/skills/gap-analysis")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch skills gap analysis`)
      }
      const analysis = await response.json()
      setData(analysis)
    } catch (err: any) {
      console.error("[SkillsGapAnalysis] Error:", err)
      setError(err.message || "Failed to load skills gap analysis")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getGapScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600"
    if (score >= 50) return "text-orange-600"
    if (score >= 30) return "text-yellow-600"
    return "text-green-600"
  }

  const filteredGaps =
    data && filterSeverity !== "all"
      ? data.skillGaps.filter((gap) => gap.severity === filterSeverity)
      : data?.skillGaps || []

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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills Gap Analysis</h3>
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
          <h3 className="text-xl font-semibold text-gray-900">Skills Gap Analysis</h3>
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

      {/* Overall Gap Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Gap Score</p>
            <p className={`text-3xl font-bold ${getGapScoreColor(data.overallGapScore)}`}>
              {data.overallGapScore}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.overallGapScore >= 70
                ? "Critical gaps detected - urgent action needed"
                : data.overallGapScore >= 50
                  ? "Significant gaps - consider upskilling"
                  : data.overallGapScore >= 30
                    ? "Moderate gaps - monitor closely"
                    : "Low gaps - good skill coverage"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Skills Analyzed</p>
            <p className="text-2xl font-semibold text-gray-900">{data.skillGaps.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("gaps")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "gaps"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Skill Gaps ({data.skillGaps.length})
        </button>
        <button
          onClick={() => setActiveTab("upskilling")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "upskilling"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Upskilling Opportunities ({data.upskillingOpportunities.length})
        </button>
      </div>

      {/* Skill Gaps Tab */}
      {activeTab === "gaps" && (
        <div>
          {/* Filter by Severity */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter by severity:</span>
            {(["all", "critical", "high", "moderate", "low"] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                  filterSeverity === severity
                    ? getSeverityColor(severity)
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredGaps.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No gaps found for selected filter.</p>
            ) : (
              filteredGaps.slice(0, 20).map((gap, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{gap.skill}</h4>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Required: <strong className="text-gray-900">{gap.requiredCount}</strong>
                        </span>
                        <span>
                          Available: <strong className="text-gray-900">{gap.availableCount}</strong>
                        </span>
                        <span>
                          Gap: <strong className="text-red-600">{gap.gap}</strong>
                        </span>
                        <span>
                          Gap %: <strong className="text-red-600">{gap.gapPercentage}%</strong>
                        </span>
                      </div>
                      {gap.averageSalary > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Avg Salary: {formatCurrency(gap.averageSalary)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-lg border ${getSeverityColor(
                        gap.severity
                      )}`}
                    >
                      {gap.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>{gap.jobCount} jobs</span>
                    <span>•</span>
                    <span>{gap.candidateCount} candidates</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upskilling Opportunities Tab */}
      {activeTab === "upskilling" && (
        <div className="space-y-4">
          {data.upskillingOpportunities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upskilling opportunities identified.</p>
          ) : (
            data.upskillingOpportunities.map((opp, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{opp.skill}</h4>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Demand: <strong className="text-gray-900">{opp.currentDemand} jobs</strong>
                      </span>
                      {opp.averageSalary > 0 && (
                        <span>
                          Avg Salary:{" "}
                          <strong className="text-gray-900">
                            {formatCurrency(opp.averageSalary)}
                          </strong>
                        </span>
                      )}
                      <span>
                        Time to Learn:{" "}
                        <strong className="text-gray-900">{opp.estimatedTimeToLearn}</strong>
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      opp.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {opp.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Learning Resources:</p>
                  <div className="flex flex-wrap gap-2">
                    {opp.learningResources.map((resource, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

