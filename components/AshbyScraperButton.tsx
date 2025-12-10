"use client"

import { useState } from "react"

export default function AshbyScraperButton() {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("software engineer")
  const [showForm, setShowForm] = useState(false)
  const [results, setResults] = useState<{
    count: number
    cached: boolean
    age_hours?: number
  } | null>(null)
  const [importResults, setImportResults] = useState<{
    created: number
    skipped: number
    errors: number
  } | null>(null)

  const handleScrape = async () => {
    if (!searchQuery.trim()) {
      setMessage("Please enter a search query")
      return
    }

    setLoading(true)
    setMessage(null)
    setResults(null)

    try {
      const queryParam = encodeURIComponent(searchQuery.trim())
      const response = await fetch(
        `/api/ashby-jobs?query=${queryParam}&force=true`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      )

      const data = await response.json()

      if (response.ok) {
        const count = data.count || data.jobs?.length || 0
        setResults({
          count,
          cached: data.cached || false,
          age_hours: data.age_hours,
        })
        setMessage(
          `Successfully scraped ${count} job${count !== 1 ? "s" : ""}!`
        )
      } else {
        // Show detailed error message
        let errorMsg = data.error || "Failed to scrape jobs"
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
        console.error("Scraper error details:", data)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message || "Failed to scrape jobs"}`)
      } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!confirm("This will import the scraped jobs into the database. Continue?")) {
      return
    }

    setImporting(true)
    setMessage(null)
    setImportResults(null)

    try {
      const response = await fetch("/api/ashby-jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setImportResults({
          created: data.created || 0,
          skipped: data.skipped || 0,
          errors: data.errors || 0,
        })
        setMessage(
          `Successfully imported ${data.created} job${data.created !== 1 ? "s" : ""}!` +
          (data.skipped > 0 ? ` ${data.skipped} skipped (already exist).` : "") +
          (data.errors > 0 ? ` ${data.errors} errors.` : "")
        )
        // Refresh the page after a delay to show new jobs
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setMessage(`Error: ${data.error || "Failed to import jobs"}`)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message || "Failed to import jobs"}`)
    } finally {
      setImporting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleScrape()
    }
  }

  return (
    <div className="relative">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Scrape Ashby Jobs
        </button>
      ) : (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg p-4 shadow-lg min-w-[400px]">
          <div className="mb-4">
            <label
              htmlFor="search-query"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Query
            </label>
            <input
              id="search-query"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., software engineer, machine learning"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Searches for jobs on Ashby-powered job boards
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleScrape}
              disabled={loading || !searchQuery.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Scraping..." : "Start Scraping"}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setMessage(null)
                setResults(null)
                setImportResults(null)
              }}
              disabled={loading || importing}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {message && (
            <div
              className={`mt-3 px-3 py-2 rounded-lg text-sm ${
                message.includes("Success")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
              {results && (
                <div className="mt-1 text-xs">
                  {results.cached && results.age_hours
                    ? `(Cached data, ${results.age_hours}h old)`
                    : "(Fresh scrape)"}
                </div>
              )}
              {importResults && (
                <div className="mt-2 pt-2 border-t border-green-300 text-xs">
                  <div>Created: {importResults.created}</div>
                  {importResults.skipped > 0 && (
                    <div>Skipped: {importResults.skipped}</div>
                  )}
                  {importResults.errors > 0 && (
                    <div className="text-red-600">Errors: {importResults.errors}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {results && results.count > 0 && !importResults && (
            <div className="mt-3">
              <button
                onClick={handleImport}
                disabled={importing || loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? "Importing Jobs..." : `Import ${results.count} Jobs to Database`}
              </button>
              <p className="mt-1 text-xs text-gray-500 text-center">
                This will add the scraped jobs to the Jobs tab
              </p>
            </div>
          )}

          {loading && (
            <div className="mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>This may take a few minutes...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

