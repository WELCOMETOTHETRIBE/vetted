"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Candidate {
  id: string
  linkedinUrl: string
  fullName: string
  currentCompany: string | null
  jobTitle: string | null
  location: string | null
  totalYearsExperience: string | null
  skills: string[]
  status: "ACTIVE" | "CONTACTED" | "HIRED" | "REJECTED" | "ARCHIVED"
  notes: string | null
  createdAt: Date
  updatedAt: Date
  education?: any
  experience?: any
  rawData?: any
  addedBy?: {
    id: string
    name: string | null
    email: string
  }
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
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", page.toString())
      params.set("limit", initialLimit.toString())

      const response = await fetch(`/api/candidates?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates)
        setTotal(data.pagination.total)
        router.push(`/candidates?${params.toString()}`)
      }
    } catch (error) {
      console.error("Error fetching candidates:", error)
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

          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
          >
            📤 Upload CSV/JSON
          </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {candidate.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            <a
                              href={candidate.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
                            >
                              View LinkedIn
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{candidate.jobTitle || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{candidate.currentCompany || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{candidate.location || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {candidate.totalYearsExperience || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

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
                {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
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
