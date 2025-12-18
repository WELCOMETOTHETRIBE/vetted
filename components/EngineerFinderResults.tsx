"use client"

import { useState } from "react"

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

interface EngineerFinderResultsProps {
  results: SearchResult[]
  runId?: string | null
}

export default function EngineerFinderResults({ results, runId }: EngineerFinderResultsProps) {
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [savedLinks, setSavedLinks] = useState<Set<string>>(new Set())

  const toggleSelection = (index: number) => {
    setSelectedResults((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set())
    } else {
      setSelectedResults(new Set(results.map((_, idx) => idx)))
    }
  }

  const handleSaveSelected = async () => {
    if (selectedResults.size === 0) {
      setSaveMessage({ type: "error", text: "Please select at least one candidate to save" })
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const candidatesToSave = Array.from(selectedResults).map((idx) => results[idx])

      const response = await fetch("/api/engineer-finder/save-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: candidatesToSave }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save candidates")
      }

      // Mark saved links
      const savedLinksSet = new Set(savedLinks)
      candidatesToSave.forEach((candidate) => {
        if (candidate.source === "linkedin") {
          savedLinksSet.add(candidate.link)
        }
      })
      setSavedLinks(savedLinksSet)

      setSaveMessage({
        type: "success",
        text: `Successfully saved ${data.saved} candidate${data.saved !== 1 ? "s" : ""}. ${data.skipped > 0 ? `${data.skipped} skipped (already exist).` : ""}`,
      })

      // Clear selection after successful save
      setSelectedResults(new Set())
    } catch (error: any) {
      setSaveMessage({
        type: "error",
        text: error.message || "Failed to save candidates",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveFromSelection = (index: number) => {
    setSelectedResults((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }
  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "linkedin":
        return "bg-blue-100 text-blue-800"
      case "github":
        return "bg-gray-100 text-gray-800"
      case "scholar":
        return "bg-green-100 text-green-800"
      case "youtube":
        return "bg-red-100 text-red-800"
      case "patents":
        return "bg-purple-100 text-purple-800"
      case "stackoverflow":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800"
    if (score >= 40) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  const sortedResults = [...results].sort((a, b) => (b.score || 0) - (a.score || 0))
  const allSelected = selectedResults.size === results.length && results.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Results ({results.length})
            </h3>
            {selectedResults.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedResults.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedResults.size > 0 && (
              <button
                onClick={handleSaveSelected}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {saving ? "Saving..." : `Save Selected (${selectedResults.size})`}
              </button>
            )}
            {runId && (
              <span className="text-xs text-gray-500">Run ID: {runId.substring(0, 8)}...</span>
            )}
          </div>
        </div>
        {saveMessage && (
          <div
            className={`mt-3 px-4 py-2 rounded-lg text-sm ${
              saveMessage.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {saveMessage.text}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Snippet
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Signals
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResults.map((result, idx) => {
              const isSelected = selectedResults.has(idx)
              const isSaved = result.source === "linkedin" && savedLinks.has(result.link)
              const isLinkedIn = result.source === "linkedin"

              return (
                <tr
                  key={idx}
                  className={`hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  } ${isSaved ? "opacity-75" : ""}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isLinkedIn ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(idx)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-xs text-gray-400" title="Only LinkedIn profiles can be saved">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 max-w-xs">
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {result.title}
                    </a>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{result.displayLink}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(
                      result.source
                    )}`}
                  >
                    {result.source}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-md line-clamp-2">
                    {result.snippet || "No snippet available"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {result.signals.slice(0, 3).map((signal, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {signal.split(":")[1]?.trim() || signal}
                      </span>
                    ))}
                    {result.signals.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        +{result.signals.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(
                      result.score
                    )}`}
                  >
                    {result.score}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {isSaved && (
                      <span className="text-xs text-green-600 font-medium" title="Saved to candidates">
                        ✓ Saved
                      </span>
                    )}
                    {isSelected && !isSaved && (
                      <button
                        onClick={() => handleRemoveFromSelection(idx)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                        title="Remove from selection"
                      >
                        Remove
                      </button>
                    )}
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                    >
                      Open
                    </a>
                    {result.enrichment && (
                      <div className="text-xs text-gray-500" title={JSON.stringify(result.enrichment, null, 2)}>
                        ⭐
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )
            })}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search query or filters</p>
        </div>
      )}
    </div>
  )
}

