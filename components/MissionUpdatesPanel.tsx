"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { RefreshCw, AlertTriangle, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
          throw new Error((json as { error?: string })?.error || "Failed to load mission updates")
        }
        if (mounted) setData(json as MissionUpdatesResponse)
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load mission updates"
        if (mounted) setError(message)
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm">{header.title}</CardTitle>
          <CardDescription className="text-xs mt-1">{header.subtitle}</CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-border rounded-md p-4 animate-pulse">
                <div className="h-4 w-2/3 bg-secondary rounded mb-2" />
                <div className="h-3 w-1/2 bg-secondary rounded mb-3" />
                <div className="h-3 w-5/6 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !data || !data.updates || data.updates.length === 0 ? (
          <div className="border border-border bg-secondary/40 rounded-md p-4 text-sm text-muted-foreground inline-flex items-center gap-2">
            <Inbox className="h-4 w-4" aria-hidden />
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
                    className="group border border-border rounded-md p-4 hover:border-primary/40 hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary">
                          {u.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {(u.company || "Company") + " • " + locationLabel(u)}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap">{when}</div>
                    </div>

                    {u.matchedSkills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {u.matchedSkills.slice(0, 4).map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="text-[11px] text-primary border-primary/30"
                          >
                            {s}
                          </Badge>
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
                    className="group border border-border rounded-md p-4 hover:border-primary/40 hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary">
                          {u.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {u.jobTitle || "Cleared professional"}
                          {u.location ? ` • ${u.location}` : ""}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap">{when}</div>
                    </div>
                    <div className="mt-3 text-[11px] text-muted-foreground">
                      Status: <span className="text-foreground">{u.status}</span>
                    </div>
                  </Link>
                )
              }

              if (u.type === "newUser") {
                const when = formatRelative(new Date(u.createdAt))
                return (
                  <div
                    key={`user-${u.id}`}
                    className="border border-border rounded-md p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          New profile: {u.name || "Member"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {u.handle ? `@${u.handle}` : "No handle yet"}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap">{when}</div>
                    </div>
                  </div>
                )
              }

              // opsTicket
              const when = formatRelative(new Date(u.updatedAt))
              return (
                <div
                  key={`ops-${u.id}`}
                  className="border border-border rounded-md p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {u.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {u.ticketType} • {u.status} • {u.priority}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">{when}</div>
                  </div>
                  {u.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {u.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
