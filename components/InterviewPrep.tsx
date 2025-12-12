"use client"

import { useState, useEffect, useRef } from "react"

interface Candidate {
  id: string
  fullName: string
  jobTitle: string | null
  currentCompany: string | null
}

interface InterviewQuestions {
  technical: string[]
  behavioral: string[]
  roleSpecific: string[]
  general: string[]
}

interface InterviewInsights {
  candidateStrengths: string[]
  areasToExplore: string[]
  redFlags: string[]
  talkingPoints: string[]
  recommendedAssessments: string[]
}

interface InterviewPrepData {
  jobId: string
  jobTitle: string
  companyName: string
  candidateId: string
  candidateName: string
  questions: InterviewQuestions
  insights: InterviewInsights
}

interface InterviewPrepProps {
  jobId: string
  jobTitle: string
}

export default function InterviewPrep({ jobId, jobTitle }: InterviewPrepProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
  const [interviewData, setInterviewData] = useState<InterviewPrepData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch candidates on component mount and when search query changes
  useEffect(() => {
    const fetchCandidates = async () => {
      if (searchQuery.length < 2 && !isDropdownOpen) return
      
      setIsLoadingCandidates(true)
      try {
        const response = await fetch(
          `/api/candidates?search=${encodeURIComponent(searchQuery)}&limit=20`
        )
        if (response.ok) {
          const data = await response.json()
          setCandidates(data.candidates || [])
        }
      } catch (err) {
        console.error("Error fetching candidates:", err)
      } finally {
        setIsLoadingCandidates(false)
      }
    }

    const debounceTimer = setTimeout(fetchCandidates, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, isDropdownOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleGenerate = async () => {
    if (!selectedCandidate) {
      setError("Please select a candidate")
      return
    }

    setIsLoading(true)
    setError(null)
    setInterviewData(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}/interview-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedCandidate.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate interview prep")
      }

      const data = await response.json()
      setInterviewData(data)
    } catch (err: any) {
      setError(err.message || "An error occurred while generating interview prep")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCandidates = candidates.filter((candidate) =>
    candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.currentCompany?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-lg overflow-hidden">
      <div className="bg-white/70 backdrop-blur-sm border-b border-orange-200 px-6 py-5">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-orange-600">🎯</span>
          Interview Preparation
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Select a candidate to generate tailored interview questions and insights for {jobTitle}
        </p>
      </div>

      <div className="px-6 py-6">
        {/* Candidate Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Select Candidate
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={selectedCandidate ? selectedCandidate.fullName : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setIsDropdownOpen(true)
                  if (selectedCandidate) {
                    setSelectedCandidate(null)
                  }
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search candidates by name, title, or company..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
              {selectedCandidate && (
                <button
                  onClick={() => {
                    setSelectedCandidate(null)
                    setSearchQuery("")
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {isLoadingCandidates ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-2 text-sm">Loading candidates...</p>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {searchQuery.length < 2 ? "Type at least 2 characters to search" : "No candidates found"}
                  </div>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => {
                        setSelectedCandidate(candidate)
                        setSearchQuery(candidate.fullName)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{candidate.fullName}</div>
                      {(candidate.jobTitle || candidate.currentCompany) && (
                        <div className="text-sm text-gray-600 mt-1">
                          {candidate.jobTitle && candidate.currentCompany
                            ? `${candidate.jobTitle} at ${candidate.currentCompany}`
                            : candidate.jobTitle || candidate.currentCompany}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedCandidate || isLoading}
          className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating Interview Prep...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Interview Prep
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Interview Prep Results */}
        {interviewData && (
          <div className="mt-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Interview Prep for {interviewData.candidateName}</h3>
                <span className="text-sm text-gray-600">{interviewData.companyName}</span>
              </div>
              <p className="text-sm text-gray-600">Position: {interviewData.jobTitle}</p>
            </div>

            {/* Questions */}
            {interviewData.questions && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-blue-600">❓</span>
                  Interview Questions
                </h4>
                <div className="space-y-6">
                  {interviewData.questions.technical && interviewData.questions.technical.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-blue-500">💻</span>
                        Technical Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.technical.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.questions.behavioral && interviewData.questions.behavioral.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-purple-500">🧠</span>
                        Behavioral Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.behavioral.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-purple-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.questions.roleSpecific && interviewData.questions.roleSpecific.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-green-500">🎯</span>
                        Role-Specific Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.roleSpecific.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-green-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.questions.general && interviewData.questions.general.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-gray-500">💬</span>
                        General Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.general.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-gray-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Insights */}
            {interviewData.insights && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-indigo-600">💡</span>
                  Interview Insights
                </h4>
                <div className="space-y-6">
                  {interviewData.insights.candidateStrengths && interviewData.insights.candidateStrengths.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <span className="text-green-600">✅</span>
                        Candidate Strengths
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.candidateStrengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-green-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{strength}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.insights.areasToExplore && interviewData.insights.areasToExplore.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <span className="text-blue-600">🔍</span>
                        Areas to Explore
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.areasToExplore.map((area, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{area}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.insights.redFlags && interviewData.insights.redFlags.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <span className="text-red-600">⚠️</span>
                        Red Flags
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.redFlags.map((flag, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-red-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{flag}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.insights.talkingPoints && interviewData.insights.talkingPoints.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <span className="text-purple-600">💬</span>
                        Talking Points
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.talkingPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-purple-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{point}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.insights.recommendedAssessments && interviewData.insights.recommendedAssessments.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <span className="text-amber-600">📊</span>
                        Recommended Assessments
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.recommendedAssessments.map((assessment, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-amber-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-gray-700 leading-relaxed">{assessment}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
