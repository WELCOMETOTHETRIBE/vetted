"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Audience = "CANDIDATE" | "EMPLOYER" | "ADMIN"

type MissionUpdate =
  | {
      type: "job"
      id: string
      title: string
      company?: string | null
      companySlug?: string | null
      location?: string | null
      isRemote: boolean
      isHybrid: boolean
      createdAt: string
      score: number
      matchedSkills: string[]
      matchedKeywords: string[]
    }
  | {
      type: "candidate"
      id: string
      fullName: string
      jobTitle?: string | null
      currentCompany?: string | null
      location?: string | null
      status: string
      createdAt: string
    }
  | {
      type: "newUser"
      id: string
      name?: string | null
      handle?: string | null
      createdAt: string
    }
  | {
      type: "opsTicket"
      id: string
      ticketType: string
      status: string
      priority: string
      title: string
      description?: string | null
      updatedAt: string
      createdAt: string
    }

type MissionUpdatesResponse = {
  audience: Audience
  updates: MissionUpdate[]
}

function formatRelative(d: Date) {
  const delta = Date.now() - d.getTime()
  const mins = Math.round(delta / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

function locationLabel(u: { isRemote: boolean; isHybrid: boolean; location?: string | null }) {
  if (u.isRemote) return "Remote"
  if (u.isHybrid) return `Hybrid${u.location ? ` • ${u.location}` : ""}`
  return u.location || "Location TBD"
}

export default function MissionUpdatesPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<MissionUpdatesResponse | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/mission-updates")
        const json = (await res.json()) as MissionUpdatesResponse | { error?: string }
        if (!res.ok) {
          throw new Error((json as any)?.error || "Failed to load mission updates")
        }
        if (mounted) setData(json as MissionUpdatesResponse)
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load mission updates")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const audience = data?.audience

  const header =
    audience === "EMPLOYER"
      ? { title: "Talent Signals", subtitle: "New candidates and new clearD profiles." }
      : audience === "ADMIN"
      ? { title: "Operator Queue", subtitle: "Bugs and feature requests needing attention." }
      : { title: "Role Signals", subtitle: "New roles aligned to your mission profile." }

  return (
    <section className="bg-white rounded-2xl border border-neutral-200 shadow-card px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{header.title}</h2>
          <p className="text-xs text-neutral-600 mt-1">{header.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-2/3 bg-neutral-200 rounded mb-2" />
                <div className="h-3 w-1/2 bg-neutral-200 rounded mb-3" />
                <div className="h-3 w-5/6 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-red-200 bg-red-50 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        ) : !data || !data.updates || data.updates.length === 0 ? (
          <div className="border border-neutral-200 bg-neutral-50 rounded-2xl p-4 text-sm text-neutral-700">
            No mission updates yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.updates.slice(0, 6).map((u) => {
              if (u.type === "job") {
                const when = formatRelative(new Date(u.createdAt))
                return (
                  <Link
                    key={`job-${u.id}`}
                    href={`/jobs/${u.id}`}
                    className="group border border-neutral-200 rounded-2xl p-4 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-700">
                          {u.title}
                        </div>
                        <div className="text-xs text-neutral-600 mt-1 truncate">
                          {(u.company || "Company") + " • " + locationLabel(u)}
                        </div>
                      </div>
                      <div className="text-[11px] text-neutral-500 whitespace-nowrap">{when}</div>
                    </div>

                    {u.matchedSkills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {u.matchedSkills.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="text-[11px] px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                )
              }

              if (u.type === "candidate") {
                const when = formatRelative(new Date(u.createdAt))
                return (
                  <Link
                    key={`cand-${u.id}`}
                    href={`/candidates?search=${encodeURIComponent(u.fullName)}`}
                    className="group border border-neutral-200 rounded-2xl p-4 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-700">
                          {u.fullName}
                        </div>
                        <div className="text-xs text-neutral-600 mt-1 truncate">
                          {u.jobTitle || "Cleared professional"}{u.location ? ` • ${u.location}` : ""}
                        </div>
                      </div>
                      <div className="text-[11px] text-neutral-500 whitespace-nowrap">{when}</div>
                    </div>
                    <div className="mt-3 text-[11px] text-neutral-500">
                      Status: {u.status}
                    </div>
                  </Link>
                )
              }

              if (u.type === "newUser") {
                const when = formatRelative(new Date(u.createdAt))
                return (
                  <div
                    key={`user-${u.id}`}
                    className="border border-neutral-200 rounded-2xl p-4 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 truncate">
                          New profile: {u.name || "Member"}
                        </div>
                        <div className="text-xs text-neutral-600 mt-1 truncate">
                          {u.handle ? `@${u.handle}` : "No handle yet"}
                        </div>
                      </div>
                      <div className="text-[11px] text-neutral-500 whitespace-nowrap">{when}</div>
                    </div>
                  </div>
                )
              }

              // opsTicket
              const when = formatRelative(new Date(u.updatedAt))
              return (
                <div
                  key={`ops-${u.id}`}
                  className="border border-neutral-200 rounded-2xl p-4 bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">
                        {u.title}
                      </div>
                      <div className="text-xs text-neutral-600 mt-1 truncate">
                        {u.ticketType} • {u.status} • {u.priority}
                      </div>
                    </div>
                    <div className="text-[11px] text-neutral-500 whitespace-nowrap">{when}</div>
                  </div>
                  {u.description && (
                    <p className="text-xs text-neutral-700 mt-2 line-clamp-2">
                      {u.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

