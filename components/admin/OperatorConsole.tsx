"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import Drawer from "@/components/ui/Drawer"
import Notice, { NoticeTone } from "@/components/ui/Notice"
import RecruitingTools from "@/components/admin/RecruitingTools"
import AdminActionsDrawer from "@/components/admin/AdminActionsDrawer"

type SectionKey = "overview" | "users" | "candidates" | "jobs" | "posts" | "ops" | "recruiting"

interface UserRow {
  id: string
  name: string | null
  email: string
  role: string
  accountType?: string | null
  isActive?: boolean
  createdAt: string | Date
}

interface PostRow {
  id: string
  content: string
  createdAt: string | Date
  author: { id: string; name: string | null; email: string }
}

interface JobRow {
  id: string
  title: string
  createdAt: string | Date
  company: { name: string }
}

interface CandidateRow {
  id: string
  fullName: string | null
  jobTitle: string | null
  currentCompany: string | null
  status: string | null
  createdAt: string | Date
}

type OpsTicketType = "BUG" | "FEATURE"
type OpsTicketStatus = "OPEN" | "IN_PROGRESS" | "DONE"
type OpsTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

interface OpsTicket {
  id: string
  type: OpsTicketType
  status: OpsTicketStatus
  priority: OpsTicketPriority
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
  createdById?: string | null
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function toDate(d: string | Date) {
  return typeof d === "string" ? new Date(d) : d
}

function formatDate(d: string | Date) {
  return toDate(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function formatDateTime(d: string | Date) {
  return toDate(d).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function audienceKey(u: UserRow): "ADMIN" | "CANDIDATE" | "EMPLOYER" {
  if ((u.role || "").toUpperCase() === "ADMIN") return "ADMIN"
  if (((u.accountType || "") + "").toUpperCase() === "EMPLOYER") return "EMPLOYER"
  return "CANDIDATE"
}

function audienceLabel(u: UserRow) {
  const k = audienceKey(u)
  if (k === "ADMIN") return "Admin"
  if (k === "EMPLOYER") return "Employer / Recruiter"
  return "Candidate"
}

function audiencePillClass(k: "ADMIN" | "CANDIDATE" | "EMPLOYER") {
  if (k === "ADMIN") return "bg-[hsl(var(--glow-warning))] text-content-primary border-[hsl(var(--warning)/0.35)]"
  if (k === "EMPLOYER") return "bg-[hsl(var(--glow-primary))] text-content-primary border-[hsl(var(--brand-primary)/0.25)]"
  return "bg-surface-secondary text-content-primary border-surface-tertiary/60"
}

function candidateStatusLabel(status: string | null) {
  const s = (status || "").toUpperCase()
  if (s === "ACTIVE") return "Mission Ready"
  if (s === "NEEDS_REVIEW") return "Verification Pending"
  if (s === "CONTACTED") return "Engaged"
  if (s === "HIRED") return "Placed"
  if (s === "ARCHIVED") return "Inactive / Clearance Risk"
  if (s === "REJECTED") return "Not Selected"
  return status || "—"
}

function priorityPill(priority: OpsTicketPriority) {
  switch (priority) {
    case "CRITICAL":
      return "bg-[hsl(var(--glow-error))] text-content-primary border-[hsl(var(--error)/0.25)]"
    case "HIGH":
      return "bg-[hsl(var(--glow-warning))] text-content-primary border-[hsl(var(--warning)/0.3)]"
    case "MEDIUM":
      return "bg-surface-secondary text-content-primary border-surface-tertiary/60"
    default:
      return "bg-surface-secondary text-content-primary border-surface-tertiary/60"
  }
}

function statusPill(status: OpsTicketStatus) {
  switch (status) {
    case "DONE":
      return "bg-[hsl(var(--glow-success))] text-content-primary border-[hsl(var(--success)/0.25)]"
    case "IN_PROGRESS":
      return "bg-[hsl(var(--glow-primary))] text-content-primary border-[hsl(var(--brand-primary)/0.25)]"
    default:
      return "bg-surface-secondary text-content-primary border-surface-tertiary/60"
  }
}

export default function OperatorConsole({
  initialData,
}: {
  initialData: {
    users: UserRow[]
    posts: PostRow[]
    jobs: JobRow[]
    candidates: CandidateRow[]
    linkedInUrls: any[]
    linkedInUrlsTotal: number
  }
}) {
  const router = useRouter()
  const [section, setSection] = useState<SectionKey>("overview")
  const [actionsOpen, setActionsOpen] = useState(false)
  const panel = "glass-elevated rounded-3xl border border-surface-tertiary/50 shadow-elevation-1"
  const panelHeader = "px-6 py-5 border-b border-surface-tertiary/40 bg-surface-secondary/40"
  const input =
    "px-4 py-2.5 rounded-2xl border border-surface-tertiary/60 bg-surface-primary text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
  const subtleButton =
    "px-4 py-2.5 rounded-2xl border border-surface-tertiary/60 bg-surface-primary text-content-primary hover:bg-surface-secondary font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
  const primaryButton =
    "px-4 py-2.5 rounded-2xl bg-primary-700 text-white hover:bg-primary-800 font-semibold shadow-elevation-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
  const dangerButton =
    "px-4 py-2.5 rounded-2xl border border-red-200/70 bg-red-50 text-red-900 hover:bg-red-100 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"

  // Global notice
  const [notice, setNotice] = useState<{ tone: NoticeTone; title?: string; message: string } | null>(null)

  // Confirm dialog
  const [confirm, setConfirm] = useState<{
    open: boolean
    title: string
    description?: string
    tone?: "default" | "danger"
    confirmLabel?: string
    action?: () => Promise<void> | void
  }>({ open: false, title: "" })
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Data state
  const [users, setUsers] = useState<UserRow[]>(initialData.users || [])
  const [posts, setPosts] = useState<PostRow[]>(initialData.posts || [])
  const [jobs, setJobs] = useState<JobRow[]>(initialData.jobs || [])
  const [candidates, setCandidates] = useState<CandidateRow[]>(initialData.candidates || [])

  // Search/filter state
  const [userSearch, setUserSearch] = useState("")
  const [userAudienceFilter, setUserAudienceFilter] = useState<"ALL" | "ADMIN" | "CANDIDATE" | "EMPLOYER">("ALL")

  const [candidateSearch, setCandidateSearch] = useState("")
  const [jobSearch, setJobSearch] = useState("")
  const [postSearch, setPostSearch] = useState("")

  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set())

  // Drawer state
  const [userDrawer, setUserDrawer] = useState<UserRow | null>(null)
  const [postDrawer, setPostDrawer] = useState<PostRow | null>(null)
  const [jobDrawer, setJobDrawer] = useState<JobRow | null>(null)
  const [candidateDrawer, setCandidateDrawer] = useState<CandidateRow | null>(null)

  // User audience edit
  const [audienceDraft, setAudienceDraft] = useState<"ADMIN" | "CANDIDATE" | "EMPLOYER">("CANDIDATE")
  const [audienceSaving, setAudienceSaving] = useState(false)

  // Ops tickets
  const [opsTickets, setOpsTickets] = useState<OpsTicket[]>([])
  const [opsLoading, setOpsLoading] = useState(false)
  const [opsError, setOpsError] = useState<string | null>(null)
  const [opsSelected, setOpsSelected] = useState<OpsTicket | null>(null)
  const [opsCreateOpen, setOpsCreateOpen] = useState(false)
  const [opsCreateDraft, setOpsCreateDraft] = useState<{
    type: OpsTicketType
    priority: OpsTicketPriority
    title: string
    description: string
  }>({ type: "BUG", priority: "MEDIUM", title: "", description: "" })
  const [opsSaving, setOpsSaving] = useState(false)

  useEffect(() => {
    if (!userDrawer) return
    setAudienceDraft(audienceKey(userDrawer))
  }, [userDrawer])

  const usersFiltered = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return users
      .filter((u) => {
        if (userAudienceFilter !== "ALL" && audienceKey(u) !== userAudienceFilter) return false
        if (!q) return true
        const a = audienceLabel(u).toLowerCase()
        return (
          (u.name || "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q) ||
          a.includes(q)
        )
      })
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
  }, [users, userSearch, userAudienceFilter])

  const candidatesFiltered = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase()
    return candidates
      .filter((c) => {
        if (!q) return true
        return (
          (c.fullName || "").toLowerCase().includes(q) ||
          (c.jobTitle || "").toLowerCase().includes(q) ||
          (c.currentCompany || "").toLowerCase().includes(q) ||
          (c.status || "").toLowerCase().includes(q)
        )
      })
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
  }, [candidates, candidateSearch])

  const jobsFiltered = useMemo(() => {
    const q = jobSearch.trim().toLowerCase()
    return jobs
      .filter((j) => {
        if (!q) return true
        return j.title.toLowerCase().includes(q) || j.company.name.toLowerCase().includes(q)
      })
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
  }, [jobs, jobSearch])

  const postsFiltered = useMemo(() => {
    const q = postSearch.trim().toLowerCase()
    return posts
      .filter((p) => {
        if (!q) return true
        return (
          p.content.toLowerCase().includes(q) ||
          (p.author.name || "").toLowerCase().includes(q) ||
          p.author.email.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
  }, [posts, postSearch])

  const openConfirm = (args: Omit<typeof confirm, "open"> & { action: () => Promise<void> | void }) => {
    setConfirm({ ...args, open: true })
  }

  const runConfirm = async () => {
    if (!confirm.action) return
    setConfirmLoading(true)
    try {
      await confirm.action()
      setConfirm({ open: false, title: "" })
    } finally {
      setConfirmLoading(false)
    }
  }

  const deactivateUser = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to deactivate user")
    setUsers((prev) => prev.filter((u) => u.id !== id))
    if (userDrawer?.id === id) setUserDrawer(null)
  }

  const updateUserAudience = async (id: string, audience: "ADMIN" | "CANDIDATE" | "EMPLOYER") => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to update audience")
    const updated = data.user as UserRow
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
    setUserDrawer((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev))
  }

  const removePost = async (id: string) => {
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to remove post")
    setPosts((prev) => prev.filter((p) => p.id !== id))
    if (postDrawer?.id === id) setPostDrawer(null)
  }

  const deleteJob = async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to delete job")
    setJobs((prev) => prev.filter((j) => j.id !== id))
    setSelectedJobIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (jobDrawer?.id === id) setJobDrawer(null)
  }

  const deleteCandidate = async (id: string) => {
    const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to delete candidate")
    setCandidates((prev) => prev.filter((c) => c.id !== id))
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (candidateDrawer?.id === id) setCandidateDrawer(null)
  }

  const bulkDeleteJobs = async () => {
    const ids = Array.from(selectedJobIds)
    if (ids.length === 0) return
    const res = await fetch("/api/jobs/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobIds: ids }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to delete jobs")
    setJobs((prev) => prev.filter((j) => !selectedJobIds.has(j.id)))
    setSelectedJobIds(new Set())
    setNotice({ tone: "success", message: data.message || `Deleted ${ids.length} job(s).` })
  }

  const bulkDeleteCandidates = async () => {
    const ids = Array.from(selectedCandidateIds)
    if (ids.length === 0) return
    const res = await fetch("/api/candidates/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateIds: ids }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Failed to delete candidates")
    setCandidates((prev) => prev.filter((c) => !selectedCandidateIds.has(c.id)))
    setSelectedCandidateIds(new Set())
    setNotice({ tone: "success", message: data.message || `Deleted ${ids.length} candidate(s).` })
  }

  const loadOpsTickets = async () => {
    setOpsLoading(true)
    setOpsError(null)
    try {
      const res = await fetch("/api/ops-tickets")
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load tickets")
      setOpsTickets((data.tickets || []) as OpsTicket[])
    } catch (e: any) {
      setOpsError(e?.message || "Failed to load tickets")
    } finally {
      setOpsLoading(false)
    }
  }

  useEffect(() => {
    if (section !== "ops") return
    loadOpsTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  const createOpsTicket = async () => {
    setOpsSaving(true)
    try {
      const res = await fetch("/api/ops-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: opsCreateDraft.type,
          priority: opsCreateDraft.priority,
          title: opsCreateDraft.title,
          description: opsCreateDraft.description || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to create ticket")
      setOpsTickets((prev) => [data.ticket as OpsTicket, ...prev])
      setOpsCreateDraft({ type: "BUG", priority: "MEDIUM", title: "", description: "" })
      setOpsCreateOpen(false)
      setNotice({ tone: "success", message: "Ops ticket created." })
    } catch (e: any) {
      setNotice({ tone: "error", title: "Couldn’t create ticket", message: e?.message || "Unknown error" })
    } finally {
      setOpsSaving(false)
    }
  }

  const patchOpsTicket = async (id: string, patch: Partial<Pick<OpsTicket, "status" | "priority" | "title" | "description">>) => {
    setOpsSaving(true)
    try {
      const res = await fetch(`/api/ops-tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to update ticket")
      const updated = data.ticket as OpsTicket
      setOpsTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setOpsSelected((prev) => (prev?.id === updated.id ? updated : prev))
      setNotice({ tone: "success", message: "Ticket updated." })
    } catch (e: any) {
      setNotice({ tone: "error", title: "Couldn’t update ticket", message: e?.message || "Unknown error" })
    } finally {
      setOpsSaving(false)
    }
  }

  const nav = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "candidates", label: "Candidates" },
    { key: "jobs", label: "Jobs" },
    { key: "posts", label: "Posts" },
    { key: "ops", label: "Ops Tickets" },
    { key: "recruiting", label: "Recruiting" },
  ] as const

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-secondary">
      <div className="mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-content-primary">clearD Operator Console</div>
            <div className="text-sm text-content-secondary mt-1">
              Admin-only operations for sourcing, content moderation, and system tools.
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              className={subtleButton}
            >
              Actions
            </button>
            <Link
              href="/candidates"
              className={primaryButton}
            >
              Talent Pool →
            </Link>
          </div>
        </div>

        {notice ? (
          <div className="mt-5">
            <Notice
              tone={notice.tone}
              title={notice.title}
              message={notice.message}
              onDismiss={() => setNotice(null)}
            />
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className={`${panel} overflow-hidden`}>
              <div className="p-3 border-b border-surface-tertiary/40 bg-surface-secondary/40">
                <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wider px-2 py-1">
                  Console
                </div>
              </div>
              <div className="p-2">
                {nav.map((item) => {
                  const active = section === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSection(item.key)}
                      className={cx(
                        "w-full text-left px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors",
                        active ? "bg-neutral-900 text-white shadow-elevation-2" : "text-content-primary hover:bg-surface-secondary"
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="lg:col-span-9 space-y-5">
            {/* Mobile nav */}
            <div className={`lg:hidden ${panel} p-2 overflow-x-auto`}>
              <div className="flex gap-2 min-w-max">
                {nav.map((item) => {
                  const active = section === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSection(item.key)}
                      className={cx(
                        "px-3 py-2 rounded-2xl text-sm font-semibold transition-colors",
                        active ? "bg-neutral-900 text-white shadow-elevation-2" : "text-content-primary hover:bg-surface-secondary"
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {section === "overview" ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Active Users", value: users.length, hint: "Accounts currently enabled" },
                    { label: "Candidates", value: candidates.length, hint: "Talent records in pool" },
                    { label: "Jobs", value: jobs.length, hint: "Active listings in system" },
                    { label: "Posts", value: posts.length, hint: "Active network updates" },
                  ].map((kpi) => (
                    <div key={kpi.label} className={`${panel} p-5`}>
                      <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">{kpi.label}</div>
                      <div className="mt-2 text-3xl font-bold text-content-primary">{kpi.value}</div>
                      <div className="mt-1 text-sm text-content-secondary">{kpi.hint}</div>
                    </div>
                  ))}
                </div>

                <div className={`${panel} p-6`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold text-content-primary">Quick Access</div>
                      <div className="text-sm text-content-secondary">Jump to the workflows you use most.</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSection("users")}
                        className={subtleButton}
                      >
                        Manage Users
                      </button>
                      <button
                        type="button"
                        onClick={() => setSection("ops")}
                        className={subtleButton}
                      >
                        Ops Tickets
                      </button>
                      <button
                        type="button"
                        onClick={() => setSection("recruiting")}
                        className={primaryButton}
                      >
                        Recruiting Tools →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {section === "users" ? (
              <div className={`${panel} overflow-hidden`}>
                <div className={panelHeader}>
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold text-content-primary">Users</div>
                      <div className="text-sm text-content-secondary">Audience + access controls.</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={userAudienceFilter}
                        onChange={(e) => setUserAudienceFilter(e.target.value as any)}
                        className={`${input} text-sm`}
                      >
                        <option value="ALL">All audiences</option>
                        <option value="ADMIN">Admins</option>
                        <option value="CANDIDATE">Candidates</option>
                        <option value="EMPLOYER">Employers</option>
                      </select>
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search name, email, audience…"
                        className={`${input} text-sm w-[18rem] max-w-full`}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-tertiary/60">
                    <thead className="bg-surface-primary">
                      <tr className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        <th className="px-6 py-3 text-left text-content-tertiary">User</th>
                        <th className="px-6 py-3 text-left text-content-tertiary">Audience</th>
                        <th className="px-6 py-3 text-left text-content-tertiary">Created</th>
                        <th className="px-6 py-3 text-right text-content-tertiary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-tertiary/60">
                      {usersFiltered.map((u) => {
                        const a = audienceKey(u)
                        return (
                          <tr key={u.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => setUserDrawer(u)}>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-content-primary">{u.name || "—"}</div>
                              <div className="text-sm text-content-secondary">{u.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cx("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", audiencePillClass(a))}>
                                {audienceLabel(u)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-content-secondary">{formatDate(u.createdAt)}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                className="text-sm font-semibold text-primary-700 hover:text-primary-900"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setUserDrawer(u)
                                }}
                              >
                                Details →
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {usersFiltered.length === 0 ? (
                        <tr>
                          <td className="px-6 py-10 text-center text-sm text-content-secondary" colSpan={4}>
                            No users match your filters.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {section === "candidates" ? (
              <div className={`${panel} overflow-hidden`}>
                <div className={panelHeader}>
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold text-content-primary">Candidates</div>
                      <div className="text-sm text-content-secondary">Cleared talent records (UI labels only).</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        placeholder="Search name, title, company, status…"
                        className={`${input} text-sm w-[22rem] max-w-full`}
                      />
                      {selectedCandidateIds.size > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm({
                              title: "Delete selected candidates?",
                              description: `This will permanently delete ${selectedCandidateIds.size} record(s). This action cannot be undone.`,
                              tone: "danger",
                              confirmLabel: "Delete",
                              action: async () => {
                                await bulkDeleteCandidates()
                              },
                            })
                          }
                          className={dangerButton}
                        >
                          Delete Selected ({selectedCandidateIds.size})
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-tertiary/60">
                    <thead className="bg-surface-primary">
                      <tr className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                        <th className="px-6 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedCandidateIds.size > 0 && selectedCandidateIds.size === candidatesFiltered.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCandidateIds(new Set(candidatesFiltered.map((c) => c.id)))
                              else setSelectedCandidateIds(new Set())
                            }}
                            className="rounded border-surface-tertiary"
                          />
                        </th>
                        <th className="px-6 py-3 text-left">Candidate</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Created</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-tertiary/60">
                      {candidatesFiltered.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-secondary cursor-pointer" onClick={() => setCandidateDrawer(c)}>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedCandidateIds.has(c.id)}
                              onChange={() =>
                                setSelectedCandidateIds((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(c.id)) next.delete(c.id)
                                  else next.add(c.id)
                                  return next
                                })
                              }
                              className="rounded border-surface-tertiary"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-content-primary">{c.fullName || "—"}</div>
                            <div className="text-sm text-content-secondary">
                              {c.jobTitle || "—"}
                              {c.currentCompany ? ` · ${c.currentCompany}` : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-content-primary">{candidateStatusLabel(c.status)}</td>
                          <td className="px-6 py-4 text-sm text-content-secondary">{formatDate(c.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="text-sm font-semibold text-primary-700 hover:text-primary-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCandidateDrawer(c)
                              }}
                            >
                              Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                      {candidatesFiltered.length === 0 ? (
                        <tr>
                          <td className="px-6 py-10 text-center text-sm text-content-secondary" colSpan={5}>
                            No candidates found.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {section === "jobs" ? (
              <div className={`${panel} overflow-hidden`}>
                <div className={panelHeader}>
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold text-content-primary">Jobs</div>
                      <div className="text-sm text-content-secondary">Listings visible to candidates (role-gated).</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        placeholder="Search title or company…"
                        className={`${input} text-sm w-[18rem] max-w-full`}
                      />
                      {selectedJobIds.size > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm({
                              title: "Delete selected jobs?",
                              description: `This will permanently delete ${selectedJobIds.size} listing(s). This action cannot be undone.`,
                              tone: "danger",
                              confirmLabel: "Delete",
                              action: async () => {
                                await bulkDeleteJobs()
                              },
                            })
                          }
                          className={dangerButton}
                        >
                          Delete Selected ({selectedJobIds.size})
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-tertiary/60">
                    <thead className="bg-surface-primary">
                      <tr className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                        <th className="px-6 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedJobIds.size > 0 && selectedJobIds.size === jobsFiltered.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedJobIds(new Set(jobsFiltered.map((j) => j.id)))
                              else setSelectedJobIds(new Set())
                            }}
                            className="rounded border-surface-tertiary"
                          />
                        </th>
                        <th className="px-6 py-3 text-left">Role</th>
                        <th className="px-6 py-3 text-left">Company</th>
                        <th className="px-6 py-3 text-left">Created</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-tertiary/60">
                      {jobsFiltered.map((j) => (
                        <tr key={j.id} className="hover:bg-surface-secondary cursor-pointer" onClick={() => setJobDrawer(j)}>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedJobIds.has(j.id)}
                              onChange={() =>
                                setSelectedJobIds((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(j.id)) next.delete(j.id)
                                  else next.add(j.id)
                                  return next
                                })
                              }
                              className="rounded border-surface-tertiary"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-content-primary">{j.title}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-content-primary">{j.company.name}</td>
                          <td className="px-6 py-4 text-sm text-content-secondary">{formatDate(j.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <Link href={`/jobs/${j.id}`} className="text-sm font-semibold text-primary-700 hover:text-primary-900">
                                View
                              </Link>
                              <button
                                type="button"
                                className="text-sm font-semibold text-red-700 hover:text-red-900"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openConfirm({
                                    title: "Delete job?",
                                    description: "This action cannot be undone.",
                                    tone: "danger",
                                    confirmLabel: "Delete",
                                    action: async () => {
                                      await deleteJob(j.id)
                                      setNotice({ tone: "success", message: "Job deleted." })
                                    },
                                  })
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {jobsFiltered.length === 0 ? (
                        <tr>
                          <td className="px-6 py-10 text-center text-sm text-content-secondary" colSpan={5}>
                            No jobs found.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {section === "posts" ? (
              <div className={`${panel} overflow-hidden`}>
                <div className={panelHeader}>
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold text-content-primary">Posts</div>
                      <div className="text-sm text-content-secondary">Moderation (soft remove).</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        placeholder="Search content or author…"
                        className={`${input} text-sm w-[22rem] max-w-full`}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-tertiary/60">
                    <thead className="bg-surface-primary">
                      <tr className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                        <th className="px-6 py-3 text-left">Post</th>
                        <th className="px-6 py-3 text-left">Author</th>
                        <th className="px-6 py-3 text-left">Created</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-tertiary/60">
                      {postsFiltered.map((p) => (
                        <tr key={p.id} className="hover:bg-surface-secondary cursor-pointer" onClick={() => setPostDrawer(p)}>
                          <td className="px-6 py-4">
                            <div className="text-sm text-content-primary line-clamp-2 max-w-[44rem]">{p.content}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-content-primary">{p.author.name || "—"}</div>
                            <div className="text-sm text-content-secondary">{p.author.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-content-secondary">{formatDate(p.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="text-sm font-semibold text-primary-700 hover:text-primary-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPostDrawer(p)
                              }}
                            >
                              Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                      {postsFiltered.length === 0 ? (
                        <tr>
                          <td className="px-6 py-10 text-center text-sm text-content-secondary" colSpan={4}>
                            No posts found.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {section === "ops" ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold text-neutral-900">Ops Tickets</div>
                      <div className="text-sm text-neutral-600">Internal tracking for bugs + feature requests.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpsCreateOpen((v) => !v)}
                        className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 shadow-sm"
                      >
                        New Ticket
                      </button>
                      <button
                        type="button"
                        onClick={loadOpsTickets}
                        className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-50 font-semibold"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {opsCreateOpen ? (
                    <div className="mt-4 border border-neutral-200 rounded-2xl p-4 bg-neutral-50">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">Type</div>
                          <select
                            value={opsCreateDraft.type}
                            onChange={(e) => setOpsCreateDraft((p) => ({ ...p, type: e.target.value as OpsTicketType }))}
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                          >
                            <option value="BUG">Bug</option>
                            <option value="FEATURE">Feature</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">Priority</div>
                          <select
                            value={opsCreateDraft.priority}
                            onChange={(e) =>
                              setOpsCreateDraft((p) => ({ ...p, priority: e.target.value as OpsTicketPriority }))
                            }
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">Title</div>
                          <input
                            value={opsCreateDraft.title}
                            onChange={(e) => setOpsCreateDraft((p) => ({ ...p, title: e.target.value }))}
                            placeholder="Short, specific title"
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">Description</div>
                          <textarea
                            value={opsCreateDraft.description}
                            onChange={(e) => setOpsCreateDraft((p) => ({ ...p, description: e.target.value }))}
                            placeholder="What’s broken / what should change? Include steps to reproduce if relevant."
                            rows={4}
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setOpsCreateOpen(false)}
                          className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-50 font-semibold"
                          disabled={opsSaving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={createOpsTicket}
                          disabled={opsSaving || opsCreateDraft.title.trim().length < 3}
                          className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 shadow-sm disabled:opacity-50"
                        >
                          {opsSaving ? "Creating…" : "Create Ticket"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                  {opsLoading ? (
                    <div className="p-8 text-center text-sm text-neutral-600">Loading tickets…</div>
                  ) : opsError ? (
                    <div className="p-8">
                      <Notice tone="error" title="Failed to load tickets" message={opsError} onDismiss={() => setOpsError(null)} />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-white">
                          <tr className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                            <th className="px-5 py-3 text-left">Ticket</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-left">Priority</th>
                            <th className="px-5 py-3 text-left">Updated</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {opsTickets.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-neutral-50 cursor-pointer"
                              onClick={() => setOpsSelected(t)}
                            >
                              <td className="px-5 py-4">
                                <div className="font-semibold text-neutral-900">{t.title}</div>
                                <div className="text-sm text-neutral-600">Type: {t.type}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={cx("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", statusPill(t.status))}>
                                  {t.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={cx("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", priorityPill(t.priority))}>
                                  {t.priority}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-neutral-600">{formatDateTime(t.updatedAt)}</td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  className="text-sm font-semibold text-primary-700 hover:text-primary-900"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpsSelected(t)
                                  }}
                                >
                                  Details →
                                </button>
                              </td>
                            </tr>
                          ))}
                          {opsTickets.length === 0 ? (
                            <tr>
                              <td className="px-5 py-10 text-center text-sm text-neutral-600" colSpan={5}>
                                No tickets yet.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {section === "recruiting" ? (
              <RecruitingTools linkedInUrls={initialData.linkedInUrls} linkedInUrlsTotal={initialData.linkedInUrlsTotal} />
            ) : null}
          </main>
        </div>
      </div>

      {/* Drawers */}
      <Drawer
        open={!!userDrawer}
        title={userDrawer ? `${userDrawer.name || "User"} · ${userDrawer.email}` : "User"}
        onClose={() => {
          setUserDrawer(null)
          setAudienceSaving(false)
        }}
        footer={
          userDrawer ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Deactivate user?",
                    description: "This disables access for this account (can be re-enabled only via DB).",
                    tone: "danger",
                    confirmLabel: "Deactivate",
                    action: async () => {
                      await deactivateUser(userDrawer.id)
                      setNotice({ tone: "success", message: "User deactivated." })
                    },
                  })
                }
                className={dangerButton}
              >
                Deactivate
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserDrawer(null)}
                  className={subtleButton}
                >
                  Close
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {userDrawer ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-3xl border border-surface-tertiary/60 p-4 bg-surface-primary">
                <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">User ID</div>
                <div className="mt-1 text-sm text-content-primary break-all">{userDrawer.id}</div>
              </div>
              <div className="rounded-3xl border border-surface-tertiary/60 p-4 bg-surface-primary">
                <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Created</div>
                <div className="mt-1 text-sm text-content-primary">{formatDateTime(userDrawer.createdAt)}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-surface-tertiary/60 p-4 bg-surface-primary">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-content-primary">Audience</div>
                  <div className="text-sm text-content-secondary">Admin, Candidate, or Employer/Recruiter.</div>
                </div>
                <span className={cx("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", audiencePillClass(audienceKey(userDrawer)))}>
                  {audienceLabel(userDrawer)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={audienceDraft}
                  onChange={(e) => setAudienceDraft(e.target.value as any)}
                  className={`sm:col-span-2 ${input} text-sm`}
                >
                  <option value="CANDIDATE">Candidate</option>
                  <option value="EMPLOYER">Employer / Recruiter</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    if (!userDrawer) return
                    setAudienceSaving(true)
                    try {
                      await updateUserAudience(userDrawer.id, audienceDraft)
                      setNotice({ tone: "success", message: "Audience updated." })
                      router.refresh()
                    } catch (e: any) {
                      setNotice({ tone: "error", title: "Couldn’t update audience", message: e?.message || "Unknown error" })
                    } finally {
                      setAudienceSaving(false)
                    }
                  }}
                  disabled={audienceSaving || audienceDraft === audienceKey(userDrawer)}
                  className={`${primaryButton} disabled:opacity-50`}
                >
                  {audienceSaving ? "Saving…" : "Save"}
                </button>
              </div>

              <div className="mt-2 text-xs text-content-tertiary">
                Guardrail: you can’t remove your own admin access.
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={!!postDrawer}
        title={postDrawer ? `Post · ${postDrawer.author.email}` : "Post"}
        onClose={() => setPostDrawer(null)}
        footer={
          postDrawer ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Remove post?",
                    description: "This will hide the post from the feed (soft remove).",
                    tone: "danger",
                    confirmLabel: "Remove",
                    action: async () => {
                      await removePost(postDrawer.id)
                      setNotice({ tone: "success", message: "Post removed." })
                    },
                  })
                }
                className="px-4 py-2 rounded-xl border border-red-200 text-red-800 hover:bg-red-50 font-semibold"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setPostDrawer(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-semibold"
              >
                Close
              </button>
            </div>
          ) : null
        }
      >
        {postDrawer ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Author</div>
              <div className="mt-1 text-sm text-neutral-900">{postDrawer.author.name || "—"}</div>
              <div className="text-sm text-neutral-600">{postDrawer.author.email}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Created</div>
              <div className="mt-1 text-sm text-neutral-900">{formatDateTime(postDrawer.createdAt)}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Content</div>
              <div className="mt-2 text-sm text-neutral-900 whitespace-pre-wrap leading-relaxed">{postDrawer.content}</div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={!!jobDrawer}
        title={jobDrawer ? jobDrawer.title : "Job"}
        onClose={() => setJobDrawer(null)}
        footer={
          jobDrawer ? (
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/jobs/${jobDrawer.id}`}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 shadow-sm"
              >
                View Job →
              </Link>
              <button
                type="button"
                onClick={() => setJobDrawer(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-semibold"
              >
                Close
              </button>
            </div>
          ) : null
        }
      >
        {jobDrawer ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Company</div>
              <div className="mt-1 text-sm text-neutral-900">{jobDrawer.company.name}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Created</div>
              <div className="mt-1 text-sm text-neutral-900">{formatDateTime(jobDrawer.createdAt)}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <button
                type="button"
                className="w-full px-4 py-2 rounded-xl border border-red-200 text-red-800 hover:bg-red-50 font-semibold"
                onClick={() =>
                  openConfirm({
                    title: "Delete job?",
                    description: "This action cannot be undone.",
                    tone: "danger",
                    confirmLabel: "Delete",
                    action: async () => {
                      await deleteJob(jobDrawer.id)
                      setNotice({ tone: "success", message: "Job deleted." })
                    },
                  })
                }
              >
                Delete Job
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={!!candidateDrawer}
        title={candidateDrawer ? candidateDrawer.fullName || "Candidate" : "Candidate"}
        onClose={() => setCandidateDrawer(null)}
        footer={
          candidateDrawer ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Delete candidate?",
                    description: "This action cannot be undone.",
                    tone: "danger",
                    confirmLabel: "Delete",
                    action: async () => {
                      await deleteCandidate(candidateDrawer.id)
                      setNotice({ tone: "success", message: "Candidate deleted." })
                    },
                  })
                }
                className="px-4 py-2 rounded-xl border border-red-200 text-red-800 hover:bg-red-50 font-semibold"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setCandidateDrawer(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-semibold"
              >
                Close
              </button>
            </div>
          ) : null
        }
      >
        {candidateDrawer ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Title / Company</div>
              <div className="mt-1 text-sm text-neutral-900">{candidateDrawer.jobTitle || "—"}</div>
              <div className="text-sm text-neutral-600">{candidateDrawer.currentCompany || "—"}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</div>
              <div className="mt-1 text-sm text-neutral-900">{candidateStatusLabel(candidateDrawer.status)}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Created</div>
              <div className="mt-1 text-sm text-neutral-900">{formatDateTime(candidateDrawer.createdAt)}</div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={!!opsSelected}
        title={opsSelected ? `Ticket · ${opsSelected.title}` : "Ticket"}
        onClose={() => setOpsSelected(null)}
        footer={
          opsSelected ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpsSelected(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-semibold"
              >
                Close
              </button>
            </div>
          ) : null
        }
      >
        {opsSelected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</div>
                <select
                  value={opsSelected.status}
                  onChange={(e) => patchOpsTicket(opsSelected.id, { status: e.target.value as OpsTicketStatus })}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                  disabled={opsSaving}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Priority</div>
                <select
                  value={opsSelected.priority}
                  onChange={(e) => patchOpsTicket(opsSelected.id, { priority: e.target.value as OpsTicketPriority })}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                  disabled={opsSaving}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Title</div>
              <input
                defaultValue={opsSelected.title}
                onBlur={(e) => {
                  const next = e.target.value.trim()
                  if (next && next !== opsSelected.title) patchOpsTicket(opsSelected.id, { title: next })
                }}
                className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                disabled={opsSaving}
              />
              <div className="mt-3 text-xs text-neutral-500">
                Tip: edit title/description and click outside the field to save.
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Description</div>
              <textarea
                defaultValue={opsSelected.description || ""}
                onBlur={(e) => {
                  const next = e.target.value
                  if (next !== (opsSelected.description || "")) patchOpsTicket(opsSelected.id, { description: next || null })
                }}
                rows={6}
                className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-sm"
                disabled={opsSaving}
              />
            </div>

            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Metadata</div>
              <div className="mt-2 text-sm text-neutral-700">
                <div>Type: {opsSelected.type}</div>
                <div>Updated: {formatDateTime(opsSelected.updatedAt)}</div>
                <div>Created: {formatDateTime(opsSelected.createdAt)}</div>
                <div className="text-xs text-neutral-500 mt-2 break-all">ID: {opsSelected.id}</div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel || "Confirm"}
        tone={confirm.tone || "default"}
        isConfirmLoading={confirmLoading}
        onCancel={() => setConfirm({ open: false, title: "" })}
        onConfirm={async () => {
          try {
            await runConfirm()
          } catch (e: any) {
            setNotice({ tone: "error", title: "Action failed", message: e?.message || "Unknown error" })
          }
        }}
      />

      <AdminActionsDrawer open={actionsOpen} onClose={() => setActionsOpen(false)} />
    </div>
  )
}

