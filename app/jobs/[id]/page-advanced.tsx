"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import Link from "next/link"
import { HoverMorph, LiquidButton, MagneticElement, StaggerContainer } from "@/components/AdvancedAnimations"
import { ProgressRing, MetricCard, AnimatedCounter } from "@/components/DataVisualization"
import { useTheme } from "@/components/Providers"

// Mock job data for demonstration
const mockJob = {
  id: "1",
  title: "Senior Software Engineer",
  company: {
    name: "TechCorp",
    slug: "techcorp",
    size: "500-1000 employees",
    industry: "Technology",
    website: "https://techcorp.com",
    location: "San Francisco, CA",
    description: "Leading technology company focused on innovative solutions."
  },
  location: "San Francisco, CA",
  isRemote: true,
  isHybrid: false,
  employmentType: "Full-time",
  salaryMin: 120000,
  salaryMax: 180000,
  salaryCurrency: "USD",
  createdAt: new Date(),
  views: 1250,
  description: `
    <h3>About the Role</h3>
    <p>We are looking for a Senior Software Engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining high-quality software solutions that power our platform.</p>

    <h3>Responsibilities</h3>
    <ul>
      <li>Design and implement scalable software solutions</li>
      <li>Collaborate with cross-functional teams</li>
      <li>Write clean, maintainable code</li>
      <li>Participate in code reviews and mentoring</li>
      <li>Contribute to architectural decisions</li>
    </ul>

    <h3>Requirements</h3>
    <ul>
      <li>5+ years of software engineering experience</li>
      <li>Strong proficiency in React, Node.js, and TypeScript</li>
      <li>Experience with cloud platforms (AWS/Azure)</li>
      <li>Knowledge of modern development practices</li>
      <li>Bachelor's degree in Computer Science or equivalent</li>
    </ul>

    <h3>What We Offer</h3>
    <ul>
      <li>Competitive salary and equity package</li>
      <li>Comprehensive health benefits</li>
      <li>Flexible work arrangements</li>
      <li>Professional development opportunities</li>
      <li>Modern office with great amenities</li>
    </ul>
  `,
  postedBy: {
    name: "Sarah Johnson",
    image: null
  },
  applications: []
}

export default function JobDetailPage() {
  const params = useParams()
  const { theme } = useTheme()
  const [job] = useState(mockJob)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'company', label: 'Company', icon: '🏢' },
    { id: 'requirements', label: 'Requirements', icon: '✅' },
    { id: 'benefits', label: 'Benefits', icon: '🎁' }
  ]

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
        <NavbarAdvanced />
        <div className="container-fluid py-16">
          <HoverMorph className="card-modern p-12 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-fluid-3xl font-bold text-content-primary mb-4">Job Not Found</h1>
            <p className="text-content-secondary mb-8">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <MagneticElement>
              <LiquidButton>
                <Link href="/jobs">← Back to Jobs</Link>
              </LiquidButton>
            </MagneticElement>
          </HoverMorph>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
      <NavbarAdvanced />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10" />
        <div className="container-fluid relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <HoverMorph className="card-modern p-8 md:p-12 animate-fade-in-up">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                  {job.company.name.charAt(0)}
                </div>
              </div>

              <h1 className="text-fluid-4xl md:text-fluid-5xl font-bold text-gradient mb-4">
                {job.title}
              </h1>

              <Link
                href={`/companies/${job.company.slug}`}
                className="text-fluid-xl text-primary-600 hover:text-primary-700 font-semibold mb-6 inline-block transition-colors"
              >
                {job.company.name}
              </Link>

              <div className="flex flex-wrap justify-center gap-6 text-content-secondary mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  <span>{job.location}</span>
                </div>
                {job.isRemote && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏠</span>
                    <span>Remote</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  <span>{job.employmentType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👁️</span>
                  <span>{job.views} views</span>
                </div>
              </div>

              <div className="text-fluid-3xl font-bold text-success-600 mb-8">
                ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                {job.salaryCurrency && ` ${job.salaryCurrency}`}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {hasApplied ? (
                  <div className="flex items-center gap-3 px-8 py-4 bg-success-50 text-success-700 rounded-2xl border border-success-200">
                    <span className="text-2xl">✅</span>
                    <span className="font-semibold text-lg">
                      {applicationStatus === "PENDING"
                        ? "Application Submitted"
                        : applicationStatus === "ACCEPTED"
                        ? "Application Accepted"
                        : applicationStatus === "REJECTED"
                        ? "Application Not Selected"
                        : "Applied"}
                    </span>
                  </div>
                ) : (
                  <MagneticElement>
                    <LiquidButton onClick={() => setHasApplied(true)} className="px-12 py-4 text-lg">
                      <span>Apply Now</span>
                      <span className="text-xl ml-2">🚀</span>
                    </LiquidButton>
                  </MagneticElement>
                )}

                <MagneticElement>
                  <LiquidButton variant="secondary" className="px-8 py-4">
                    <span>💾</span>
                    <span className="ml-2">Save Job</span>
                  </LiquidButton>
                </MagneticElement>
              </div>
            </HoverMorph>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="container-fluid">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <HoverMorph>
              <MetricCard
                title="Applicants"
                value={87}
                icon="👥"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Match Score"
                value={94}
                suffix="%"
                icon="🎯"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Posted"
                value={3}
                suffix=" days ago"
                icon="📅"
              />
            </HoverMorph>
            <HoverMorph>
              <MetricCard
                title="Response Time"
                value={24}
                suffix=" hours"
                icon="⚡"
              />
            </HoverMorph>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Tab Navigation */}
                <HoverMorph className="card-modern p-2 mb-8">
                  <div className="flex gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary-500 text-white shadow-lg'
                            : 'text-content-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </HoverMorph>

                {/* Tab Content */}
                <HoverMorph className="card-modern p-8">
                  {activeTab === 'overview' && (
                    <div>
                      <h2 className="text-fluid-2xl font-bold text-content-primary mb-6">Job Overview</h2>
                      <div
                        className="prose prose-lg max-w-none text-content-primary"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                      />
                    </div>
                  )}

                  {activeTab === 'company' && (
                    <div>
                      <h2 className="text-fluid-2xl font-bold text-content-primary mb-6">About {job.company.name}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-content-primary mb-2">Company Size</h3>
                            <p className="text-content-secondary">{job.company.size}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-content-primary mb-2">Industry</h3>
                            <p className="text-content-secondary">{job.company.industry}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-content-primary mb-2">Website</h3>
                            <a
                              href={job.company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              {job.company.website}
                            </a>
                          </div>
                          <div>
                            <h3 className="font-semibold text-content-primary mb-2">Location</h3>
                            <p className="text-content-secondary">{job.company.location}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-content-primary mb-3">About Us</h3>
                        <p className="text-content-secondary leading-relaxed">{job.company.description}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'requirements' && (
                    <div>
                      <h2 className="text-fluid-2xl font-bold text-content-primary mb-6">Requirements & Qualifications</h2>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-content-primary mb-3">Experience Level</h3>
                          <div className="flex items-center gap-4">
                            <ProgressRing progress={85} size={80} label="Senior Level" />
                            <div className="flex-1">
                              <p className="text-content-secondary mb-2">5+ years of software engineering experience required</p>
                              <div className="w-full bg-surface-tertiary rounded-full h-2">
                                <div className="bg-primary-500 h-2 rounded-full w-4/5"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-content-primary mb-3">Key Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {['React', 'Node.js', 'TypeScript', 'AWS', 'Python', 'PostgreSQL'].map((skill) => (
                              <span key={skill} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'benefits' && (
                    <div>
                      <h2 className="text-fluid-2xl font-bold text-content-primary mb-6">Benefits & Perks</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center text-success-600">
                              💰
                            </div>
                            <div>
                              <h4 className="font-semibold text-content-primary">Competitive Salary</h4>
                              <p className="text-sm text-content-secondary">Top-tier compensation package</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                              🏥
                            </div>
                            <div>
                              <h4 className="font-semibold text-content-primary">Health Benefits</h4>
                              <p className="text-sm text-content-secondary">Comprehensive medical coverage</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center text-warning-600">
                              🏠
                            </div>
                            <div>
                              <h4 className="font-semibold text-content-primary">Remote Work</h4>
                              <p className="text-sm text-content-secondary">Flexible work arrangements</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center text-secondary-600">
                              📚
                            </div>
                            <div>
                              <h4 className="font-semibold text-content-primary">Learning Budget</h4>
                              <p className="text-sm text-content-secondary">Annual education allowance</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-accent-purple-100 rounded-xl flex items-center justify-center text-accent-purple-600">
                              ✈️
                            </div>
                            <div>
                              <h4 className="font-semibold text-content-primary">PTO</h4>
                              <p className="text-sm text-content-secondary">Generous vacation policy</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-accent-teal-100 rounded-xl flex items-center justify-center text-accent-teal-600">
                              🏢
                            </div>
                            <div>
                              <h4 className="font-semibold text-content-primary">Modern Office</h4>
                              <p className="text-sm text-content-secondary">State-of-the-art facilities</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </HoverMorph>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Application Progress */}
                <HoverMorph className="card-modern p-6">
                  <h3 className="text-lg font-semibold text-content-primary mb-4">Application Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-content-secondary">Profile Match</span>
                      <span className="text-sm font-medium text-success-600">94%</span>
                    </div>
                    <ProgressRing progress={94} size={100} label="Match Score" />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-content-secondary">Skills Match</span>
                        <span className="font-medium">8/10</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-content-secondary">Experience Match</span>
                        <span className="font-medium">9/10</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-content-secondary">Location Match</span>
                        <span className="font-medium">10/10</span>
                      </div>
                    </div>
                  </div>
                </HoverMorph>

                {/* Similar Jobs */}
                <HoverMorph className="card-modern p-6">
                  <h3 className="text-lg font-semibold text-content-primary mb-4">Similar Jobs</h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Senior Full Stack Engineer', company: 'TechStart Inc.', salary: '$130k-$160k' },
                      { title: 'Software Architect', company: 'InnovateLabs', salary: '$150k-$200k' },
                      { title: 'Engineering Manager', company: 'ScaleUp Corp', salary: '$160k-$220k' }
                    ].map((similarJob, index) => (
                      <MagneticElement key={index}>
                        <div className="p-4 bg-surface-secondary rounded-xl hover:bg-surface-tertiary transition-colors cursor-pointer">
                          <h4 className="font-medium text-content-primary mb-1">{similarJob.title}</h4>
                          <p className="text-sm text-content-secondary mb-1">{similarJob.company}</p>
                          <p className="text-sm font-medium text-success-600">{similarJob.salary}</p>
                        </div>
                      </MagneticElement>
                    ))}
                  </div>
                </HoverMorph>

                {/* Quick Actions */}
                <HoverMorph className="card-modern p-6">
                  <h3 className="text-lg font-semibold text-content-primary mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <MagneticElement>
                      <LiquidButton variant="secondary" className="w-full justify-start">
                        <span>📄</span>
                        <span>Generate Cover Letter</span>
                      </LiquidButton>
                    </MagneticElement>
                    <MagneticElement>
                      <LiquidButton variant="secondary" className="w-full justify-start">
                        <span>🎯</span>
                        <span>Interview Prep</span>
                      </LiquidButton>
                    </MagneticElement>
                    <MagneticElement>
                      <LiquidButton variant="secondary" className="w-full justify-start">
                        <span>💬</span>
                        <span>Connect with Recruiter</span>
                      </LiquidButton>
                    </MagneticElement>
                  </div>
                </HoverMorph>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
