"use client"

import { useState, useEffect } from "react"
import { queryTemplates, getTemplateById, type QueryTemplate } from "@/lib/engineerFinder/templates"
import { buildQuery, validateQuery, type QueryVariables } from "@/lib/engineerFinder/queryBuilder"
import { keywordPacks, type KeywordPackName } from "@/lib/engineerFinder/keywordPacks"
import EngineerFinderResults from "./EngineerFinderResults"
import EngineerFinderSavedRuns from "./EngineerFinderSavedRuns"

interface SearchResult {
  title: string
  link: string
  displayLink: string
  snippet?: string
  source: string
  signals: string[]
  score: number
  enrichment?: any
}

export default function EngineerFinder() {
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplate | null>(null)
  const [queryVariables, setQueryVariables] = useState<QueryVariables>({
    location: "San Francisco",
    roleKeywords: "AI Engineer",
    seniority: [],
    domainFocus: [],
    includeKeywords: [],
    excludeKeywords: [],
  })
  const [finalQuery, setFinalQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"search" | "history">("search")

  // Update final query when template or variables change
  useEffect(() => {
    if (selectedTemplate) {
      const query = buildQuery(selectedTemplate, queryVariables)
      setFinalQuery(query)
    } else {
      setFinalQuery("")
    }
  }, [selectedTemplate, queryVariables])

  // Load template defaults when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setQueryVariables((prev) => ({
        ...prev,
        ...selectedTemplate.defaultVars,
      }))
    }
  }, [selectedTemplate])

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId)
    if (template) {
      setSelectedTemplate(template)
      setError(null)
    }
  }

  const handleSearch = async () => {
    if (!selectedTemplate) {
      setError("Please select a template first")
      return
    }

    const validation = validateQuery(finalQuery)
    if (!validation.valid) {
      setError(validation.error || "Invalid query")
      return
    }

    setSearching(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch("/api/engineer-finder/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: finalQuery,
          maxResults: 10,
          page: 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Search failed")
      }

      setResults(data.results || [])
      setRunId(data.runId || null)
    } catch (err: any) {
      setError(err.message || "Failed to search")
      console.error("Search error:", err)
    } finally {
      setSearching(false)
    }
  }

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(finalQuery)
    // You could add a toast notification here
  }

  const handleAddKeyword = (type: "include" | "exclude", keyword: string) => {
    if (!keyword.trim()) return

    if (type === "include") {
      setQueryVariables((prev) => ({
        ...prev,
        includeKeywords: [...(prev.includeKeywords || []), keyword.trim()],
      }))
    } else {
      setQueryVariables((prev) => ({
        ...prev,
        excludeKeywords: [...(prev.excludeKeywords || []), keyword.trim()],
      }))
    }
  }

  const handleRemoveKeyword = (type: "include" | "exclude", index: number) => {
    if (type === "include") {
      setQueryVariables((prev) => ({
        ...prev,
        includeKeywords: prev.includeKeywords?.filter((_, i) => i !== index) || [],
      }))
    } else {
      setQueryVariables((prev) => ({
        ...prev,
        excludeKeywords: prev.excludeKeywords?.filter((_, i) => i !== index) || [],
      }))
    }
  }

  const handleAddKeywordPack = (packName: KeywordPackName) => {
    const keywords = keywordPacks[packName]
    setQueryVariables((prev) => ({
      ...prev,
      includeKeywords: [...(prev.includeKeywords || []), ...keywords],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
              activeTab === "search"
                ? "text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </div>
            {activeTab === "search" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
              activeTab === "history"
                ? "text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </div>
            {activeTab === "history" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        </div>
      </div>

      {activeTab === "search" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Template & Variables */}
          <div className="lg:col-span-1 space-y-4">
            {/* Template Picker */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Query Template</label>
              <select
                value={selectedTemplate?.id || ""}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select a template...</option>
                {queryTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="mt-2 text-xs text-gray-600">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Variables Form */}
            {selectedTemplate && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Search Variables</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={queryVariables.location || ""}
                    onChange={(e) => setQueryVariables((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="San Francisco"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company (optional)</label>
                  <input
                    type="text"
                    value={queryVariables.company || ""}
                    onChange={(e) => setQueryVariables((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Google, Microsoft"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role Keywords</label>
                  <input
                    type="text"
                    value={queryVariables.roleKeywords || ""}
                    onChange={(e) => setQueryVariables((prev) => ({ ...prev, roleKeywords: e.target.value }))}
                    placeholder="AI Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Seniority (multi-select)</label>
                  <div className="space-y-2">
                    {["Staff", "Principal", "Distinguished", "Tech Lead"].map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={queryVariables.seniority?.includes(level)}
                          onChange={(e) => {
                            const current = queryVariables.seniority || []
                            if (e.target.checked) {
                              setQueryVariables((prev) => ({ ...prev, seniority: [...current, level] }))
                            } else {
                              setQueryVariables((prev) => ({
                                ...prev,
                                seniority: current.filter((s) => s !== level),
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Domain Focus (multi-select)</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {[
                      "distributed systems",
                      "performance",
                      "ml systems",
                      "security",
                      "compilers",
                      "databases",
                    ].map((domain) => (
                      <label key={domain} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={queryVariables.domainFocus?.includes(domain)}
                          onChange={(e) => {
                            const current = queryVariables.domainFocus || []
                            if (e.target.checked) {
                              setQueryVariables((prev) => ({ ...prev, domainFocus: [...current, domain] }))
                            } else {
                              setQueryVariables((prev) => ({
                                ...prev,
                                domainFocus: current.filter((d) => d !== domain),
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs text-gray-700">{domain}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Include Keywords</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {queryVariables.includeKeywords?.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword("include", idx)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add keyword..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddKeyword("include", e.currentTarget.value)
                          e.currentTarget.value = ""
                        }
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Quick Add Packs:</label>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(keywordPacks).map((packName) => (
                        <button
                          key={packName}
                          onClick={() => handleAddKeywordPack(packName as KeywordPackName)}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                        >
                          +{packName}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Exclude Keywords</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {queryVariables.excludeKeywords?.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword("exclude", idx)}
                          className="ml-1 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Exclude keyword..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddKeyword("exclude", e.currentTarget.value)
                        e.currentTarget.value = ""
                      }
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Main Area - Query Preview & Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Query Preview */}
            {selectedTemplate && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Query Preview</label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyQuery}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium"
                    >
                      Copy Query
                    </button>
                    <button
                      onClick={handleSearch}
                      disabled={searching || !finalQuery}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                    >
                      {searching ? "Searching..." : "Run Search"}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <code className="text-xs text-gray-800 break-all">{finalQuery || "Select a template to see query..."}</code>
                </div>
                {error && (
                  <div className="mt-2 px-3 py-2 bg-red-100 text-red-800 rounded text-xs">{error}</div>
                )}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <EngineerFinderResults results={results} runId={runId} />
            )}

            {searching && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Searching via SerpApi...</p>
              </div>
            )}

            {!selectedTemplate && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Template</h3>
                <p className="text-gray-600">Choose a query template from the left to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <EngineerFinderSavedRuns
          onLoadRun={async (runId) => {
            setActiveTab("search")
            setError(null)
            setSearching(true)
            setResults([])

            try {
              const response = await fetch(`/api/engineer-finder/runs?runId=${runId}`)
              const data = await response.json()

              if (!response.ok) {
                throw new Error(data.error || "Failed to load run")
              }

              if (data.run && data.run.results) {
                setResults(data.run.results)
                setRunId(data.run.id)
              }
            } catch (err: any) {
              setError(err.message || "Failed to load run results")
            } finally {
              setSearching(false)
            }
          }}
        />
      )}
    </div>
  )
}

