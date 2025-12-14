"use client"

import { useState, useEffect, Suspense } from "react"
import { HoverMorph, StaggerContainer, LiquidButton, MagneticElement } from "@/components/AdvancedAnimations"
import { MetricCard, InteractiveBarChart, AnimatedCounter } from "@/components/DataVisualization"
import { SearchFilter } from "@/components/AdvancedForms"
import NavbarAdvanced from "@/components/NavbarAdvanced"

// Database job interface
interface DatabaseJob {
  id: string
  title: string
  company: {
    id: string
    name: string
  }
}

interface JobsResponse {
  jobs: DatabaseJob[]
  count: number
}

// Enhanced job interface for UI
interface UIJob {
  id: string
  title: string
  company: { name: string; logo?: string | null }
  location?: string
  isRemote?: boolean
  salaryMin?: number
  salaryMax?: number
  createdAt: Date
  applications: any[]
  views: number
}

// Convert database jobs to UI format
function transformJobs(dbJobs: DatabaseJob[]): UIJob[] {
  return dbJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: {
      name: job.company.name,
      logo: null
    },
    location: "Remote", // Default to remote for now
    isRemote: true, // Default to remote
    salaryMin: 80000, // Default salary range
    salaryMax: 150000,
    createdAt: new Date(),
    applications: [],
    views: Math.floor(Math.random() * 2000) + 500 // Random views for demo
  }))
}

const mockChartData = [
  { label: 'Mon', value: 45 },
  { label: 'Tue', value: 52 },
  { label: 'Wed', value: 38 },
  { label: 'Thu', value: 61 },
  { label: 'Fri', value: 49 },
  { label: 'Sat', value: 23 },
  { label: 'Sun', value: 31 }
]

const filterOptions = [
  {
    key: 'employmentType',
    label: 'Job Type',
    options: [
      { value: 'full-time', label: 'Full Time' },
      { value: 'part-time', label: 'Part Time' },
      { value: 'contract', label: 'Contract' },
      { value: 'internship', label: 'Internship' }
    ]
  },
  {
    key: 'experience',
    label: 'Experience Level',
    options: [
      { value: 'entry', label: 'Entry Level' },
      { value: 'mid', label: 'Mid Level' },
      { value: 'senior', label: 'Senior Level' },
      { value: 'executive', label: 'Executive' }
    ]
  }
]

function JobsNavbar() {
  return (
    <nav className="glass-elevated sticky top-0 z-40 backdrop-blur-xl border-b border-surface-tertiary/50 shadow-elevation-1">
      <div className="container-fluid">
        <div className="flex justify-between items-center h-16">
          {/* Logo - More Prominent */}
          <div className="flex items-center">
            <a href="/feed" className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1">
              <img
                src="/vetted-logo.png"
                alt="Vetted"
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const parent = target.parentElement
                  if (parent && !parent.querySelector(".fallback-logo")) {
                    const fallback = document.createElement("span")
                    fallback.className = "fallback-logo text-2xl font-bold text-primary-600"
                    fallback.textContent = "Vetted"
                    parent.appendChild(fallback)
                  }
                }}
              />
              <span className="hidden md:block text-xl font-bold text-neutral-900">Vetted</span>
            </a>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            <a
              href="/feed"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-content-secondary hover:bg-surface-secondary hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <span className="hidden sm:inline">Feed</span>
              <span className="sm:hidden text-base">📰</span>
            </a>
            <a
              href="/jobs"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-primary-700 bg-primary-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              aria-current="page"
            >
              <span className="hidden sm:inline">Jobs</span>
              <span className="sm:hidden text-base">💼</span>
            </a>
            <a
              href="/candidates"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-content-secondary hover:bg-surface-secondary hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <span className="hidden sm:inline">Candidates</span>
              <span className="sm:hidden text-base">🎯</span>
            </a>
            <a
              href="/network"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-content-secondary hover:bg-surface-secondary hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <span className="hidden sm:inline">Network</span>
              <span className="sm:hidden text-base">👥</span>
            </a>
            <a
              href="/messages"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-content-secondary hover:bg-surface-secondary hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden text-base">💬</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

function JobsPageContent() {
  const [jobs, setJobs] = useState<UIJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid')

  // Fetch jobs from database on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/jobs?limit=50')
        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`)
        }
        const data: JobsResponse = await response.json()
        const transformedJobs = transformJobs(data.jobs)
        setJobs(transformedJobs)
      } catch (err: any) {
        console.error('Error fetching jobs:', err)
        setError(err.message || 'Failed to load jobs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const handleSearch = (query: string, filters: Record<string, string>) => {
    // For now, just filter the existing jobs
    // In a real implementation, this would make an API call with search params
    let filteredJobs = [...jobs]
    if (query) {
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.name.toLowerCase().includes(query.toLowerCase())
      )
    }
    setJobs(filteredJobs)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
      <SimpleNavbar />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10" />
        <div className="container-fluid relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-fluid-4xl md:text-fluid-6xl font-bold mb-6 text-gradient animate-fade-in-up">
              Discover Your Next Opportunity
            </h1>
            <p className="text-fluid-xl text-content-secondary mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Find the perfect job from top companies with AI-powered matching and real-time insights
            </p>

            {/* Advanced Search */}
            <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <SearchFilter
                placeholder="Search jobs, companies, skills..."
                filters={filterOptions}
                onSearch={handleSearch}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {!error && (
        <section className="py-12">
          <div className="container-fluid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <HoverMorph>
                <MetricCard
                  title="Active Jobs"
                  value={jobs.length}
                  previousValue={Math.max(0, jobs.length - 10)}
                  icon="💼"
                />
              </HoverMorph>
              <HoverMorph>
                <MetricCard
                  title="Remote Jobs"
                  value={jobs.filter(job => job.isRemote).length}
                  previousValue={Math.max(0, jobs.filter(job => job.isRemote).length - 5)}
                  icon="🏠"
                />
              </HoverMorph>
              <HoverMorph>
                <MetricCard
                  title="Avg Salary"
                  value={jobs.length > 0
                    ? Math.round(jobs.reduce((sum, job) => sum + ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2, 0) / jobs.length)
                    : 0
                  }
                  format="currency"
                  icon="💰"
                />
              </HoverMorph>
              <HoverMorph>
                <MetricCard
                  title="Total Views"
                  value={jobs.reduce((sum, job) => sum + job.views, 0)}
                  icon="👁️"
                />
              </HoverMorph>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12">
        <div className="container-fluid">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              {/* Job Activity Chart */}
              <HoverMorph className="card-modern p-6">
                <h3 className="text-lg font-semibold mb-4 text-content-primary">Weekly Activity</h3>
                <InteractiveBarChart data={mockChartData} height={200} />
              </HoverMorph>

              {/* Filters */}
              <HoverMorph className="card-modern p-6">
                <h3 className="text-lg font-semibold mb-4 text-content-primary">Quick Filters</h3>
                <div className="space-y-3">
                  <MagneticElement>
                    <LiquidButton className="w-full justify-start">
                      <span>🌍</span>
                      <span>Remote Only</span>
                    </LiquidButton>
                  </MagneticElement>
                  <MagneticElement>
                    <LiquidButton variant="secondary" className="w-full justify-start">
                      <span>💰</span>
                      <span>High Salary</span>
                    </LiquidButton>
                  </MagneticElement>
                  <MagneticElement>
                    <LiquidButton variant="secondary" className="w-full justify-start">
                      <span>🚀</span>
                      <span>Tech Companies</span>
                    </LiquidButton>
                  </MagneticElement>
                </div>
              </HoverMorph>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2">Failed to Load Jobs</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-fluid-3xl font-bold text-content-primary mb-2">
                        {isLoading ? "Loading..." : `${jobs.length} Jobs Found`}
                      </h2>
                      <p className="text-content-secondary">
                        Updated in real-time • AI-powered recommendations
                      </p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveView('grid')}
                        className={`p-2 rounded-xl transition-colors ${
                          activeView === 'grid'
                            ? 'bg-primary-500 text-white'
                            : 'text-content-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setActiveView('list')}
                        className={`p-2 rounded-xl transition-colors ${
                          activeView === 'list'
                            ? 'bg-primary-500 text-white'
                            : 'text-content-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Jobs List/Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <HoverMorph key={i} className="card-modern p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-surface-tertiary rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-surface-tertiary rounded w-3/4" />
                            <div className="h-3 bg-surface-tertiary rounded w-1/2" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-surface-tertiary rounded" />
                          <div className="h-3 bg-surface-tertiary rounded w-5/6" />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-surface-tertiary rounded w-20" />
                          <div className="h-8 bg-surface-tertiary rounded-lg w-24" />
                        </div>
                      </div>
                    </HoverMorph>
                  ))}
                </div>
              ) : (
                <StaggerContainer className={`gap-6 ${activeView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}`}>
                  {jobs.map((job, index) => (
                    <HoverMorph key={job.id} className={`card-modern p-6 group cursor-pointer animate-on-scroll`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {job.company.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-content-primary group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-sm text-content-secondary mb-2">{job.company.name}</p>
                          <div className="flex items-center gap-4 text-xs text-content-tertiary">
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              {job.location}
                            </span>
                            {job.isRemote && (
                              <span className="flex items-center gap-1">
                                <span>🏠</span>
                                Remote
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-sm text-content-secondary">
                          <span className="flex items-center gap-1">
                            <span>👁️</span>
                            {job.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📄</span>
                            {job.applications?.length || 0}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-success-600">
                          ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <MagneticElement>
                          <LiquidButton className="flex-1">
                            <span>Apply Now</span>
                            <span>🚀</span>
                          </LiquidButton>
                        </MagneticElement>
                        <MagneticElement>
                          <LiquidButton variant="secondary" className="px-4">
                            <span>💾</span>
                          </LiquidButton>
                        </MagneticElement>
                      </div>
                    </HoverMorph>
                  ))}
                </StaggerContainer>
              )}

              {/* Load More */}
              {!isLoading && jobs.length > 0 && (
                <div className="text-center mt-12">
                  <MagneticElement>
                    <LiquidButton variant="secondary" className="px-8 py-3">
                      <span>Load More Jobs</span>
                      <span>⬇️</span>
                    </LiquidButton>
                  </MagneticElement>
                </div>
              )}
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
        <SimpleNavbar />
        <div className="container-fluid py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-content-secondary">Loading jobs...</p>
          </div>
        </div>
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  )
}

