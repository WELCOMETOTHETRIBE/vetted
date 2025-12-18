"use client"

import { useState } from "react"

type ATSSystem =
  | "ashby"
  | "greenhouse"
  | "lever"
  | "workday"
  | "workday_wd5"
  | "smartrecruiters"
  | "jobvite"
  | "icims"
  | "icims_careers"
  | "workable"
  | "workable_jobs"
  | "taleo"

interface ATSConfig {
  label: string
  site: string
  defaultQuery: string
  description: string
  category: "primary" | "enterprise" | "modern"
}

const ATS_CONFIG: Record<ATSSystem, ATSConfig> = {
  ashby: {
    label: "Ashby",
    site: "jobs.ashbyhq.com",
    defaultQuery: "software engineer",
    description: "Modern ATS used by startups",
    category: "primary",
  },
  greenhouse: {
    label: "Greenhouse",
    site: "boards.greenhouse.io",
    defaultQuery: "software engineer",
    description: "Popular ATS for tech companies",
    category: "primary",
  },
  lever: {
    label: "Lever",
    site: "lever.co",
    defaultQuery: "software engineer",
    description: "Modern recruiting platform",
    category: "primary",
  },
  workday: {
    label: "Workday",
    site: "myworkdayjobs.com",
    defaultQuery: "software engineer",
    description: "Enterprise ATS platform",
    category: "enterprise",
  },
  workday_wd5: {
    label: "Workday (wd5)",
    site: "wd5.myworkdayjobs.com",
    defaultQuery: "machine learning engineer",
    description: "Workday alternative domain",
    category: "enterprise",
  },
  smartrecruiters: {
    label: "SmartRecruiters",
    site: "jobs.smartrecruiters.com",
    defaultQuery: "software engineer",
    description: "Cloud-based recruiting platform",
    category: "modern",
  },
  jobvite: {
    label: "Jobvite",
    site: "jobs.jobvite.com",
    defaultQuery: "software engineer",
    description: "Talent acquisition suite",
    category: "modern",
  },
  icims: {
    label: "iCIMS",
    site: "icims.com",
    defaultQuery: "software engineer",
    description: "Enterprise talent acquisition",
    category: "enterprise",
  },
  icims_careers: {
    label: "iCIMS Careers",
    site: "careers.icims.com",
    defaultQuery: "software engineer",
    description: "iCIMS careers portal",
    category: "enterprise",
  },
  workable: {
    label: "Workable",
    site: "apply.workable.com",
    defaultQuery: "software engineer",
    description: "Hiring and onboarding platform",
    category: "modern",
  },
  workable_jobs: {
    label: "Workable Jobs",
    site: "jobs.workable.com",
    defaultQuery: "software engineer",
    description: "Workable job board",
    category: "modern",
  },
  taleo: {
    label: "Taleo (Oracle)",
    site: "taleo.net",
    defaultQuery: "software engineer",
    description: "Oracle's talent management",
    category: "enterprise",
  },
}

const ROLE_PRESETS = [
  "software engineer",
  "machine learning engineer",
  "AI engineer",
  "backend engineer",
  "frontend engineer",
  "full stack engineer",
  "product manager",
  "product designer",
  "data engineer",
  "security engineer",
  "devops engineer",
  "site reliability engineer",
]

function buildQuery(system: ATSSystem, query: string): string {
  const config = ATS_CONFIG[system]
  const baseQuery = query.trim()

  // Handle special query patterns
  if (system === "icims") {
    return `site:icims.com inurl:/jobs/ "${baseQuery}"`
  }
  if (system === "taleo") {
    return `site:taleo.net inurl:careersection "${baseQuery}"`
  }
  if (system === "greenhouse") {
    return `site:boards.greenhouse.io "${baseQuery}"`
  }
  if (system === "lever") {
    return `site:lever.co "${baseQuery}"`
  }
  if (system === "ashby") {
    return `site:jobs.ashbyhq.com "${baseQuery}"`
  }

  // Default pattern
  return `site:${config.site} "${baseQuery}"`
}

export default function ATSJobScraper() {
  const [activeTab, setActiveTab] = useState<"primary" | "enterprise" | "modern">("primary")
  const [selectedSystem, setSelectedSystem] = useState<ATSSystem>("ashby")
  const [searchQuery, setSearchQuery] = useState(ATS_CONFIG.ashby.defaultQuery)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
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

  const handleSystemChange = (system: ATSSystem) => {
    setSelectedSystem(system)
    setSearchQuery(ATS_CONFIG[system].defaultQuery)
    setMessage(null)
    setResults(null)
    setImportResults(null)
  }

  const handlePresetClick = (preset: string) => {
    setSearchQuery(preset)
  }

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
      const sourceParam = encodeURIComponent(selectedSystem)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000) // 15 minutes

      const response = await fetch(
        `/api/ashby-jobs?query=${queryParam}&source=${sourceParam}&force=true`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok) {
        const count = data.count || data.jobs?.length || 0
        setResults({
          count,
          cached: data.cached || false,
          age_hours: data.age_hours,
        })
        setMessage(`Successfully scraped ${count} job${count !== 1 ? "s" : ""}!`)
      } else {
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
      if (error.name === "AbortError") {
        setMessage(
          "Request timed out. The scraper may still be running in the background. Please wait a few minutes and try again, or refresh the page to check if the scrape completed."
        )
      } else if (error.message?.includes("fetch")) {
        setMessage("Connection error. The scraper may still be running. Please wait a few minutes and try again.")
      } else {
        setMessage(`Error: ${error.message || "Failed to scrape jobs"}`)
      }
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

  const finalQuery = buildQuery(selectedSystem, searchQuery)
  const systemsByCategory = {
    primary: (Object.keys(ATS_CONFIG) as ATSSystem[]).filter(
      (s) => ATS_CONFIG[s].category === "primary"
    ),
    enterprise: (Object.keys(ATS_CONFIG) as ATSSystem[]).filter(
      (s) => ATS_CONFIG[s].category === "enterprise"
    ),
    modern: (Object.keys(ATS_CONFIG) as ATSSystem[]).filter(
      (s) => ATS_CONFIG[s].category === "modern"
    ),
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">ATS Job Scraper</h3>
      <p className="text-sm text-gray-600 mb-6">
        Scrape job postings from various ATS platforms using Google search queries
      </p>

      {/* Category Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab("primary")}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "primary"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Primary
          {activeTab === "primary" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("enterprise")}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "enterprise"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Enterprise
          {activeTab === "enterprise" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("modern")}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "modern"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Modern
          {activeTab === "modern" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* ATS System Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {systemsByCategory[activeTab].map((system) => {
          const config = ATS_CONFIG[system]
          const isSelected = selectedSystem === system
          return (
            <button
              key={system}
              onClick={() => handleSystemChange(system)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="font-medium text-sm text-gray-900">{config.label}</div>
              <div className="text-xs text-gray-500 mt-1">{config.description}</div>
              <div className="text-xs text-gray-400 mt-1 truncate">{config.site}</div>
            </button>
          )
        })}
      </div>

      {/* Selected System Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-medium text-gray-900">{ATS_CONFIG[selectedSystem].label}</div>
            <div className="text-sm text-gray-600">{ATS_CONFIG[selectedSystem].site}</div>
          </div>
        </div>
      </div>

      {/* Role Presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Role Presets</label>
        <div className="flex flex-wrap gap-2">
          {ROLE_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Search Query Input */}
      <div className="mb-4">
        <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
          Search Query
        </label>
        <input
          id="search-query"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., software engineer, machine learning"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Keep queries simple (avoid Boolean operators like OR/AND)
        </p>
      </div>

      {/* Query Preview */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Query Preview</label>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <code className="text-xs text-gray-800 break-all">{finalQuery}</code>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleScrape}
          disabled={loading || !searchQuery.trim()}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Scraping..." : "Start Scraping"}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(finalQuery)
            // Could add toast notification here
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          Copy Query
        </button>
      </div>

      {/* Results */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm mb-4 ${
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
              {importResults.skipped > 0 && <div>Skipped: {importResults.skipped}</div>}
              {importResults.errors > 0 && (
                <div className="text-red-600">Errors: {importResults.errors}</div>
              )}
            </div>
          )}
        </div>
      )}

      {results && results.count > 0 && !importResults && (
        <div className="mb-4">
          <button
            onClick={handleImport}
            disabled={importing || loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {importing ? "Importing Jobs..." : `Import ${results.count} Jobs to Database`}
          </button>
          <p className="mt-1 text-xs text-gray-500 text-center">
            This will add the scraped jobs to the Jobs tab
          </p>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span>This may take a few minutes...</span>
          </div>
        </div>
      )}
    </div>
  )
}

