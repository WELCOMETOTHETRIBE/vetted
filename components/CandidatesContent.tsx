"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Candidate {
  id: string
  linkedinUrl: string
  fullName: string
  currentCompany: string | null
  jobTitle: string | null
  location: string | null
  status: string
  notes: string | null
  createdAt: Date
  addedBy: {
    id: string
    name: string | null
    email: string
  } | null
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
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    router.push(`/candidates?${params.toString()}`)
  }

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updated = await response.json()
        setCandidates(
          candidates.map((c) => (c.id === candidateId ? updated : c))
        )
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleSaveNotes = async (candidateId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })

      if (response.ok) {
        const updated = await response.json()
        setCandidates(
          candidates.map((c) => (c.id === candidateId ? updated : c))
        )
        setSelectedCandidate(null)
        setNotes("")
      }
    } catch (error) {
      console.error("Error saving notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (candidateId: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCandidates(candidates.filter((c) => c.id !== candidateId))
        if (selectedCandidate?.id === candidateId) {
          setSelectedCandidate(null)
        }
      }
    } catch (error) {
      console.error("Error deleting candidate:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "CONTACTED":
        return "bg-blue-100 text-blue-800"
      case "HIRED":
        return "bg-purple-100 text-purple-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex gap-6">
      {/* Main List */}
      <div className="flex-1">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, company, title, location..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="CONTACTED">Contacted</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
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
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No candidates found
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedCandidate(candidate)
                        setNotes(candidate.notes || "")
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          <a
                            href={candidate.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline"
                          >
                            View LinkedIn
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidate.currentCompany || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidate.jobTitle || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {candidate.location || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={candidate.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleStatusChange(candidate.id, e.target.value)
                          }}
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(candidate.status)} border-0`}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="HIRED">Hired</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(candidate.id)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {initialTotal > initialLimit && (
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(initialTotal / initialLimit) }).map(
                (_, i) => {
                  const page = i + 1
                  const params = new URLSearchParams(searchParams.toString())
                  params.set("page", page.toString())
                  return (
                    <Link
                      key={page}
                      href={`/candidates?${params.toString()}`}
                      className={`px-3 py-2 rounded ${
                        initialPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </Link>
                  )
                }
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Candidate Details */}
      {selectedCandidate && (
        <div className="w-96 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCandidate.fullName}
            </h2>
            <button
              onClick={() => {
                setSelectedCandidate(null)
                setNotes("")
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                LinkedIn
              </label>
              <a
                href={selectedCandidate.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline text-sm mt-1"
              >
                {selectedCandidate.linkedinUrl}
              </a>
            </div>

            {selectedCandidate.currentCompany && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Current Company
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedCandidate.currentCompany}
                </p>
              </div>
            )}

            {selectedCandidate.jobTitle && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Job Title
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedCandidate.jobTitle}
                </p>
              </div>
            )}

            {selectedCandidate.location && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Location
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedCandidate.location}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Status
              </label>
              <span
                className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${getStatusColor(selectedCandidate.status)}`}
              >
                {selectedCandidate.status}
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Add notes about this candidate..."
              />
              <button
                onClick={() => handleSaveNotes(selectedCandidate.id)}
                disabled={loading}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? "Saving..." : "Save Notes"}
              </button>
            </div>

            {selectedCandidate.addedBy && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Added By
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedCandidate.addedBy.name || selectedCandidate.addedBy.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

