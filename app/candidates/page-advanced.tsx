"use client"

import { useState, useEffect } from "react"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import { HoverMorph, StaggerContainer, LiquidButton, MagneticElement } from "@/components/AdvancedAnimations"
import { MetricCard, AnimatedCounter } from "@/components/DataVisualization"
import { SearchFilter } from "@/components/AdvancedForms"

// Mock candidate data for demonstration
const mockCandidates = [
  {
    id: "1",
    name: "Sarah Johnson",
    title: "Senior Software Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    skills: ["React", "Node.js", "TypeScript", "AWS"],
    experience: 6,
    status: "active",
    matchScore: 95
  },
  {
    id: "2",
    name: "Michael Chen",
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "New York, NY",
    skills: ["Python", "Django", "PostgreSQL", "Docker"],
    experience: 4,
    status: "contacted",
    matchScore: 87
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    title: "Product Manager",
    company: "InnovateLab",
    location: "Austin, TX",
    skills: ["Product Strategy", "Agile", "Analytics", "Leadership"],
    experience: 8,
    status: "qualified",
    matchScore: 92
  }
]

const mockStats = {
  totalCandidates: 2847,
  activeCandidates: 1234,
  contactedThisWeek: 156,
  avgMatchScore: 78
}

const filterOptions = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'hired', label: 'Hired' }
    ]
  },
  {
    key: 'experience',
    label: 'Experience',
    options: [
      { value: '0-2', label: '0-2 years' },
      { value: '3-5', label: '3-5 years' },
      { value: '6-10', label: '6-10 years' },
      { value: '10+', label: '10+ years' }
    ]
  },
  {
    key: 'location',
    label: 'Location',
    options: [
      { value: 'sf', label: 'San Francisco' },
      { value: 'nyc', label: 'New York' },
      { value: 'la', label: 'Los Angeles' },
      { value: 'remote', label: 'Remote' }
    ]
  }
]

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState(mockCandidates)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Filter candidates based on query and filters (mock implementation)
      let filteredCandidates = mockCandidates
      if (query) {
        filteredCandidates = filteredCandidates.filter(candidate =>
          candidate.name.toLowerCase().includes(query.toLowerCase()) ||
          candidate.title.toLowerCase().includes(query.toLowerCase()) ||
          candidate.company.toLowerCase().includes(query.toLowerCase())
        )
      }
      setCandidates(filteredCandidates)
    }, 500)
  }

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary-100 text-primary-700'
      case 'contacted': return 'bg-warning-100 text-warning-700'
      case 'qualified': return 'bg-success-100 text-success-700'
      case 'hired': return 'bg-secondary-100 text-secondary-700'
      default: return 'bg-neutral-100 text-neutral-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
      <NavbarAdvanced />

      {/* Header Section */}
      <section className="py-12">
        <div className="container-fluid">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-fluid-4xl font-bold text-gradient mb-2">
                Candidate Pipeline
              </h1>
              <p className="text-fluid-lg text-content-secondary">
                Discover and manage top talent with AI-powered insights
              </p>
            </div>

            <div className="flex gap-3">
              <MagneticElement>
                <LiquidButton variant="secondary">
                  <span>📊</span>
                  <span>Export Data</span>
                </LiquidButton>
              </MagneticElement>
              <MagneticElement>
                <LiquidButton>
                  <span>➕</span>
                  <span>Add Candidate</span>
                </LiquidButton>
              </MagneticElement>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <HoverMorph>
              <MetricCard
                title="Total Candidates"
                value={mockStats.totalCandidates}
                icon="👥"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Active Pipeline"
                value={mockStats.activeCandidates}
                icon="🎯"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Contacted This Week"
                value={mockStats.contactedThisWeek}
                icon="💬"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Avg Match Score"
                value={mockStats.avgMatchScore}
                format="percentage"
                icon="📈"
              />
            </HoverMorph>
          </div>

          {/* Advanced Search */}
          <HoverMorph className="max-w-4xl">
            <SearchFilter
              placeholder="Search candidates by name, title, company, skills..."
              filters={filterOptions}
              onSearch={handleSearch}
            />
          </HoverMorph>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-12">
        <div className="container-fluid">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Candidates List */}
            <div className="flex-1">
              {/* Bulk Actions */}
              {selectedCandidates.length > 0 && (
                <HoverMorph className="card-modern p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-content-secondary">
                      {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <MagneticElement>
                        <LiquidButton variant="secondary" className="px-4 py-2 text-sm">
                          <span>💬</span>
                          <span>Bulk Message</span>
                        </LiquidButton>
                      </MagneticElement>
                      <MagneticElement>
                        <LiquidButton variant="secondary" className="px-4 py-2 text-sm">
                          <span>📋</span>
                          <span>Add to List</span>
                        </LiquidButton>
                      </MagneticElement>
                      <MagneticElement>
                        <LiquidButton className="px-4 py-2 text-sm">
                          <span>🎯</span>
                          <span>Start Outreach</span>
                        </LiquidButton>
                      </MagneticElement>
                    </div>
                  </div>
                </HoverMorph>
              )}

              {/* Candidates Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <HoverMorph key={i} className="card-modern p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-surface-tertiary rounded-full" />
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
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {candidates.map((candidate, index) => (
                    <HoverMorph key={candidate.id} className="card-modern p-6 animate-on-scroll group cursor-pointer">
                      {/* Selection Checkbox */}
                      <div className="flex items-start justify-between mb-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => toggleCandidateSelection(candidate.id)}
                          className="w-4 h-4 text-primary-600 bg-surface-primary border-surface-tertiary rounded focus:ring-primary-500"
                        />
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      </div>

                      {/* Candidate Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {candidate.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-content-primary group-hover:text-primary-600 transition-colors line-clamp-1">
                            {candidate.name}
                          </h3>
                          <p className="text-sm text-content-secondary line-clamp-1">
                            {candidate.title} at {candidate.company}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-content-secondary">
                          <span>📍</span>
                          <span>{candidate.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-content-secondary">
                          <span>💼</span>
                          <span>{candidate.experience} years experience</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-surface-tertiary text-content-secondary rounded-full">
                              +{candidate.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-content-primary">Match Score</span>
                          <span className="text-sm font-bold text-success-600">{candidate.matchScore}%</span>
                        </div>
                        <div className="w-full bg-surface-tertiary rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-success-500 to-success-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${candidate.matchScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <MagneticElement>
                          <LiquidButton variant="secondary" className="flex-1 px-4 py-2 text-sm">
                            <span>👁️</span>
                            <span>View Profile</span>
                          </LiquidButton>
                        </MagneticElement>
                        <MagneticElement>
                          <LiquidButton className="px-4 py-2 text-sm">
                            <span>💬</span>
                          </LiquidButton>
                        </MagneticElement>
                      </div>
                    </HoverMorph>
                  ))}
                </StaggerContainer>
              )}

              {/* Load More */}
              {!isLoading && candidates.length > 0 && (
                <div className="text-center mt-12">
                  <MagneticElement>
                    <LiquidButton variant="secondary" className="px-8 py-3">
                      <span>Load More Candidates</span>
                      <span>⬇️</span>
                    </LiquidButton>
                  </MagneticElement>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              {/* Quick Stats */}
              <HoverMorph className="card-modern p-6">
                <h3 className="text-lg font-semibold text-content-primary mb-4">Pipeline Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-content-secondary">Active</span>
                    <span className="font-semibold text-primary-600">
                      <AnimatedCounter value={1234} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-content-secondary">Contacted</span>
                    <span className="font-semibold text-warning-600">
                      <AnimatedCounter value={856} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-content-secondary">Qualified</span>
                    <span className="font-semibold text-success-600">
                      <AnimatedCounter value={423} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-content-secondary">Hired</span>
                    <span className="font-semibold text-secondary-600">
                      <AnimatedCounter value={89} />
                    </span>
                  </div>
                </div>
              </HoverMorph>

              {/* Top Skills */}
              <HoverMorph className="card-modern p-6">
                <h3 className="text-lg font-semibold text-content-primary mb-4">Top Skills</h3>
                <div className="space-y-3">
                  {[
                    { skill: 'React', count: 456 },
                    { skill: 'Python', count: 389 },
                    { skill: 'TypeScript', count: 312 },
                    { skill: 'Node.js', count: 298 },
                    { skill: 'AWS', count: 245 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-content-primary">{item.skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-surface-tertiary rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${(item.count / 456) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-content-secondary w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </HoverMorph>

              {/* Recent Activity */}
              <HoverMorph className="card-modern p-6">
                <h3 className="text-lg font-semibold text-content-primary mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'Added new candidate', name: 'John Smith', time: '2h ago' },
                    { action: 'Qualified candidate', name: 'Sarah Johnson', time: '4h ago' },
                    { action: 'Sent outreach', name: 'Mike Chen', time: '6h ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-content-primary">
                          {activity.action} <span className="font-medium">{activity.name}</span>
                        </p>
                        <p className="text-xs text-content-tertiary">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </HoverMorph>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
