"use client"

import { useState } from "react"

export default function LinkedInScraperButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("software engineer")
  const [location, setLocation] = useState("")
  const [company, setCompany] = useState("")
  const [title, setTitle] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [results, setResults] = useState<{
    saved: number
    skipped: number
    total: number
    cached?: boolean
    age_hours?: number
  } | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage("Please enter a search query")
      return
    }

    setLoading(true)
    setMessage(null)
    setResults(null)

    try {
      const params = new URLSearchParams()
      params.append("query", searchQuery.trim())
      params.append("force", "true")
      if (location.trim()) params.append("location", location.trim())
      if (company.trim()) params.append("company", company.trim())
      if (title.trim()) params.append("title", title.trim())

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000) // 15 minutes

      const response = await fetch(`/api/linkedin-profiles?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok) {
        setResults({
          saved: data.saved || 0,
          skipped: data.skipped || 0,
          total: data.total || 0,
          cached: data.cached || false,
          age_hours: data.age_hours,
        })
        setMessage(data.message || `Successfully saved ${data.saved || 0} LinkedIn profile URL${data.saved !== 1 ? "s" : ""}!`)
      } else {
        let errorMsg = data.error || "Failed to search LinkedIn profiles"
        if (data.message) {
          errorMsg += `: ${data.message}`
        }
        if (data.stderr) {
          errorMsg += `\n\nDetails: ${data.stderr.substring(0, 200)}`
        } else if (data.stdout) {
          errorMsg += `\n\nOutput: ${data.stdout.substring(0, 200)}`
        }
        if (data.suggestion) {
          errorMsg += `\n\n${data.suggestion}`
        }
        setMessage(errorMsg)
        console.error("Search error details:", data)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        setMessage(
          "Request timed out. The search may still be running in the background. Please wait a few minutes and try again, or refresh the page to check if the search completed."
        )
      } else if (error.message?.includes("fetch")) {
        setMessage(
          "Connection error. The search may still be running. Please wait a few minutes and try again."
        )
      } else {
        setMessage(`Error: ${error.message || "Failed to search LinkedIn profiles"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleSearch()
    }
  }

  return (
    <div className="relative">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔍 Search & Save LinkedIn URLs
        </button>
      ) : (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg p-4 shadow-lg min-w-[500px]">
          <div className="mb-4">
            <label
              htmlFor="search-query"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Query *
            </label>
            <input
              id="search-query"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., software engineer, machine learning engineer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              disabled={loading}
            />
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Location (optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, New York"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              disabled={loading}
            />
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Company (optional)
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google, Microsoft"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              disabled={loading}
            />
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Job Title (optional)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Engineer, Product Manager"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Searches LinkedIn profiles and saves URLs to database for future reference
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search Profiles"}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setMessage(null)
                setResults(null)
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {message && (
            <div
              className={`mt-3 px-3 py-2 rounded-lg text-sm ${
                message.includes("Success") || message.includes("saved")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
              {results && (
                <div className="mt-2 pt-2 border-t border-green-300 text-xs">
                  <div>Saved: {results.saved}</div>
                  {results.skipped > 0 && (
                    <div>Skipped (already exists): {results.skipped}</div>
                  )}
                  <div>Total found: {results.total}</div>
                  {results.cached && results.age_hours && (
                    <div className="text-gray-600 mt-1">(Cached data, {results.age_hours}h old)</div>
                  )}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>This may take a few minutes...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

