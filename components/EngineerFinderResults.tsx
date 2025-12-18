"use client"

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Results ({results.length})
          </h3>
          {runId && (
            <span className="text-xs text-gray-500">Run ID: {runId.substring(0, 8)}...</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
            {sortedResults.map((result, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
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
            ))}
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

