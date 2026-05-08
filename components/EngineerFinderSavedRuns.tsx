"use client"

import { useState, useEffect } from "react"

interface SavedRun {
  id: string
  query: string
  filtersJson: any
  resultCount: number
  createdAt: string
  createdBy?: {
    id: string
    name: string | null
    email: string
  }
}

interface EngineerFinderSavedRunsProps {
  onLoadRun?: (runId: string) => void
}

export default function EngineerFinderSavedRuns({ onLoadRun }: EngineerFinderSavedRunsProps) {
  const [runs, setRuns] = useState<SavedRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetails, setRunDetails] = useState<any | null>(null)

  useEffect(() => {
    loadRuns()
  }, [])

  const loadRuns = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/engineer-finder/runs?limit=50")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load runs")
      }

      setRuns(data.runs || [])
    } catch (err: any) {
      setError(err.message || "Failed to load saved runs")
      console.error("Error loading runs:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadRunDetails = async (runId: string) => {
    setSelectedRunId(runId)
    setError(null)

    try {
      const response = await fetch(`/api/engineer-finder/runs?runId=${runId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load run details")
      }

      setRunDetails(data.run)
      if (onLoadRun) {
        onLoadRun(runId)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load run details")
      console.error("Error loading run details:", err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading saved runs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/40">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Saved Search Runs</h3>
            <button
              onClick={loadRuns}
              className="px-3 py-1.5 bg-secondary text-foreground rounded-lg hover:bg-secondary text-xs font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-destructive/15 text-red-800 text-sm">{error}</div>
        )}

        {runs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No saved runs</h3>
            <p className="text-muted-foreground">Run a search to see it saved here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-secondary/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Results
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className={`hover:bg-secondary/40 transition-colors ${
                      selectedRunId === run.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground max-w-md truncate">
                        {run.query}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                        {run.resultCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(run.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {run.createdBy?.name || run.createdBy?.email || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => loadRunDetails(run.id)}
                        className="text-primary hover:text-blue-900 font-medium transition-colors"
                      >
                        View Results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {runDetails && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Run Details</h3>
            <button
              onClick={() => {
                setRunDetails(null)
                setSelectedRunId(null)
              }}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Query</label>
              <div className="bg-secondary/40 rounded-lg p-3 border border-border">
                <code className="text-xs text-foreground break-all">{runDetails.query}</code>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Results ({runDetails.results?.length || 0})</label>
              {runDetails.results && runDetails.results.length > 0 && (
                <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                  {runDetails.results.map((result: any, idx: number) => (
                    <div key={idx} className="bg-secondary/40 rounded-lg p-3 border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <a
                            href={result.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:text-primary hover:underline"
                          >
                            {result.title}
                          </a>
                          <div className="text-xs text-muted-foreground mt-1">{result.displayLink}</div>
                          {result.snippet && (
                            <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{result.snippet}</div>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                            Score: {result.score || 0}
                          </span>
                        </div>
                      </div>
                      {result.signals && result.signals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.signals.map((signal: string, sIdx: number) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center px-2 py-0.5 bg-secondary text-foreground rounded text-xs"
                            >
                              {signal.split(":")[1]?.trim() || signal}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

