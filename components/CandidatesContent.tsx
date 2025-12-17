"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PredictiveScore from "./PredictiveScore"
import EngagementWorkflow from "./EngagementWorkflow"
import CandidateTimeline from "./CandidateTimeline"

// Resume Upload Form Component (extracted from CandidateResumeUpload)
function ResumeUploadForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose?: () => void }) {
  const [resumeText, setResumeText] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeFile(file)
    setError(null)

    try {
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith('.txt')) {
        const text = await file.text()
        setResumeText(text)
      } else if (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
        setResumeText("") // Will be extracted server-side
      } else {
        setError(`Unsupported file type: ${file.name.split('.').pop()}. Please use PDF, DOCX, or TXT.`)
      }
    } catch (err: any) {
      setError(`Error reading file: ${err.message}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeFile && !resumeText.trim()) {
      setError("Please upload a resume file or paste resume text")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      if (resumeFile) {
        formData.append("resume", resumeFile)
      }
      formData.append("resumeText", resumeText)
      if (linkedinUrl) {
        formData.append("linkedinUrl", linkedinUrl)
      }

      const response = await fetch("/api/candidates/upload-resume", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create candidate")
      }

      setSuccess(true)
      setResumeText("")
      setResumeFile(null)
      setLinkedinUrl("")
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          LinkedIn URL (optional)
        </label>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Resume (PDF/DOCX/TXT)
        </label>
        <input
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          {resumeFile && (resumeFile.name.toLowerCase().endsWith('.pdf') || resumeFile.name.toLowerCase().endsWith('.docx') || resumeFile.name.toLowerCase().endsWith('.doc'))
            ? "✅ PDF/DOCX file selected - text will be extracted automatically"
            : "Upload PDF, DOCX, or TXT file. Text will be extracted automatically, or paste text below."}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume Text {resumeFile && (resumeFile.name.toLowerCase().endsWith('.pdf') || resumeFile.name.toLowerCase().endsWith('.docx') || resumeFile.name.toLowerCase().endsWith('.doc')) ? "(optional - will be extracted from file)" : "*"}
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder={resumeFile && (resumeFile.name.toLowerCase().endsWith('.pdf') || resumeFile.name.toLowerCase().endsWith('.docx') || resumeFile.name.toLowerCase().endsWith('.doc'))
            ? "Text will be extracted from file automatically. You can also paste additional text here if needed."
            : "Paste resume text here, or upload a PDF/DOCX file above"}
          required={!resumeFile || (!resumeFile.name.toLowerCase().endsWith('.pdf') && !resumeFile.name.toLowerCase().endsWith('.docx') && !resumeFile.name.toLowerCase().endsWith('.doc'))}
        />
        <p className="text-xs text-gray-500 mt-1">
          {resumeText.length} characters
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">
            ✅ Candidate created successfully! AI is analyzing the resume...
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || (!resumeFile && !resumeText.trim())}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (resumeFile ? "Extracting & Processing Resume..." : "Processing Resume...") : "Create Candidate with AI"}
        </button>
      </div>
    </form>
  )
}

interface Candidate {
  id: string
  linkedinUrl: string
  fullName: string
  currentCompany: string | null
  currentCompanyStartDate: string | null
  currentCompanyEndDate: string | null
  currentCompanyTenureYears: string | null
  currentCompanyTenureMonths: string | null
  jobTitle: string | null
  location: string | null
  previousTargetCompany: string | null
  previousTargetCompanyStartDate: string | null
  previousTargetCompanyEndDate: string | null
  previousTargetCompanyTenureYears: string | null
  previousTargetCompanyTenureMonths: string | null
  tenurePreviousTarget: string | null
  previousTitles: string | null
  totalYearsExperience: string | null
  universities: string | null // JSON array as string
  fieldsOfStudy: string | null // JSON array as string
  degrees: string | null
  undergradGraduationYear: string | null
  certifications: string | null
  languages: string | null
  projects: string | null
  publications: string | null
  volunteerOrganizations: string | null
  courses: string | null
  honorsAwards: string | null
  organizations: string | null
  patents: string | null
  testScores: string | null
  emails: string | null
  phones: string | null
  socialLinks: string | null
  skillsCount: number | null
  experienceCount: number | null
  educationCount: number | null
  companies: string | null // JSON array as string
  rawData: string | null
  addedById: string | null
  status: "ACTIVE" | "CONTACTED" | "HIRED" | "REJECTED" | "ARCHIVED"
  notes: string | null
  createdAt: Date
  updatedAt: Date
  addedBy?: {
    id: string
    name: string | null
    email: string
  }
  // AI-generated fields
  aiSummary: string | null
  aiKeyStrengths: string | null
  aiBestFitRoles: string | null
  aiHighlights: string | null
  aiConcerns: string | null
  aiSummaryGeneratedAt: Date | null
  // Predictive scoring fields
  predictiveScore: number | null
  scoreConfidence: string | null
  scoreRiskFactors: string | null
  scoreGeneratedAt: Date | null
  scoreJobId: string | null
}

interface CandidatesContentProps {
  initialCandidates: Candidate[]
  initialTotal: number
  initialPage: number
  initialLimit: number
}

export default function CandidatesContent({
  initialCandidates,
  initialTotal,
  initialPage,
  initialLimit,
}: CandidatesContentProps) {
  const router = useRouter()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResults, setAiResults] = useState<any>(null)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [activeRightTab, setActiveRightTab] = useState<"recommendations" | "workflows" | "timeline" | "actions">("recommendations")
  
  // Define all available columns with display names and categories
  const allColumns = [
    { key: "fullName", label: "Name", default: true, category: "Basic" },
    { key: "jobTitle", label: "Title", default: true, category: "Basic" },
    { key: "currentCompany", label: "Company", default: true, category: "Basic" },
    { key: "location", label: "Location", default: true, category: "Basic" },
    { key: "totalYearsExperience", label: "Experience", default: true, category: "Basic" },
    { key: "status", label: "Status", default: true, category: "Basic" },
    { key: "linkedinUrl", label: "LinkedIn URL", default: false, category: "Basic" },
    { key: "currentCompanyStartDate", label: "Current Company Start", default: false, category: "Current Company" },
    { key: "currentCompanyEndDate", label: "Current Company End", default: false, category: "Current Company" },
    { key: "currentCompanyTenureYears", label: "Current Tenure (Years)", default: false, category: "Current Company" },
    { key: "currentCompanyTenureMonths", label: "Current Tenure (Months)", default: false, category: "Current Company" },
    { key: "previousTargetCompany", label: "Previous Company", default: false, category: "Previous Company" },
    { key: "previousTargetCompanyStartDate", label: "Previous Company Start", default: false, category: "Previous Company" },
    { key: "previousTargetCompanyEndDate", label: "Previous Company End", default: false, category: "Previous Company" },
    { key: "previousTargetCompanyTenureYears", label: "Previous Tenure (Years)", default: false, category: "Previous Company" },
    { key: "previousTargetCompanyTenureMonths", label: "Previous Tenure (Months)", default: false, category: "Previous Company" },
    { key: "tenurePreviousTarget", label: "Tenure at Previous", default: false, category: "Previous Company" },
    { key: "previousTitles", label: "Previous Titles", default: false, category: "Experience" },
    { key: "universities", label: "Universities", default: false, category: "Education" },
    { key: "fieldsOfStudy", label: "Fields of Study", default: false, category: "Education" },
    { key: "degrees", label: "Degrees", default: false, category: "Education" },
    { key: "undergradGraduationYear", label: "Undergrad Year", default: false, category: "Education" },
    { key: "certifications", label: "Certifications", default: false, category: "Additional" },
    { key: "languages", label: "Languages", default: false, category: "Additional" },
    { key: "projects", label: "Projects", default: false, category: "Additional" },
    { key: "publications", label: "Publications", default: false, category: "Additional" },
    { key: "volunteerOrganizations", label: "Volunteer Orgs", default: false, category: "Additional" },
    { key: "courses", label: "Courses", default: false, category: "Additional" },
    { key: "honorsAwards", label: "Honors & Awards", default: false, category: "Additional" },
    { key: "organizations", label: "Organizations", default: false, category: "Additional" },
    { key: "patents", label: "Patents", default: false, category: "Additional" },
    { key: "testScores", label: "Test Scores", default: false, category: "Additional" },
    { key: "emails", label: "Emails", default: false, category: "Contact" },
    { key: "phones", label: "Phones", default: false, category: "Contact" },
    { key: "socialLinks", label: "Social Links", default: false, category: "Contact" },
    { key: "skillsCount", label: "Skills Count", default: false, category: "Metrics" },
    { key: "experienceCount", label: "Experience Count", default: false, category: "Metrics" },
    { key: "educationCount", label: "Education Count", default: false, category: "Metrics" },
    { key: "companies", label: "Companies", default: false, category: "Experience" },
    { key: "notes", label: "Notes", default: false, category: "Additional" },
    { key: "aiSummary", label: "AI Summary", default: false, category: "AI" },
    { key: "createdAt", label: "Created At", default: false, category: "Metadata" },
    { key: "updatedAt", label: "Updated At", default: false, category: "Metadata" },
  ]
  
  // Load selected columns from localStorage or use defaults
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("candidateColumns")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Fallback to defaults
        }
      }
    }
    return allColumns.filter(col => col.default).map(col => col.key)
  })
  
  // Save selected columns to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("candidateColumns", JSON.stringify(selectedColumns))
    }
  }, [selectedColumns])

  // Initialize search params from URL on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setSearch(params.get("search") || "")
      setStatusFilter(params.get("status") || "")
    }
  }, [])

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", page.toString())
      params.set("limit", initialLimit.toString())
      params.set("_t", Date.now().toString())

      const response = await fetch(`/api/candidates?${params.toString()}`, {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
        setTotal(data.pagination?.total || 0)
        router.push(`/candidates?${params.toString()}`)
      }
    } catch (error) {
      console.error("[CandidatesContent] Error fetching candidates:", error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, initialLimit, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCandidates()
  }

  const handleStatusChange = async (candidateId: string, newStatus: Candidate["status"]) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
        )
        if (selectedCandidate?.id === candidateId) {
          const candidateResponse = await fetch(`/api/candidates/${candidateId}`)
          if (candidateResponse.ok) {
            const updated = await candidateResponse.json()
            setSelectedCandidate(updated)
          }
        }
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const loadCandidateDetails = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`)
      if (response.ok) {
        const candidate = await response.json()
        setSelectedCandidate({
          ...candidate,
          // Ensure predictive score fields are included
          predictiveScore: candidate.predictiveScore ?? null,
          scoreConfidence: candidate.scoreConfidence ?? null,
          scoreRiskFactors: candidate.scoreRiskFactors ?? null,
          scoreGeneratedAt: candidate.scoreGeneratedAt ? new Date(candidate.scoreGeneratedAt) : null,
          scoreJobId: candidate.scoreJobId ?? null,
        })
      }
    } catch (error) {
      console.error("Error loading candidate details:", error)
    }
  }


  const statusColors = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CONTACTED: "bg-blue-50 text-blue-700 border-blue-200",
    HIRED: "bg-purple-50 text-purple-700 border-purple-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    ARCHIVED: "bg-gray-50 text-gray-700 border-gray-200",
  }

  const statusIcons = {
    ACTIVE: "✓",
    CONTACTED: "📧",
    HIRED: "🎉",
    REJECTED: "✗",
    ARCHIVED: "📦",
  }

  const totalPages = Math.ceil(total / initialLimit)

  // Helper function to format cell values
  const formatCellValue = (value: any, columnKey: string): string => {
    if (value === null || value === undefined) return "-"
    
    if (columnKey === "createdAt" || columnKey === "updatedAt" || columnKey === "aiSummaryGeneratedAt") {
      if (value instanceof Date || typeof value === "string") {
        try {
          const date = new Date(value)
          return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        } catch {
          return String(value)
        }
      }
    }
    
    if (columnKey === "universities" || columnKey === "companies" || columnKey === "fieldsOfStudy") {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            return parsed.slice(0, 3).join(", ") + (parsed.length > 3 ? ` (+${parsed.length - 3} more)` : "")
          }
        } catch {
          // Not JSON, return as-is
        }
      }
    }
    
    if (typeof value === "string" && value.length > 80) {
      return value.substring(0, 80) + "..."
    }
    
    return String(value)
  }

  // Get visible columns
  const visibleColumns = allColumns.filter(col => selectedColumns.includes(col.key))
  
  // Group columns by category for selector
  const columnsByCategory = allColumns.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = []
    acc[col.category].push(col)
    return acc
  }, {} as Record<string, typeof allColumns>)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Candidates</h1>
            <p className="text-sm text-gray-500">
              {total} total candidate{total !== 1 ? 's' : ''} • Page {page} of {totalPages}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setPage(1)
                fetchCandidates()
              }}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              title="Refresh candidates list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Resume
            </button>
            <button
              onClick={() => setShowColumnSelector(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
              title="Configure columns"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Columns
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, title, location..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
              setTimeout(() => fetchCandidates(), 0)
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[180px]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">✓ Active</option>
            <option value="CONTACTED">📧 Contacted</option>
            <option value="HIRED">🎉 Hired</option>
            <option value="REJECTED">✗ Rejected</option>
            <option value="ARCHIVED">📦 Archived</option>
          </select>
        </div>
      </div>

      {/* Column Selector Modal */}
      {showColumnSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowColumnSelector(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Configure Columns</h2>
                  <p className="text-sm text-gray-500 mt-1">Select which columns to display in the table</p>
                </div>
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(columnsByCategory).map(([category, cols]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {cols.map((column) => (
                        <label
                          key={column.key}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(column.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColumns([...selectedColumns, column.key])
                              } else {
                                setSelectedColumns(selectedColumns.filter((key) => key !== column.key))
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{column.label}</span>
                          {column.default && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">default</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedColumns(allColumns.filter(col => col.default).map(col => col.key))
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => {
                    setSelectedColumns(allColumns.map(col => col.key))
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Select All
                </button>
              </div>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Done ({selectedColumns.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Resume Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upload Resume</h2>
                  <p className="text-sm text-gray-500 mt-1">Upload a resume (PDF/DOCX/TXT) to create a new candidate</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <ResumeUploadForm
              onSuccess={() => {
                setShowUploadModal(false)
                fetchCandidates()
              }}
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500 mb-4">Get started by uploading a resume to create a new candidate.</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Upload Resume
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50 z-10"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    {visibleColumns.map((column) => {
                      const value = (candidate as any)[column.key]
                      
                      if (column.key === "fullName") {
                        return (
                          <td key={column.key} className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                {candidate.fullName?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate.fullName || "-"}
                                </div>
                                {candidate.linkedinUrl && (
                                  <a
                                    href={candidate.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                    </svg>
                                    LinkedIn
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                        )
                      }
                      
                      if (column.key === "status") {
                        return (
                          <td key={column.key} className="px-4 py-4 whitespace-nowrap">
                            <select
                              value={candidate.status}
                              onChange={(e) =>
                                handleStatusChange(candidate.id, e.target.value as Candidate["status"])
                              }
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${statusColors[candidate.status]}`}
                            >
                              <option value="ACTIVE">✓ Active</option>
                              <option value="CONTACTED">📧 Contacted</option>
                              <option value="HIRED">🎉 Hired</option>
                              <option value="REJECTED">✗ Rejected</option>
                              <option value="ARCHIVED">📦 Archived</option>
                            </select>
                          </td>
                        )
                      }
                      
                      if (column.key === "linkedinUrl") {
                        return (
                          <td key={column.key} className="px-4 py-4">
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 break-all inline-flex items-center gap-1"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                              </svg>
                              {value || "-"}
                            </a>
                          </td>
                        )
                      }
                      
                      return (
                        <td key={column.key} className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {formatCellValue(value, column.key)}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => loadCandidateDetails(candidate.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * initialLimit + 1}</span> to{" "}
              <span className="font-medium">{Math.min(page * initialLimit, total)}</span> of{" "}
              <span className="font-medium">{total}</span> candidates
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPage(page - 1)
                  setTimeout(() => fetchCandidates(), 0)
                }}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setPage(pageNum)
                        setTimeout(() => fetchCandidates(), 0)
                      }}
                      disabled={loading}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => {
                  setPage(page + 1)
                  setTimeout(() => fetchCandidates(), 0)
                }}
                disabled={page === totalPages || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full h-[90vh] flex flex-col my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedCandidate.fullName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.fullName}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      {selectedCandidate.jobTitle && (
                        <span className="text-gray-600">{selectedCandidate.jobTitle}</span>
                      )}
                      {selectedCandidate.currentCompany && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{selectedCandidate.currentCompany}</span>
                        </>
                      )}
                    </div>
                    {selectedCandidate.linkedinUrl && (
                      <a
                        href={selectedCandidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        View LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCandidate(null)
                    setAiResults(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* AI Summary Section - Full Width at Top */}
                {selectedCandidate.aiSummary && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">AI Summary</h3>
                    {selectedCandidate.aiSummaryGeneratedAt && (
                      <span className="text-xs text-gray-500 ml-auto">
                        Generated {new Date(selectedCandidate.aiSummaryGeneratedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">{selectedCandidate.aiSummary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCandidate.aiKeyStrengths && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Key Strengths</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {(() => {
                          try {
                            const strengths = JSON.parse(selectedCandidate.aiKeyStrengths || "[]")
                              return Array.isArray(strengths) ? strengths.slice(0, 3).map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            )) : null
                          } catch {
                            return <li>{selectedCandidate.aiKeyStrengths}</li>
                          }
                        })()}
                      </ul>
                    </div>
                  )}
                  
                  {selectedCandidate.aiBestFitRoles && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Best Fit Roles</h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const roles = JSON.parse(selectedCandidate.aiBestFitRoles || "[]")
                              return Array.isArray(roles) ? roles.slice(0, 4).map((r: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                                {r}
                              </span>
                            )) : null
                          } catch {
                              return <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                              {selectedCandidate.aiBestFitRoles}
                            </span>
                          }
                        })()}
                      </div>
                    </div>
                  )}
                    </div>
                </div>
                )}

                {/* Main Content Grid - Left: Details, Right: Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  {/* Left Column - Candidate Details (2/3 width) */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Candidate Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedCandidate.location && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</h3>
                          <p className="text-gray-900">{selectedCandidate.location}</p>
                        </div>
                      )}
                      {selectedCandidate.totalYearsExperience && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Experience</h3>
                          <p className="text-gray-900">{selectedCandidate.totalYearsExperience} years</p>
                        </div>
                      )}
                      {selectedCandidate.skillsCount && selectedCandidate.skillsCount > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Skills</h3>
                          <p className="text-gray-900">
                            {selectedCandidate.skillsCount} skill{selectedCandidate.skillsCount !== 1 ? 's' : ''} listed
                          </p>
                        </div>
                      )}
                      {selectedCandidate.status && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[selectedCandidate.status]}`}>
                            {statusIcons[selectedCandidate.status]} {selectedCandidate.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Education Section */}
                    {(selectedCandidate.universities || selectedCandidate.fieldsOfStudy || selectedCandidate.degrees) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    Education
                  </h3>
                  <div className="space-y-4">
                    {selectedCandidate.universities && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Universities</h4>
                        <p className="text-gray-900">
                          {(() => {
                            try {
                              const unis = JSON.parse(selectedCandidate.universities)
                              return Array.isArray(unis) ? unis.join(", ") : selectedCandidate.universities
                            } catch {
                              return selectedCandidate.universities
                            }
                          })()}
                        </p>
                      </div>
                    )}
                    {selectedCandidate.fieldsOfStudy && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Fields of Study</h4>
                        <p className="text-gray-900">
                          {(() => {
                            try {
                              const fields = JSON.parse(selectedCandidate.fieldsOfStudy)
                              return Array.isArray(fields) ? fields.join(", ") : selectedCandidate.fieldsOfStudy
                            } catch {
                              return selectedCandidate.fieldsOfStudy
                            }
                          })()}
                        </p>
                      </div>
                    )}
                    {selectedCandidate.degrees && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Degrees</h4>
                        <p className="text-gray-900">{selectedCandidate.degrees}</p>
                      </div>
                    )}
                    {selectedCandidate.undergradGraduationYear && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Undergrad Year</h4>
                        <p className="text-gray-900">{selectedCandidate.undergradGraduationYear}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

                    {/* Experience Section */}
                    {(selectedCandidate.companies || selectedCandidate.previousTitles || selectedCandidate.currentCompany) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Experience
                  </h3>
                  <div className="space-y-4">
                    {selectedCandidate.currentCompany && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Current Company</h4>
                        <p className="text-gray-900">{selectedCandidate.currentCompany}</p>
                        {selectedCandidate.jobTitle && (
                          <p className="text-sm text-gray-600 mt-1">as {selectedCandidate.jobTitle}</p>
                        )}
                        {selectedCandidate.currentCompanyStartDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedCandidate.currentCompanyStartDate}
                            {selectedCandidate.currentCompanyEndDate ? ` - ${selectedCandidate.currentCompanyEndDate}` : " - Present"}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedCandidate.previousTargetCompany && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Previous Company</h4>
                        <p className="text-gray-900">{selectedCandidate.previousTargetCompany}</p>
                        {selectedCandidate.previousTargetCompanyStartDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedCandidate.previousTargetCompanyStartDate}
                            {selectedCandidate.previousTargetCompanyEndDate ? ` - ${selectedCandidate.previousTargetCompanyEndDate}` : ""}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedCandidate.companies && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">All Companies</h4>
                        <p className="text-gray-900">
                          {(() => {
                            try {
                              const comps = JSON.parse(selectedCandidate.companies)
                              return Array.isArray(comps) ? comps.join(", ") : selectedCandidate.companies
                            } catch {
                              return selectedCandidate.companies
                            }
                          })()}
                        </p>
                      </div>
                    )}
                    {selectedCandidate.previousTitles && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Previous Titles</h4>
                        <p className="text-gray-900">{selectedCandidate.previousTitles}</p>
                      </div>
                    )}
                    {selectedCandidate.totalYearsExperience && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Total Experience</h4>
                        <p className="text-gray-900">{selectedCandidate.totalYearsExperience} years</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

                    {/* Additional Information */}
                    {(selectedCandidate.certifications || selectedCandidate.languages || selectedCandidate.projects) && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCandidate.certifications && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Certifications</h4>
                        <p className="text-sm text-gray-900">{selectedCandidate.certifications}</p>
                      </div>
                    )}
                    {selectedCandidate.languages && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Languages</h4>
                        <p className="text-sm text-gray-900">{selectedCandidate.languages}</p>
                      </div>
                    )}
                    {selectedCandidate.projects && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Projects</h4>
                        <p className="text-sm text-gray-900">{selectedCandidate.projects}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

                    {/* Notes */}
                    {selectedCandidate.notes && (
                      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedCandidate.notes}</p>
                </div>
              )}

                    {/* Raw Data */}
                    {selectedCandidate.rawData && (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-6">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Raw Data
                    </summary>
                    <pre className="text-xs text-gray-600 bg-white p-4 rounded border border-gray-200 overflow-auto max-h-96 mt-2">
                      {typeof selectedCandidate.rawData === 'string'
                        ? selectedCandidate.rawData
                        : JSON.stringify(selectedCandidate.rawData, null, 2)}
                      </pre>
                    </details>
                  </div>
                    )}
                  </div>

                  {/* Right Column - Tabs View (1/3 width) */}
                  <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full max-h-[calc(90vh-200px)]">
                    {/* Tabs Header */}
                    <div className="flex-shrink-0 flex border-b border-gray-200">
                      <button
                        onClick={() => setActiveRightTab("recommendations")}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                          activeRightTab === "recommendations"
                            ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-base">⭐</span>
                          <span className="hidden sm:inline">Recommendations</span>
                          <span className="sm:hidden">Recs</span>
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveRightTab("workflows")}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                          activeRightTab === "workflows"
                            ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-base">🔄</span>
                          <span className="hidden sm:inline">Workflows</span>
                          <span className="sm:hidden">Work</span>
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveRightTab("timeline")}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                          activeRightTab === "timeline"
                            ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-base">📅</span>
                          <span className="hidden sm:inline">Timeline</span>
                          <span className="sm:hidden">Time</span>
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveRightTab("actions")}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                          activeRightTab === "actions"
                            ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-sm sm:text-base">🤖</span>
                          <span className="hidden sm:inline">Actions</span>
                          <span className="sm:hidden">AI</span>
                        </span>
                      </button>
                    </div>

                    {/* Tab Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
                    {activeRightTab === "recommendations" && (
                      <PredictiveScore
                        candidateId={selectedCandidate.id}
                        onScoreCalculated={(score) => {
                          loadCandidateDetails(selectedCandidate.id)
                        }}
                      />
                    )}

                    {activeRightTab === "workflows" && (
                      <EngagementWorkflow candidateId={selectedCandidate.id} />
                    )}

                    {activeRightTab === "timeline" && (
                      <CandidateTimeline candidateId={selectedCandidate.id} />
                    )}

                    {activeRightTab === "actions" && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Quick Actions</h3>
                        <button
                          onClick={async () => {
                            setAiLoading("match")
                            try {
                              const response = await fetch(`/api/candidates/${selectedCandidate.id}/match-jobs`)
                              if (response.ok) {
                                const data = await response.json()
                                setAiResults({ type: "match", data })
                              }
                            } catch (error) {
                              console.error("Error matching jobs:", error)
                            } finally {
                              setAiLoading(null)
                            }
                          }}
                          disabled={aiLoading !== null}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {aiLoading === "match" ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Matching...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              Match to Jobs
                            </>
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            setAiLoading("outreach")
                            try {
                              const response = await fetch(`/api/candidates/${selectedCandidate.id}/outreach`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({}),
                              })
                              if (response.ok) {
                                const data = await response.json()
                                setAiResults({ type: "outreach", data })
                              }
                            } catch (error) {
                              console.error("Error generating outreach:", error)
                            } finally {
                              setAiLoading(null)
                            }
                          }}
                          disabled={aiLoading !== null}
                          className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {aiLoading === "outreach" ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Generate Outreach
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Results Display - Full Width */}
              {aiResults && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200 mt-4">
                  {aiResults.type === "match" && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Job Matches
                      </h3>
                      {aiResults.data.matches && aiResults.data.matches.length > 0 ? (
                        <div className="space-y-3">
                          {aiResults.data.matches.slice(0, 5).map((match: any, i: number) => (
                            <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-900">{match.jobTitle}</h4>
                                  <p className="text-sm text-gray-600">{match.companyName}</p>
                                </div>
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                  {match.matchScore}% match
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{match.reasoning}</p>
                              {match.strengths && match.strengths.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  <strong>Strengths:</strong> {match.strengths.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">No matches found</p>
                      )}
                    </div>
                  )}
                  {aiResults.type === "outreach" && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Generated Outreach Message
                      </h3>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
                        <p className="text-gray-700 whitespace-pre-wrap">{aiResults.data.message}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiResults.data.message)
                          alert("Message copied to clipboard!")
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
