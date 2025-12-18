"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import EngineerFinder from "./EngineerFinder"
import LinkedInProfileSearch from "./LinkedInProfileSearch"
import ATSJobScraper from "./ATSJobScraper"

function RecruitingToolsTabs() {
  const [activeRecruitingTab, setActiveRecruitingTab] = useState<"candidates" | "jobs">("candidates")

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveRecruitingTab("candidates")}
          className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
            activeRecruitingTab === "candidates"
              ? "text-blue-600 bg-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Candidate Search</span>
          </div>
          {activeRecruitingTab === "candidates" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveRecruitingTab("jobs")}
          className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
            activeRecruitingTab === "jobs"
              ? "text-blue-600 bg-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Job Scraper</span>
          </div>
          {activeRecruitingTab === "jobs" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeRecruitingTab === "candidates" && <CandidateSearchTabs />}
        {activeRecruitingTab === "jobs" && <ATSJobScraper />}
      </div>
    </div>
  )
}

function CandidateSearchTabs() {
  const [activeCandidateTab, setActiveCandidateTab] = useState<"advanced" | "basic">("advanced")

  return (
    <>
      {/* Sub-tabs for Candidate Search */}
      <div className="flex border-b border-gray-200 bg-gray-50 mb-6 -mx-6 -mt-6">
        <div className="px-6 w-full">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveCandidateTab("advanced")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
                activeCandidateTab === "advanced"
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Advanced Search</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Templates
                </span>
              </div>
              {activeCandidateTab === "advanced" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveCandidateTab("basic")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
                activeCandidateTab === "basic"
                  ? "text-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Basic Search</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  LinkedIn
                </span>
              </div>
              {activeCandidateTab === "basic" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeCandidateTab === "advanced" && <EngineerFinder />}
        {activeCandidateTab === "basic" && <LinkedInProfileSearch />}
      </div>
    </>
  )
}

interface AdminContentProps {
  initialData: {
    users: any[]
    posts: any[]
    jobs: any[]
    candidates: any[]
  }
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  isActive?: boolean
}

interface Post {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    email: string
  }
}

interface Job {
  id: string
  title: string
  createdAt: Date
  company: {
    name: string
  }
}

interface Candidate {
  id: string
  fullName: string | null
  jobTitle: string | null
  currentCompany: string | null
  status: string | null
  createdAt: Date
}

export default function AdminContent({ initialData }: AdminContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "jobs" | "candidates" | "recruiting">("users")
  
  // Users state
  const [users, setUsers] = useState<User[]>(initialData.users)
  const [usersSearch, setUsersSearch] = useState("")
  const [usersPage, setUsersPage] = useState(1)
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>(initialData.posts)
  const [postsSearch, setPostsSearch] = useState("")
  const [postsPage, setPostsPage] = useState(1)
  const [postsLoading, setPostsLoading] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  
  // Jobs state
  const [jobs, setJobs] = useState<Job[]>(initialData.jobs)
  const [jobsSearch, setJobsSearch] = useState("")
  const [jobsPage, setJobsPage] = useState(1)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  
  // Candidates state
  const [candidates, setCandidates] = useState<Candidate[]>(initialData.candidates)
  const [candidatesSearch, setCandidatesSearch] = useState("")
  const [candidatesPage, setCandidatesPage] = useState(1)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set())

  const limit = 20

  // Filter and paginate users
  const filteredUsers = users.filter((user) => {
    const searchLower = usersSearch.toLowerCase()
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    )
  })
  const usersTotalPages = Math.ceil(filteredUsers.length / limit)
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * limit, usersPage * limit)

  // Filter and paginate posts
  const filteredPosts = posts.filter((post) => {
    const searchLower = postsSearch.toLowerCase()
    return (
      post.content.toLowerCase().includes(searchLower) ||
      post.author.name?.toLowerCase().includes(searchLower) ||
      post.author.email.toLowerCase().includes(searchLower)
    )
  })
  const postsTotalPages = Math.ceil(filteredPosts.length / limit)
  const paginatedPosts = filteredPosts.slice((postsPage - 1) * limit, postsPage * limit)

  // Filter and paginate jobs
  const filteredJobs = jobs.filter((job) => {
    const searchLower = jobsSearch.toLowerCase()
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.company.name.toLowerCase().includes(searchLower)
    )
  })
  const jobsTotalPages = Math.ceil(filteredJobs.length / limit)
  const paginatedJobs = filteredJobs.slice((jobsPage - 1) * limit, jobsPage * limit)

  // Filter and paginate candidates
  const filteredCandidates = candidates.filter((candidate) => {
    const searchLower = candidatesSearch.toLowerCase()
    return (
      candidate.fullName?.toLowerCase().includes(searchLower) ||
      candidate.jobTitle?.toLowerCase().includes(searchLower) ||
      candidate.currentCompany?.toLowerCase().includes(searchLower) ||
      candidate.status?.toLowerCase().includes(searchLower)
    )
  })
  const candidatesTotalPages = Math.ceil(filteredCandidates.length / limit)
  const paginatedCandidates = filteredCandidates.slice((candidatesPage - 1) * limit, candidatesPage * limit)

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId))
        if (selectedUser?.id === userId) {
          setSelectedUser(null)
        }
      }
    } catch (error) {
      console.error("Error deactivating user:", error)
    }
  }

  const handleRemovePost = async (postId: string) => {
    if (!confirm("Are you sure you want to remove this post?")) return

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== postId))
        if (selectedPost?.id === postId) {
          setSelectedPost(null)
        }
      }
    } catch (error) {
      console.error("Error removing post:", error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setJobs(jobs.filter((j) => j.id !== jobId))
        if (selectedJob?.id === jobId) {
          setSelectedJob(null)
        }
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete job")
      }
    } catch (error) {
      console.error("Error deleting job:", error)
      alert("Failed to delete job")
    }
  }

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCandidates(candidates.filter((c) => c.id !== candidateId))
        if (selectedCandidate?.id === candidateId) {
          setSelectedCandidate(null)
        }
        setSelectedCandidateIds((prev) => {
          const next = new Set(prev)
          next.delete(candidateId)
          return next
        })
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete candidate")
      }
    } catch (error) {
      console.error("Error deleting candidate:", error)
      alert("Failed to delete candidate")
    }
  }

  const handleBulkDeleteCandidates = async () => {
    if (selectedCandidateIds.size === 0) return

    const count = selectedCandidateIds.size
    if (!confirm(`Are you sure you want to delete ${count} candidate${count !== 1 ? "s" : ""}? This action cannot be undone.`)) return

    try {
      const response = await fetch("/api/candidates/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIds: Array.from(selectedCandidateIds) }),
      })

      if (response.ok) {
        const data = await response.json()
        setCandidates(candidates.filter((c) => !selectedCandidateIds.has(c.id)))
        setSelectedCandidateIds(new Set())
        if (selectedCandidate && selectedCandidateIds.has(selectedCandidate.id)) {
          setSelectedCandidate(null)
        }
        alert(data.message || `Successfully deleted ${count} candidate${count !== 1 ? "s" : ""}`)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete candidates")
      }
    } catch (error) {
      console.error("Error bulk deleting candidates:", error)
      alert("Failed to delete candidates")
    }
  }

  const handleBulkDeleteJobs = async () => {
    if (selectedJobIds.size === 0) return

    const count = selectedJobIds.size
    if (!confirm(`Are you sure you want to delete ${count} job${count !== 1 ? "s" : ""}? This action cannot be undone.`)) return

    try {
      const response = await fetch("/api/jobs/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: Array.from(selectedJobIds) }),
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(jobs.filter((j) => !selectedJobIds.has(j.id)))
        setSelectedJobIds(new Set())
        if (selectedJob && selectedJobIds.has(selectedJob.id)) {
          setSelectedJob(null)
        }
        alert(data.message || `Successfully deleted ${count} job${count !== 1 ? "s" : ""}`)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete jobs")
      }
    } catch (error) {
      console.error("Error bulk deleting jobs:", error)
      alert("Failed to delete jobs")
    }
  }

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev)
      if (next.has(candidateId)) {
        next.delete(candidateId)
      } else {
        next.add(candidateId)
      }
      return next
    })
  }

  const toggleAllJobs = () => {
    if (selectedJobIds.size === paginatedJobs.length) {
      setSelectedJobIds(new Set())
    } else {
      setSelectedJobIds(new Set(paginatedJobs.map((j) => j.id)))
    }
  }

  const toggleAllCandidates = () => {
    if (selectedCandidateIds.size === paginatedCandidates.length) {
      setSelectedCandidateIds(new Set())
    } else {
      setSelectedCandidateIds(new Set(paginatedCandidates.map((c) => c.id)))
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "USER":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              setActiveTab("users")
              setUsersPage(1)
            }}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
              activeTab === "users"
                ? "text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === "users" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>
                {users.length}
              </span>
            </div>
            {activeTab === "users" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("posts")
              setPostsPage(1)
            }}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
              activeTab === "posts"
                ? "text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Posts
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === "posts" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>
                {posts.length}
              </span>
            </div>
            {activeTab === "posts" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("jobs")
              setJobsPage(1)
            }}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
              activeTab === "jobs"
                ? "text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Jobs
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === "jobs" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>
                {jobs.length}
              </span>
            </div>
            {activeTab === "jobs" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("candidates")
              setCandidatesPage(1)
            }}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
              activeTab === "candidates"
                ? "text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Candidates
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === "candidates" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>
                {candidates.length}
              </span>
            </div>
            {activeTab === "candidates" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("recruiting")
            }}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors relative ${
              activeTab === "recruiting"
                ? "text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Recruiting Tools
            </div>
            {activeTab === "recruiting" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value)
                  setUsersPage(1)
                }}
                placeholder="Search users by name, email, or role..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {paginatedUsers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  {usersSearch ? "Try adjusting your search query" : "No users in the system"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || "No name"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white hover:bg-gray-50" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="text-red-600 hover:text-red-900 font-medium transition-colors"
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersTotalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(usersPage - 1) * limit + 1} to {Math.min(usersPage * limit, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                        disabled={usersPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, usersTotalPages) }, (_, i) => {
                          let pageNum
                          if (usersTotalPages <= 5) {
                            pageNum = i + 1
                          } else if (usersPage <= 3) {
                            pageNum = i + 1
                          } else if (usersPage >= usersTotalPages - 2) {
                            pageNum = usersTotalPages - 4 + i
                          } else {
                            pageNum = usersPage - 2 + i
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setUsersPage(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                usersPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                        disabled={usersPage === usersTotalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={postsSearch}
                onChange={(e) => {
                  setPostsSearch(e.target.value)
                  setPostsPage(1)
                }}
                placeholder="Search posts by content or author..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Posts List */}
          {paginatedPosts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600">
                {postsSearch ? "Try adjusting your search query" : "No posts in the system"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 mb-3 leading-relaxed line-clamp-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {post.author.name || post.author.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePost(post.id)
                      }}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {postsTotalPages > 1 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(postsPage - 1) * limit + 1} to {Math.min(postsPage * limit, filteredPosts.length)} of {filteredPosts.length} posts
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                      disabled={postsPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, postsTotalPages) }, (_, i) => {
                        let pageNum
                        if (postsTotalPages <= 5) {
                          pageNum = i + 1
                        } else if (postsPage <= 3) {
                          pageNum = i + 1
                        } else if (postsPage >= postsTotalPages - 2) {
                          pageNum = postsTotalPages - 4 + i
                        } else {
                          pageNum = postsPage - 2 + i
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPostsPage(pageNum)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              postsPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setPostsPage((p) => Math.min(postsTotalPages, p + 1))}
                      disabled={postsPage === postsTotalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          {/* Search and Bulk Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={jobsSearch}
                  onChange={(e) => {
                    setJobsSearch(e.target.value)
                    setJobsPage(1)
                  }}
                  placeholder="Search jobs by title or company..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              {selectedJobIds.size > 0 && (
                <button
                  onClick={handleBulkDeleteJobs}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Delete Selected ({selectedJobIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {paginatedJobs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">💼</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">
                  {jobsSearch ? "Try adjusting your search query" : "No jobs in the system"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={selectedJobIds.size === paginatedJobs.length && paginatedJobs.length > 0}
                            onChange={toggleAllJobs}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedJobs.map((job) => (
                        <tr
                          key={job.id}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedJobIds.has(job.id) ? "bg-blue-50" : ""}`}
                          onClick={() => setSelectedJob(job)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedJobIds.has(job.id)}
                              onChange={() => toggleJobSelection(job.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{job.company.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white hover:bg-gray-50" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-3">
                              <Link
                                href={`/jobs/${job.id}`}
                                className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-red-600 hover:text-red-900 font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {jobsTotalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(jobsPage - 1) * limit + 1} to {Math.min(jobsPage * limit, filteredJobs.length)} of {filteredJobs.length} jobs
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setJobsPage((p) => Math.max(1, p - 1))}
                        disabled={jobsPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, jobsTotalPages) }, (_, i) => {
                          let pageNum
                          if (jobsTotalPages <= 5) {
                            pageNum = i + 1
                          } else if (jobsPage <= 3) {
                            pageNum = i + 1
                          } else if (jobsPage >= jobsTotalPages - 2) {
                            pageNum = jobsTotalPages - 4 + i
                          } else {
                            pageNum = jobsPage - 2 + i
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setJobsPage(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                jobsPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => setJobsPage((p) => Math.min(jobsTotalPages, p + 1))}
                        disabled={jobsPage === jobsTotalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Candidates Tab */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          {/* Search and Bulk Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={candidatesSearch}
                  onChange={(e) => {
                    setCandidatesSearch(e.target.value)
                    setCandidatesPage(1)
                  }}
                  placeholder="Search candidates by name, title, company, or status..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              {selectedCandidateIds.size > 0 && (
                <button
                  onClick={handleBulkDeleteCandidates}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Delete Selected ({selectedCandidateIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {paginatedCandidates.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-600">
                  {candidatesSearch ? "Try adjusting your search query" : "No candidates in the system"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={selectedCandidateIds.size === paginatedCandidates.length && paginatedCandidates.length > 0}
                            onChange={toggleAllCandidates}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedCandidates.map((candidate) => (
                        <tr
                          key={candidate.id}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedCandidateIds.has(candidate.id) ? "bg-blue-50" : ""}`}
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedCandidateIds.has(candidate.id)}
                              onChange={() => toggleCandidateSelection(candidate.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.fullName || "No name"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{candidate.jobTitle || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{candidate.currentCompany || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {candidate.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(candidate.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white hover:bg-gray-50" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteCandidate(candidate.id)}
                              className="text-red-600 hover:text-red-900 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {candidatesTotalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(candidatesPage - 1) * limit + 1} to {Math.min(candidatesPage * limit, filteredCandidates.length)} of {filteredCandidates.length} candidates
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCandidatesPage((p) => Math.max(1, p - 1))}
                        disabled={candidatesPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, candidatesTotalPages) }, (_, i) => {
                          let pageNum
                          if (candidatesTotalPages <= 5) {
                            pageNum = i + 1
                          } else if (candidatesPage <= 3) {
                            pageNum = i + 1
                          } else if (candidatesPage >= candidatesTotalPages - 2) {
                            pageNum = candidatesTotalPages - 4 + i
                          } else {
                            pageNum = candidatesPage - 2 + i
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCandidatesPage(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                candidatesPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => setCandidatesPage((p) => Math.min(candidatesTotalPages, p + 1))}
                        disabled={candidatesPage === candidatesTotalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Recruiting Tools Tab */}
      {activeTab === "recruiting" && (
        <RecruitingToolsTabs />
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedUser.name?.[0]?.toUpperCase() || selectedUser.email[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.name || "No name"}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Role</div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Created</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Post Details</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Content</h3>
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Author</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedPost.author.name || selectedPost.author.email}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Created</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleRemovePost(selectedPost.id)
                    setSelectedPost(null)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Remove Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedJob.title}</h3>
                <p className="text-gray-600">{selectedJob.company.name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Created</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(selectedJob.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/jobs/${selectedJob.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  View Full Job
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
