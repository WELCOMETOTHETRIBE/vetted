"use client"

import { useState } from "react"

export default function LinkedInProfileSearch() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("software engineer")
  const [location, setLocation] = useState("")
  const [company, setCompany] = useState("")
  const [title, setTitle] = useState("")
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
        setMessage(
          data.message ||
            `Successfully saved ${data.saved || 0} LinkedIn profile URL${data.saved !== 1 ? "s" : ""}!`
        )
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
        setMessage("Connection error. The search may still be running. Please wait a few minutes and try again.")
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">LinkedIn Profile Search</h3>
      <p className="text-sm text-gray-600 mb-4">
        Searches LinkedIn profiles via SerpApi and saves URLs to database for future reference
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query *
          </label>
          <input
            id="search-query"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., software engineer, machine learning engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location (optional)
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, New York"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            Company (optional)
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Google, Microsoft"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Searching..." : "Search & Save LinkedIn URLs"}
        </button>

        {message && (
          <div
            className={`px-4 py-3 rounded-lg text-sm ${
              message.includes("Success") || message.includes("saved")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
            {results && (
              <div className="mt-2 pt-2 border-t border-green-300 text-xs">
                <div>Saved: {results.saved}</div>
                {results.skipped > 0 && <div>Skipped (already exists): {results.skipped}</div>}
                <div>Total found: {results.total}</div>
                {results.cached && results.age_hours && (
                  <div className="text-gray-600 mt-1">(Cached data, {results.age_hours}h old)</div>
                )}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>This may take a few minutes...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

