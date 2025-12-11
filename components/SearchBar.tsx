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
          placeholder="Search people, jobs, companies..."
          className="w-full px-4 py-2.5 pl-11 pr-12 text-sm border border-neutral-300 rounded-xl bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all placeholder:text-neutral-400"
          aria-label="Search"
        />
        <span className="absolute left-3.5 top-3 text-neutral-400 text-base" aria-hidden="true">🔍</span>
        <span className="absolute right-3 top-3 text-xs text-primary-600 font-medium" title="AI-enhanced search" aria-label="AI-enhanced">🤖</span>
      </div>

      {showResults && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto animate-fade-in">
          {loading ? (
            <div className="p-6 text-center text-neutral-600">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : (
            <>
              {results.people && results.people.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
                    People
                  </h3>
                  {results.people.map((person: any) => (
                    <a
                      key={person.id}
                      href={`/profile/${person.handle || person.id}`}
                      className="block px-3 py-2.5 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
                          {person.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {person.name || "Anonymous"}
                          </p>
                          {person.profile?.headline && (
                            <p className="text-xs text-neutral-600 truncate">
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
                <div className="p-2 border-t border-neutral-200">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
                    Jobs
                  </h3>
                  {results.jobs.map((job: any) => (
                    <a
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block px-3 py-2.5 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                    >
                      <p className="text-sm font-semibold text-neutral-900">{job.title}</p>
                      <p className="text-xs text-neutral-600 mt-0.5">{job.company.name}</p>
                    </a>
                  ))}
                </div>
              )}

              {results.companies && results.companies.length > 0 && (
                <div className="p-2 border-t border-neutral-200">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
                    Companies
                  </h3>
                  {results.companies.map((company: any) => (
                    <a
                      key={company.id}
                      href={`/company/${company.slug}`}
                      className="block px-3 py-2.5 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                    >
                      <p className="text-sm font-semibold text-neutral-900">{company.name}</p>
                    </a>
                  ))}
                </div>
              )}

              {results.groups && results.groups.length > 0 && (
                <div className="p-2 border-t border-neutral-200">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 py-2">
                    Groups
                  </h3>
                  {results.groups.map((group: any) => (
                    <a
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="block px-3 py-2.5 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                    >
                      <p className="text-sm font-semibold text-neutral-900">{group.name}</p>
                    </a>
                  ))}
                </div>
              )}

              {(!results.people || results.people.length === 0) &&
                (!results.jobs || results.jobs.length === 0) &&
                (!results.companies || results.companies.length === 0) &&
                (!results.groups || results.groups.length === 0) && (
                  <div className="p-6 text-center text-neutral-500">
                    <p className="text-sm">No results found</p>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

