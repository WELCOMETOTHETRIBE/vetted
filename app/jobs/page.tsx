"use client"

import { useState, useEffect, Suspense } from "react"
import { HoverMorph, StaggerContainer, LiquidButton, MagneticElement } from "@/components/AdvancedAnimations"
import { MetricCard, InteractiveBarChart, AnimatedCounter } from "@/components/DataVisualization"
import { SearchFilter } from "@/components/AdvancedForms"

// Mock data for demonstration (in real app, this would come from props)
const mockJobs = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: { name: "TechCorp", logo: null },
    location: "San Francisco, CA",
    isRemote: true,
    salaryMin: 120000,
    salaryMax: 180000,
    createdAt: new Date(),
    applications: [],
    views: 1250
  },
  {
    id: "2",
    title: "Product Manager",
    company: { name: "StartupXYZ", logo: null },
    location: "New York, NY",
    isRemote: false,
    salaryMin: 100000,
    salaryMax: 140000,
    createdAt: new Date(),
    applications: [],
    views: 890
  },
  {
    id: "3",
    title: "Full Stack Developer",
    company: { name: "InnovateLab", logo: null },
    location: "Remote",
    isRemote: true,
    salaryMin: 90000,
    salaryMax: 130000,
    createdAt: new Date(),
    applications: [],
    views: 2100
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: { name: "CloudTech", logo: null },
    location: "Austin, TX",
    isRemote: true,
    salaryMin: 110000,
    salaryMax: 150000,
    createdAt: new Date(),
    applications: [],
    views: 1450
  },
  {
    id: "5",
    title: "UX/UI Designer",
    company: { name: "DesignStudio", logo: null },
    location: "Los Angeles, CA",
    isRemote: false,
    salaryMin: 85000,
    salaryMax: 120000,
    createdAt: new Date(),
    applications: [],
    views: 980
  },
  {
    id: "6",
    title: "Data Scientist",
    company: { name: "DataFlow", logo: null },
    location: "Seattle, WA",
    isRemote: true,
    salaryMin: 130000,
    salaryMax: 170000,
    createdAt: new Date(),
    applications: [],
    views: 1670
  }
]

const mockStats = {
  totalJobs: 1234,
  newThisWeek: 89,
  avgSalary: 125000,
  remoteJobs: 456
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

function SimpleNavbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-gray-900">Vetted</a>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/feed" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Feed</a>
            <a href="/jobs" className="text-blue-600 bg-blue-50 px-3 py-2 rounded-md text-sm font-medium">Jobs</a>
            <a href="/candidates" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Candidates</a>
            <a href="/network" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Network</a>
          </div>
        </div>
      </div>
    </nav>
  )
}

function JobsPageContent() {
  const [jobs, setJobs] = useState(mockJobs)
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid')

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Filter jobs based on query and filters (mock implementation)
      let filteredJobs = mockJobs
      if (query) {
        filteredJobs = filteredJobs.filter(job =>
          job.title.toLowerCase().includes(query.toLowerCase()) ||
          job.company.name.toLowerCase().includes(query.toLowerCase())
        )
      }
      setJobs(filteredJobs)
    }, 500)
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
      <section className="py-12">
        <div className="container-fluid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <HoverMorph>
              <MetricCard
                title="Active Jobs"
                value={mockStats.totalJobs}
                previousValue={1150}
                icon="💼"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="New This Week"
                value={mockStats.newThisWeek}
                previousValue={76}
                icon="✨"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Avg Salary"
                value={mockStats.avgSalary}
                format="currency"
                icon="💰"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Remote Jobs"
                value={mockStats.remoteJobs}
                icon="🏠"
              />
            </HoverMorph>
          </div>
        </div>
      </section>

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
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-fluid-3xl font-bold text-content-primary mb-2">
                    {jobs.length} Jobs Found
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

