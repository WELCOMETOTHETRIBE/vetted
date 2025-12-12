"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null) // Track which AI action is loading
  const [aiResults, setAiResults] = useState<any>(null) // Store AI results
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  
  // Define all available columns with display names
  const allColumns = [
    { key: "fullName", label: "Name", default: true },
    { key: "jobTitle", label: "Title", default: true },
    { key: "currentCompany", label: "Company", default: true },
    { key: "location", label: "Location", default: true },
    { key: "totalYearsExperience", label: "Experience", default: true },
    { key: "status", label: "Status", default: true },
    { key: "linkedinUrl", label: "LinkedIn URL", default: false },
    { key: "currentCompanyStartDate", label: "Current Company Start", default: false },
    { key: "currentCompanyEndDate", label: "Current Company End", default: false },
    { key: "currentCompanyTenureYears", label: "Current Tenure (Years)", default: false },
    { key: "currentCompanyTenureMonths", label: "Current Tenure (Months)", default: false },
    { key: "previousTargetCompany", label: "Previous Company", default: false },
    { key: "previousTargetCompanyStartDate", label: "Previous Company Start", default: false },
    { key: "previousTargetCompanyEndDate", label: "Previous Company End", default: false },
    { key: "previousTargetCompanyTenureYears", label: "Previous Tenure (Years)", default: false },
    { key: "previousTargetCompanyTenureMonths", label: "Previous Tenure (Months)", default: false },
    { key: "tenurePreviousTarget", label: "Tenure at Previous", default: false },
    { key: "previousTitles", label: "Previous Titles", default: false },
    { key: "universities", label: "Universities", default: false },
    { key: "fieldsOfStudy", label: "Fields of Study", default: false },
    { key: "degrees", label: "Degrees", default: false },
    { key: "undergradGraduationYear", label: "Undergrad Year", default: false },
    { key: "certifications", label: "Certifications", default: false },
    { key: "languages", label: "Languages", default: false },
    { key: "projects", label: "Projects", default: false },
    { key: "publications", label: "Publications", default: false },
    { key: "volunteerOrganizations", label: "Volunteer Orgs", default: false },
    { key: "courses", label: "Courses", default: false },
    { key: "honorsAwards", label: "Honors & Awards", default: false },
    { key: "organizations", label: "Organizations", default: false },
    { key: "patents", label: "Patents", default: false },
    { key: "testScores", label: "Test Scores", default: false },
    { key: "emails", label: "Emails", default: false },
    { key: "phones", label: "Phones", default: false },
    { key: "socialLinks", label: "Social Links", default: false },
    { key: "skillsCount", label: "Skills Count", default: false },
    { key: "experienceCount", label: "Experience Count", default: false },
    { key: "educationCount", label: "Education Count", default: false },
    { key: "companies", label: "Companies", default: false },
    { key: "notes", label: "Notes", default: false },
    { key: "aiSummary", label: "AI Summary", default: false },
    { key: "createdAt", label: "Created At", default: false },
    { key: "updatedAt", label: "Updated At", default: false },
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
    // Return default columns
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
      // Add cache-busting timestamp to ensure fresh data
      params.set("_t", Date.now().toString())

      console.log("[CandidatesContent] Fetching candidates with params:", params.toString())
      const response = await fetch(`/api/candidates?${params.toString()}`, {
        cache: "no-store", // Ensure we get fresh data
      })
      if (response.ok) {
        const data = await response.json()
        console.log("[CandidatesContent] Received candidates:", {
          count: data.candidates?.length || 0,
          total: data.pagination?.total || 0,
          candidateNames: data.candidates?.map((c: Candidate) => c.fullName) || []
        })
        setCandidates(data.candidates || [])
        setTotal(data.pagination?.total || 0)
        router.push(`/candidates?${params.toString()}`)
      } else {
        console.error("[CandidatesContent] Failed to fetch candidates:", response.status, response.statusText)
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
        // If viewing details, refresh the selected candidate
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
        setSelectedCandidate(candidate)
      }
    } catch (error) {
      console.error("Error loading candidate details:", error)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const text = await file.text()
      let data: any[]

      if (file.name.endsWith(".csv")) {
        // Parse CSV
        const lines = text.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim())
        data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim())
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header] = values[i] || ""
          })
          return obj
        })
      } else {
        // Parse JSON
        data = JSON.parse(text)
        if (!Array.isArray(data)) {
          data = [data]
        }
      }

      const response = await fetch("/api/candidates/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully uploaded ${result.created} candidate(s)`)
        setShowUploadModal(false)
        fetchCandidates()
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error}`)
      }
    } catch (error: any) {
      alert(`Upload error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    CONTACTED: "bg-blue-100 text-blue-800",
    HIRED: "bg-purple-100 text-purple-800",
    REJECTED: "bg-red-100 text-red-800",
    ARCHIVED: "bg-gray-100 text-gray-800",
  }

  const totalPages = Math.ceil(total / initialLimit)

  // Helper function to format cell values
  const formatCellValue = (value: any, columnKey: string): string => {
    if (value === null || value === undefined) return "-"
    
    // Handle dates
    if (columnKey === "createdAt" || columnKey === "updatedAt" || columnKey === "aiSummaryGeneratedAt") {
      if (value instanceof Date || typeof value === "string") {
        try {
          const date = new Date(value)
          return date.toLocaleDateString()
        } catch {
          return String(value)
        }
      }
    }
    
    // Handle JSON arrays (universities, companies, fieldsOfStudy)
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
    
    // Handle long text fields (truncate)
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "..."
    }
    
    return String(value)
  }

  // Get visible columns (always include Actions)
  const visibleColumns = allColumns.filter(col => selectedColumns.includes(col.key))

  return (
    <div>
      {/* Header Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, title, location..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
              setTimeout(() => fetchCandidates(), 0)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CONTACTED">Contacted</option>
            <option value="HIRED">Hired</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setPage(1)
              fetchCandidates()
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            title="Refresh candidates list"
          >
            🔄 Refresh
          </button>

          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
          >
            📤 Upload CSV/JSON
          </button>

          {/* Column Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 whitespace-nowrap flex items-center gap-2"
              title="Configure columns"
            >
              ⚙️ Columns
            </button>
            
            {/* Column Selector Dropdown */}
            {showColumnSelector && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnSelector(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Select Columns</h3>
                    <p className="text-xs text-gray-500 mt-1">Choose which columns to display</p>
                  </div>
                  <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    {allColumns.map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
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
                          <span className="text-xs text-gray-400">(default)</span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedColumns(allColumns.filter(col => col.default).map(col => col.key))
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Reset to Defaults
                    </button>
                    <button
                      onClick={() => {
                        setSelectedColumns(allColumns.map(col => col.key))
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setShowColumnSelector(false)}
                      className="ml-auto px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Upload Candidates</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV or JSON file with candidate data from the extension.
            </p>
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFileUpload(file)
                }
              }}
              disabled={uploading}
              className="w-full mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
            {uploading && (
              <p className="text-sm text-gray-600 mt-2">Uploading...</p>
            )}
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No candidates found. Upload candidates using the extension or CSV/JSON file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    {visibleColumns.map((column) => {
                      const value = (candidate as any)[column.key]
                      
                      // Special handling for certain columns
                      if (column.key === "fullName") {
                        return (
                          <td key={column.key} className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                                {candidate.fullName?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate.fullName || "-"}
                                </div>
                                {candidate.linkedinUrl && (
                                  <div className="text-xs text-gray-500">
                                    <a
                                      href={candidate.linkedinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-blue-600"
                                    >
                                      View LinkedIn
                                    </a>
                                  </div>
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
                              className={`text-xs font-medium px-2 py-1 rounded ${statusColors[candidate.status]}`}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="HIRED">Hired</option>
                              <option value="REJECTED">Rejected</option>
                              <option value="ARCHIVED">Archived</option>
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
                              className="text-sm text-blue-600 hover:text-blue-800 break-all"
                            >
                              {value || "-"}
                            </a>
                          </td>
                        )
                      }
                      
                      // Default cell rendering
                      return (
                        <td key={column.key} className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {formatCellValue(value, column.key)}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => loadCandidateDetails(candidate.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
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
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * initialLimit + 1} to {Math.min(page * initialLimit, total)} of{" "}
            {total} candidates
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage(page - 1)
                setTimeout(() => fetchCandidates(), 0)
              }}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => {
                setPage(page + 1)
                setTimeout(() => fetchCandidates(), 0)
              }}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.fullName}</h2>
                  <a
                    href={selectedCandidate.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View LinkedIn Profile
                  </a>
                </div>
                <button
                  onClick={() => {
                    setSelectedCandidate(null)
                    setAiResults(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* AI Action Buttons */}
              <div className="mb-6 flex gap-2 flex-wrap">
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  {aiLoading === "match" ? "Matching..." : "🔍 Match to Jobs"}
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {aiLoading === "outreach" ? "Generating..." : "✉️ Generate Outreach"}
                </button>
                <button
                  onClick={async () => {
                    const jobId = prompt("Enter Job ID for interview prep:")
                    if (!jobId) return
                    setAiLoading("interview")
                    try {
                      const response = await fetch(`/api/candidates/${selectedCandidate.id}/interview-prep`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jobId }),
                      })
                      if (response.ok) {
                        const data = await response.json()
                        setAiResults({ type: "interview", data })
                      }
                    } catch (error) {
                      console.error("Error generating interview prep:", error)
                    } finally {
                      setAiLoading(null)
                    }
                  }}
                  disabled={aiLoading !== null}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                >
                  {aiLoading === "interview" ? "Preparing..." : "📋 Interview Prep"}
                </button>
              </div>

              {/* AI Results Display */}
              {aiResults && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {aiResults.type === "match" && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Job Matches</h3>
                      {aiResults.data.matches && aiResults.data.matches.length > 0 ? (
                        <div className="space-y-3">
                          {aiResults.data.matches.slice(0, 5).map((match: any, i: number) => (
                            <div key={i} className="p-3 bg-white rounded border">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-900">{match.jobTitle}</h4>
                                  <p className="text-sm text-gray-600">{match.companyName}</p>
                                </div>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
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
                      <h3 className="font-semibold text-gray-900 mb-2">Generated Outreach Message</h3>
                      <div className="p-3 bg-white rounded border mb-3">
                        <p className="text-gray-700 whitespace-pre-wrap">{aiResults.data.message}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiResults.data.message)
                          alert("Message copied to clipboard!")
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  )}
                  {aiResults.type === "interview" && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Interview Preparation</h3>
                      {aiResults.data.questions && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Questions</h4>
                          <div className="space-y-2">
                            {aiResults.data.questions.technical && aiResults.data.questions.technical.length > 0 && (
                              <div>
                                <strong className="text-sm text-gray-700">Technical:</strong>
                                <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                  {aiResults.data.questions.technical.map((q: string, i: number) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {aiResults.data.questions.behavioral && aiResults.data.questions.behavioral.length > 0 && (
                              <div>
                                <strong className="text-sm text-gray-700">Behavioral:</strong>
                                <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                  {aiResults.data.questions.behavioral.map((q: string, i: number) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {aiResults.data.insights && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Insights</h4>
                          {aiResults.data.insights.candidateStrengths && aiResults.data.insights.candidateStrengths.length > 0 && (
                            <div className="mb-2">
                              <strong className="text-sm text-gray-700">Strengths:</strong>
                              <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                {aiResults.data.insights.candidateStrengths.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {aiResults.data.insights.talkingPoints && aiResults.data.insights.talkingPoints.length > 0 && (
                            <div>
                              <strong className="text-sm text-gray-700">Talking Points:</strong>
                              <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                {aiResults.data.insights.talkingPoints.map((p: string, i: number) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI Summary Section */}
              {selectedCandidate.aiSummary && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <h3 className="font-semibold text-gray-900">AI Summary</h3>
                    {selectedCandidate.aiSummaryGeneratedAt && (
                      <span className="text-xs text-gray-500">
                        (Generated {new Date(selectedCandidate.aiSummaryGeneratedAt).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{selectedCandidate.aiSummary}</p>
                  
                  {selectedCandidate.aiKeyStrengths && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-2">Key Strengths</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {(() => {
                          try {
                            const strengths = JSON.parse(selectedCandidate.aiKeyStrengths || "[]")
                            return Array.isArray(strengths) ? strengths.map((s: string, i: number) => (
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
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-2">Best Fit Roles</h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const roles = JSON.parse(selectedCandidate.aiBestFitRoles || "[]")
                            return Array.isArray(roles) ? roles.map((r: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                                {r}
                              </span>
                            )) : null
                          } catch {
                            return <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                              {selectedCandidate.aiBestFitRoles}
                            </span>
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {selectedCandidate.aiHighlights && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-2">Notable Highlights</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {(() => {
                          try {
                            const highlights = JSON.parse(selectedCandidate.aiHighlights || "[]")
                            return Array.isArray(highlights) ? highlights.map((h: string, i: number) => (
                              <li key={i}>{h}</li>
                            )) : null
                          } catch {
                            return <li>{selectedCandidate.aiHighlights}</li>
                          }
                        })()}
                      </ul>
                    </div>
                  )}
                  
                  {selectedCandidate.aiConcerns && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Areas to Explore</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {(() => {
                          try {
                            const concerns = JSON.parse(selectedCandidate.aiConcerns || "[]")
                            return Array.isArray(concerns) ? concerns.map((c: string, i: number) => (
                              <li key={i}>{c}</li>
                            )) : null
                          } catch {
                            return <li>{selectedCandidate.aiConcerns}</li>
                          }
                        })()}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Job Title</h3>
                  <p className="text-gray-600">{selectedCandidate.jobTitle || "-"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Company</h3>
                  <p className="text-gray-600">{selectedCandidate.currentCompany || "-"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-600">{selectedCandidate.location || "-"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
                  <p className="text-gray-600">{selectedCandidate.totalYearsExperience || "-"}</p>
                </div>
                {selectedCandidate.skillsCount && selectedCandidate.skillsCount > 0 && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                    <p className="text-gray-600">
                      {selectedCandidate.skillsCount} skill{selectedCandidate.skillsCount !== 1 ? 's' : ''} listed
                    </p>
                  </div>
                )}
                {selectedCandidate.notes && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedCandidate.notes}</p>
                  </div>
                )}
                {selectedCandidate.education && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Education</h3>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded overflow-auto">
                      {typeof selectedCandidate.education === 'string'
                        ? selectedCandidate.education
                        : JSON.stringify(selectedCandidate.education, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedCandidate.experience && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded overflow-auto">
                      {typeof selectedCandidate.experience === 'string'
                        ? selectedCandidate.experience
                        : JSON.stringify(selectedCandidate.experience, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedCandidate.rawData && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Raw Data</h3>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">
                        View Raw Data
                      </summary>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded overflow-auto max-h-96">
                        {typeof selectedCandidate.rawData === 'string'
                          ? selectedCandidate.rawData
                          : JSON.stringify(selectedCandidate.rawData, null, 2)}
                      </pre>
                    </details>
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
