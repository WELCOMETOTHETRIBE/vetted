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

type TaskType = "interview" | "resume" | "cover-letter"

export default function InterviewPrep({ jobId, jobTitle }: InterviewPrepProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [taskType, setTaskType] = useState<TaskType>("interview")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
  const [interviewData, setInterviewData] = useState<InterviewPrepData | null>(null)
  const [resumeData, setResumeData] = useState<any>(null)
  const [coverLetterData, setCoverLetterData] = useState<string | null>(null)
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
    setResumeData(null)
    setCoverLetterData(null)

    try {
      let response: Response
      let data: any

      if (taskType === "interview") {
        response = await fetch(`/api/jobs/${jobId}/interview-prep`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: selectedCandidate.id }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate interview prep")
        }
        data = await response.json()
        setInterviewData(data)
      } else if (taskType === "resume") {
        response = await fetch(`/api/jobs/${jobId}/resume-update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: selectedCandidate.id }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate resume updates")
        }
        data = await response.json()
        setResumeData(data)
      } else if (taskType === "cover-letter") {
        response = await fetch(`/api/jobs/${jobId}/cover-letter-candidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: selectedCandidate.id }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate cover letter")
        }
        data = await response.json()
        setCoverLetterData(data.coverLetter)
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while generating ${taskType === "interview" ? "interview prep" : taskType === "resume" ? "resume updates" : "cover letter"}`)
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
    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl border-2 border-warning/40 shadow-lg overflow-hidden">
      <div className="bg-card/70 backdrop-blur-sm border-b border-warning/40 px-6 py-5">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-warning">🎯</span>
          Interview Preparation
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Select a candidate to generate tailored interview questions and insights for {jobTitle}
        </p>
      </div>

      <div className="px-6 py-6">
        {/* Candidate Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-foreground mb-2">
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
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
              {selectedCandidate && (
                <button
                  onClick={() => {
                    setSelectedCandidate(null)
                    setSearchQuery("")
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {isLoadingCandidates ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-2 text-sm">Loading candidates...</p>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
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
                      className="w-full px-4 py-3 text-left hover:bg-warning/10 transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="font-medium text-foreground">{candidate.fullName}</div>
                      {(candidate.jobTitle || candidate.currentCompany) && (
                        <div className="text-sm text-muted-foreground mt-1">
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

        {/* Task Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Select Task Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setTaskType("interview")
                setInterviewData(null)
                setResumeData(null)
                setCoverLetterData(null)
              }}
              className={`px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                taskType === "interview"
                  ? "bg-warning text-white border-orange-600 shadow-md"
                  : "bg-card text-foreground border-border hover:border-warning/40 hover:bg-warning/10"
              }`}
            >
              🎯 Interview Prep
            </button>
            <button
              onClick={() => {
                setTaskType("resume")
                setInterviewData(null)
                setResumeData(null)
                setCoverLetterData(null)
              }}
              className={`px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                taskType === "resume"
                  ? "bg-primary text-white border-blue-600 shadow-md"
                  : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/10"
              }`}
            >
              📄 Resume Updates
            </button>
            <button
              onClick={() => {
                setTaskType("cover-letter")
                setInterviewData(null)
                setResumeData(null)
                setCoverLetterData(null)
              }}
              className={`px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                taskType === "cover-letter"
                  ? "bg-green-600 text-white border-green-600 shadow-md"
                  : "bg-card text-foreground border-border hover:border-green-300 hover:bg-success/10"
              }`}
            >
              ✉️ Cover Letter
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedCandidate || isLoading}
          className={`w-full px-6 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm ${
            taskType === "interview"
              ? "bg-warning hover:bg-warning/90"
              : taskType === "resume"
              ? "bg-primary hover:bg-primary/90"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating {taskType === "interview" ? "Interview Prep" : taskType === "resume" ? "Resume Updates" : "Cover Letter"}...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate {taskType === "interview" ? "Interview Prep" : taskType === "resume" ? "Resume Updates" : "Cover Letter"}
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Resume Updates Results */}
        {resumeData && taskType === "resume" && (
          <div className="mt-6 space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary">📄</span>
                Resume Updates & Modifications for {selectedCandidate?.fullName}
              </h3>
              <div className="prose max-w-none">
                {resumeData.suggestions && resumeData.suggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3">Suggested Updates</h4>
                    <ul className="space-y-2">
                      {resumeData.suggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                          <p className="text-foreground leading-relaxed">{suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {resumeData.updatedSections && (
                  <div className="space-y-4">
                    {Object.entries(resumeData.updatedSections).map(([section, content]: [string, any]) => (
                      <div key={section} className="border-t border-border pt-4">
                        <h4 className="font-semibold text-foreground mb-2 capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <div className="text-foreground whitespace-pre-wrap">{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {resumeData.summary && (
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Summary</h4>
                    <p className="text-foreground">{resumeData.summary}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cover Letter Results */}
        {coverLetterData && taskType === "cover-letter" && (
          <div className="mt-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-success">✉️</span>
                  Cover Letter for {selectedCandidate?.fullName}
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetterData)
                    alert("Cover letter copied to clipboard!")
                  }}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed p-4 bg-secondary/40 rounded-lg border border-border">
                  {coverLetterData}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Prep Results */}
        {interviewData && taskType === "interview" && (
          <div className="mt-6 space-y-6">
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-foreground">Interview Prep for {interviewData.candidateName}</h3>
                <span className="text-sm text-muted-foreground">{interviewData.companyName}</span>
              </div>
              <p className="text-sm text-muted-foreground">Position: {interviewData.jobTitle}</p>
            </div>

            {/* Questions */}
            {interviewData.questions && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-primary">❓</span>
                  Interview Questions
                </h4>
                <div className="space-y-6">
                  {interviewData.questions.technical && interviewData.questions.technical.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="text-blue-500">💻</span>
                        Technical Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.technical.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.questions.behavioral && interviewData.questions.behavioral.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="text-purple-500">🧠</span>
                        Behavioral Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.behavioral.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-purple-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.questions.roleSpecific && interviewData.questions.roleSpecific.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="text-green-500">🎯</span>
                        Role-Specific Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.roleSpecific.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-green-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.questions.general && interviewData.questions.general.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="text-muted-foreground">💬</span>
                        General Questions
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.questions.general.map((q, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-muted-foreground mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{q}</p>
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
              <div className="bg-card rounded-lg border border-border p-6">
                <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-primary">💡</span>
                  Interview Insights
                </h4>
                <div className="space-y-6">
                  {interviewData.insights.candidateStrengths && interviewData.insights.candidateStrengths.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <span className="text-success">✅</span>
                        Candidate Strengths
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.candidateStrengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-green-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{strength}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.insights.areasToExplore && interviewData.insights.areasToExplore.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <span className="text-primary">🔍</span>
                        Areas to Explore
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.areasToExplore.map((area, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{area}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.insights.redFlags && interviewData.insights.redFlags.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <span className="text-destructive">⚠️</span>
                        Red Flags
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.redFlags.map((flag, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-red-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{flag}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interviewData.insights.talkingPoints && interviewData.insights.talkingPoints.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <span className="text-primary">💬</span>
                        Talking Points
                      </h5>
                      <ul className="space-y-2">
                        {interviewData.insights.talkingPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-purple-500 mt-1.5 flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{point}</p>
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
                            <p className="text-foreground leading-relaxed">{assessment}</p>
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
