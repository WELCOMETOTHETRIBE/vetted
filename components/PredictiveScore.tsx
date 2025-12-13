"use client"

import { useState, useEffect } from "react"

interface PredictiveScoreProps {
  candidateId: string
  jobId?: string
  onScoreCalculated?: (score: number) => void
}

interface Job {
  id: string
  title: string
  company: {
    name: string
  }
}

interface ScoreResult {
  score: number
  confidence: "HIGH" | "MEDIUM" | "LOW"
  riskFactors: string[]
  reasoning: string
  strengths: string[]
  concerns: string[]
  jobTitle?: string
  companyName?: string
}

export default function PredictiveScore({
  candidateId,
  jobId,
  onScoreCalculated,
}: PredictiveScoreProps) {
  const [loading, setLoading] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || "")
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const calculateScore = async () => {
    if (!selectedJobId) {
      setError("Please select a job")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/candidates/${candidateId}/predictive-score`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: selectedJobId }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to calculate score")
      }

      const data = await response.json()
      setScoreResult({
        score: data.score,
        confidence: data.confidence,
        riskFactors: data.riskFactors || [],
        reasoning: data.reasoning,
        strengths: data.strengths || [],
        concerns: data.concerns || [],
        jobTitle: data.jobTitle,
        companyName: data.companyName,
      })

      if (onScoreCalculated) {
        onScoreCalculated(data.score)
      }
    } catch (err: any) {
      setError(err.message || "Failed to calculate predictive score")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 bg-green-50 border-green-200"
    if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200"
    if (score >= 40) return "text-yellow-700 bg-yellow-50 border-yellow-200"
    return "text-red-700 bg-red-50 border-red-200"
  }

  const getConfidenceColor = (confidence: string) => {
    if (confidence === "HIGH") return "text-green-700 bg-green-100"
    if (confidence === "MEDIUM") return "text-blue-700 bg-blue-100"
    return "text-yellow-700 bg-yellow-100"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Exceptional Fit"
    if (score >= 75) return "Strong Fit"
    if (score >= 65) return "Good Fit"
    if (score >= 50) return "Moderate Fit"
    return "Weak Fit"
  }

  // Load jobs on mount
  useEffect(() => {
    const loadJobs = async () => {
      setLoadingJobs(true)
      try {
        const response = await fetch("/api/jobs?limit=100")
        if (response.ok) {
          const data = await response.json()
          setJobs(data.jobs || [])
        }
      } catch (err) {
        console.error("Error loading jobs:", err)
      } finally {
        setLoadingJobs(false)
      }
    }
    loadJobs()
  }, [])

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Predictive Success Score
          </h3>
          <p className="text-sm text-gray-600">
            Predicts candidate success probability in a specific role
          </p>
        </div>
      </div>

      {!scoreResult && (
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Job or Enter Job ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery || selectedJobId}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)
                  setShowSuggestions(true)
                  
                  // If it looks like a job ID (long alphanumeric), set it directly
                  if (value.length > 20 && /^[a-z0-9]+$/i.test(value)) {
                    setSelectedJobId(value)
                    setSearchQuery("")
                    setShowSuggestions(false)
                  } else {
                    // Search in jobs
                    const matchingJob = jobs.find(
                      (job) => job.id === value || 
                      job.title.toLowerCase().includes(value.toLowerCase()) ||
                      job.company.name.toLowerCase().includes(value.toLowerCase())
                    )
                    if (matchingJob) {
                      setSelectedJobId(matchingJob.id)
                    }
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type job title, company, or paste Job ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
              {showSuggestions && searchQuery && jobs.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {jobs
                    .filter(
                      (job) =>
                        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        job.id.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          setSelectedJobId(job.id)
                          setSearchQuery(`${job.title} @ ${job.company.name}`)
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-xs text-gray-500">{job.company.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">{job.id.substring(0, 12)}...</div>
                      </button>
                    ))}
                </div>
              )}
            </div>
            {selectedJobId && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-600">Selected Job ID:</span>
                <span className="text-xs font-mono bg-purple-100 px-2 py-1 rounded border border-purple-200 text-purple-700">
                  {selectedJobId.substring(0, 12)}...
                </span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              💡 Paste a Job ID or search by job title/company name
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={calculateScore}
            disabled={loading || !selectedJobId}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Calculating...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Calculate Score
              </>
            )}
          </button>
        </div>
      )}

      {scoreResult && (
        <div className="space-y-4">
          {/* Score Display */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                {scoreResult.jobTitle && (
                  <h4 className="text-lg font-semibold text-gray-900">
                    {scoreResult.jobTitle}
                  </h4>
                )}
                {scoreResult.companyName && (
                  <p className="text-sm text-gray-600">
                    {scoreResult.companyName}
                  </p>
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg border-2 font-bold text-2xl ${getScoreColor(
                  scoreResult.score
                )}`}
              >
                {scoreResult.score}%
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">
                {getScoreLabel(scoreResult.score)}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(
                  scoreResult.confidence
                )}`}
              >
                {scoreResult.confidence} Confidence
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-4">{scoreResult.reasoning}</p>

            {/* Strengths */}
            {scoreResult.strengths && scoreResult.strengths.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <span>✅</span>
                  <span>Success Predictors</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                  {scoreResult.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {scoreResult.riskFactors && scoreResult.riskFactors.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Risk Factors</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                  {scoreResult.riskFactors.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {scoreResult.concerns && scoreResult.concerns.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1">
                  <span>📋</span>
                  <span>Areas to Explore</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-5">
                  {scoreResult.concerns.map((concern, idx) => (
                    <li key={idx}>{concern}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setScoreResult(null)
              setError(null)
            }}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            Calculate for Different Job
          </button>
        </div>
      )}
    </div>
  )
}

