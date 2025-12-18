"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface LinkedInUrl {
  id: string
  url: string
  searchQuery: string | null
  location: string | null
  company: string | null
  title: string | null
  notes: string | null
  createdAt: Date
  addedBy: {
    id: string
    name: string | null
    email: string
  } | null
}

interface LinkedInUrlsListProps {
  initialUrls?: LinkedInUrl[]
  initialTotal?: number
}

export default function LinkedInUrlsList({ initialUrls = [], initialTotal = 0 }: LinkedInUrlsListProps) {
  const [urls, setUrls] = useState<LinkedInUrl[]>(initialUrls)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchUrls = async (pageNum: number = 1, search: string = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", pageNum.toString())
      params.append("limit", limit.toString())
      if (search.trim()) {
        params.append("search", search.trim())
      }

      const response = await fetch(`/api/linkedin-urls?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUrls(data.urls || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching LinkedIn URLs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (page === 1 && !searchTerm && initialUrls.length > 0) {
      // Use initial data on first load
      return
    }
    fetchUrls(page, searchTerm)
  }, [page, searchTerm])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUrls(1, searchTerm)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">LinkedIn Profile URLs</h2>
          <p className="text-sm text-gray-500 mt-1">
            {total} URL{total !== 1 ? "s" : ""} saved in database
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search URLs, queries, locations..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      {loading && urls.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading URLs...</p>
        </div>
      ) : urls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No LinkedIn URLs found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Use the "Search LinkedIn Profiles" button to add URLs to the database.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {urls.map((url) => (
                  <tr key={url.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-md"
                      >
                        {url.url}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {url.searchQuery || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {url.location && (
                          <div>
                            <span className="font-medium">Location:</span> {url.location}
                          </div>
                        )}
                        {url.company && (
                          <div>
                            <span className="font-medium">Company:</span> {url.company}
                          </div>
                        )}
                        {url.title && (
                          <div>
                            <span className="font-medium">Title:</span> {url.title}
                          </div>
                        )}
                        {!url.location && !url.company && !url.title && "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {url.addedBy?.name || url.addedBy?.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(url.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} URLs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

