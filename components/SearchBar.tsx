"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      // Enable AI-enhanced search by default
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&ai=true`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setShowResults(true)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search people, jobs, companies... (AI-enhanced)"
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        <span className="absolute right-3 top-2.5 text-xs text-blue-600" title="AI-enhanced search">🤖</span>
      </div>

      {showResults && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-600">Searching...</div>
          ) : (
            <>
              {results.people && results.people.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                    People
                  </h3>
                  {results.people.map((person: any) => (
                    <a
                      key={person.id}
                      href={`/profile/${person.handle || person.id}`}
                      className="block px-2 py-2 hover:bg-gray-100 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                          {person.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {person.name || "Anonymous"}
                          </p>
                          {person.profile?.headline && (
                            <p className="text-xs text-gray-600">
                              {person.profile.headline}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {results.jobs && results.jobs.length > 0 && (
                <div className="p-2 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                    Jobs
                  </h3>
                  {results.jobs.map((job: any) => (
                    <a
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block px-2 py-2 hover:bg-gray-100 rounded"
                    >
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-600">{job.company.name}</p>
                    </a>
                  ))}
                </div>
              )}

              {results.companies && results.companies.length > 0 && (
                <div className="p-2 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                    Companies
                  </h3>
                  {results.companies.map((company: any) => (
                    <a
                      key={company.id}
                      href={`/company/${company.slug}`}
                      className="block px-2 py-2 hover:bg-gray-100 rounded"
                    >
                      <p className="text-sm font-medium text-gray-900">{company.name}</p>
                    </a>
                  ))}
                </div>
              )}

              {results.groups && results.groups.length > 0 && (
                <div className="p-2 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                    Groups
                  </h3>
                  {results.groups.map((group: any) => (
                    <a
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="block px-2 py-2 hover:bg-gray-100 rounded"
                    >
                      <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    </a>
                  ))}
                </div>
              )}

              {(!results.people || results.people.length === 0) &&
                (!results.jobs || results.jobs.length === 0) &&
                (!results.companies || results.companies.length === 0) &&
                (!results.groups || results.groups.length === 0) && (
                  <div className="p-4 text-center text-gray-600">
                    No results found
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

