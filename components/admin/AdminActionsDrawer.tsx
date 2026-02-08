"use client"

import { useMemo, useState } from "react"
import Drawer from "@/components/ui/Drawer"
import Notice, { type NoticeTone } from "@/components/ui/Notice"

type ActionKey =
  | "migrate"
  | "setupGroups"
  | "populateJobs"
  | "scrapeJobs"
  | "importJobs"
  | "linkedinSearch"

type JobSource = "ashby" | "greenhouse" | "lever" | "cleared"

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export default function AdminActionsDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const panelHeader = "px-6 py-5 border-b border-surface-tertiary/40 bg-surface-secondary/40"
  const input =
    "px-4 py-2.5 rounded-2xl border border-surface-tertiary/60 bg-surface-primary text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
  const subtleButton =
    "px-4 py-2.5 rounded-2xl border border-surface-tertiary/60 bg-surface-primary text-content-primary hover:bg-surface-secondary font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
  const primaryButton =
    "px-4 py-2.5 rounded-2xl bg-primary-700 text-white hover:bg-primary-800 font-semibold shadow-elevation-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
  const dangerButton =
    "px-4 py-2.5 rounded-2xl border border-red-200/70 bg-red-50 text-red-900 hover:bg-red-100 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"

  const [active, setActive] = useState<ActionKey>("migrate")
  const [busyKey, setBusyKey] = useState<ActionKey | null>(null)

  const [notice, setNotice] = useState<{ tone: NoticeTone; title?: string; message: string } | null>(null)
  const [result, setResult] = useState<any>(null)

  // Scrape jobs
  const [jobSource, setJobSource] = useState<JobSource>("cleared")
  const [jobQuery, setJobQuery] = useState("software engineer")

  // LinkedIn search
  const [liQuery, setLiQuery] = useState("software engineer")
  const [liLocation, setLiLocation] = useState("")
  const [liCompany, setLiCompany] = useState("")
  const [liTitle, setLiTitle] = useState("")

  const actions = useMemo(
    () => [
      {
        key: "migrate" as const,
        label: "Database Sync",
        description: "Syncs the database schema with Prisma (db push). Use intentionally.",
      },
      {
        key: "setupGroups" as const,
        label: "Setup Groups",
        description: "Creates/updates operator groups and assigns candidates/jobs.",
      },
      { key: "populateJobs" as const, label: "Populate Jobs", description: "Adds a curated batch of jobs." },
      {
        key: "scrapeJobs" as const,
        label: "Scrape Jobs",
        description: "Runs the job scraper (can take several minutes).",
      },
      {
        key: "importJobs" as const,
        label: "Import Scraped Jobs",
        description: "Imports the last scrape output into the database.",
      },
      {
        key: "linkedinSearch" as const,
        label: "Capture LinkedIn URLs",
        description: "Runs SerpAPI search + stores LinkedIn profile URLs for later review.",
      },
    ],
    []
  )

  const run = async (key: ActionKey, fn: () => Promise<any>) => {
    setNotice(null)
    setResult(null)
    setBusyKey(key)
    try {
      const data = await fn()
      setResult(data)
      setNotice({ tone: "success", title: "Completed", message: "Action finished successfully." })
    } catch (e: any) {
      setNotice({ tone: "error", title: "Failed", message: e?.message || "Unknown error" })
    } finally {
      setBusyKey(null)
    }
  }

  const runFetch = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || data.details || data.message || `Request failed (${res.status})`)
    return data
  }

  const isBusy = (k: ActionKey) => busyKey === k

  const activeMeta = actions.find((a) => a.key === active)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Operator Actions"
      widthClassName="max-w-3xl"
      footer={
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-content-tertiary">All actions require Admin privileges.</div>
          <button type="button" onClick={onClose} className={subtleButton}>
            Close
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <aside className="lg:col-span-4">
          <div className="glass-elevated rounded-3xl border border-surface-tertiary/50 shadow-elevation-1 overflow-hidden">
            <div className={panelHeader}>
              <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Actions</div>
            </div>
            <div className="p-2">
              {actions.map((a) => {
                const activeRow = active === a.key
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      setActive(a.key)
                      setNotice(null)
                      setResult(null)
                    }}
                    className={cx(
                      "w-full text-left px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors",
                      activeRow ? "bg-neutral-900 text-white shadow-elevation-2" : "text-content-primary hover:bg-surface-secondary"
                    )}
                  >
                    {a.label}
                    <div className={cx("mt-0.5 text-xs font-medium", activeRow ? "text-white/80" : "text-content-tertiary")}>
                      {a.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-4">
          {notice ? <Notice tone={notice.tone} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} /> : null}

          <div className="glass-elevated rounded-3xl border border-surface-tertiary/50 shadow-elevation-1 overflow-hidden">
            <div className={panelHeader}>
              <div className="text-base font-semibold text-content-primary">{activeMeta?.label}</div>
              <div className="text-sm text-content-secondary mt-1">{activeMeta?.description}</div>
            </div>

            <div className="p-6 space-y-4">
              {active === "migrate" ? (
                <>
                  <div className="rounded-3xl border border-surface-tertiary/60 bg-surface-primary p-4 text-sm text-content-secondary leading-relaxed">
                    This runs Prisma <span className="font-semibold text-content-primary">db push</span> in the server context. It may
                    apply schema changes. Use intentionally.
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={dangerButton}
                      disabled={isBusy("migrate")}
                      onClick={() =>
                        run("migrate", async () =>
                          runFetch("/api/admin/migrate", {
                            method: "POST",
                          })
                        )
                      }
                    >
                      {isBusy("migrate") ? "Running…" : "Run Database Sync"}
                    </button>
                  </div>
                </>
              ) : null}

              {active === "setupGroups" ? (
                <>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={isBusy("setupGroups")}
                      onClick={() =>
                        run("setupGroups", async () =>
                          runFetch("/api/admin/groups/setup", {
                            method: "POST",
                          })
                        )
                      }
                    >
                      {isBusy("setupGroups") ? "Working…" : "Setup Groups"}
                    </button>
                  </div>
                </>
              ) : null}

              {active === "populateJobs" ? (
                <>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={isBusy("populateJobs")}
                      onClick={() =>
                        run("populateJobs", async () =>
                          runFetch("/api/admin/jobs/bulk-add", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                          })
                        )
                      }
                    >
                      {isBusy("populateJobs") ? "Adding…" : "Populate Jobs"}
                    </button>
                  </div>
                </>
              ) : null}

              {active === "scrapeJobs" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-1">Source</div>
                      <select
                        value={jobSource}
                        onChange={(e) => setJobSource(e.target.value as JobSource)}
                        className={`${input} text-sm w-full`}
                        disabled={isBusy("scrapeJobs")}
                      >
                        <option value="cleared">clearD Cleared (multi-board)</option>
                        <option value="ashby">Ashby</option>
                        <option value="greenhouse">Greenhouse</option>
                        <option value="lever">Lever</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-1">Role query</div>
                      <input
                        value={jobQuery}
                        onChange={(e) => setJobQuery(e.target.value)}
                        className={`${input} text-sm w-full`}
                        placeholder='e.g., "software engineer", "cyber analyst"'
                        disabled={isBusy("scrapeJobs")}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={isBusy("scrapeJobs") || jobQuery.trim().length === 0}
                      onClick={() =>
                        run("scrapeJobs", async () => {
                          const params = new URLSearchParams()
                          params.set("force", "true")
                          params.set("query", jobQuery.trim())
                          params.set("source", jobSource)
                          return runFetch(`/api/ashby-jobs?${params.toString()}`, { method: "GET" })
                        })
                      }
                    >
                      {isBusy("scrapeJobs") ? "Scraping…" : "Run Scraper"}
                    </button>
                  </div>
                </>
              ) : null}

              {active === "importJobs" ? (
                <>
                  <div className="rounded-3xl border border-surface-tertiary/60 bg-surface-primary p-4 text-sm text-content-secondary leading-relaxed">
                    Imports the last scrape output into the database. Use after “Scrape Jobs”.
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={isBusy("importJobs")}
                      onClick={() =>
                        run("importJobs", async () =>
                          runFetch("/api/ashby-jobs/import", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                          })
                        )
                      }
                    >
                      {isBusy("importJobs") ? "Importing…" : "Import Jobs"}
                    </button>
                  </div>
                </>
              ) : null}

              {active === "linkedinSearch" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-1">Search query</div>
                      <input
                        value={liQuery}
                        onChange={(e) => setLiQuery(e.target.value)}
                        className={`${input} text-sm w-full`}
                        placeholder="e.g., software engineer, systems engineer, cyber analyst"
                        disabled={isBusy("linkedinSearch")}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-1">Location (optional)</div>
                      <input
                        value={liLocation}
                        onChange={(e) => setLiLocation(e.target.value)}
                        className={`${input} text-sm w-full`}
                        placeholder="e.g., San Diego"
                        disabled={isBusy("linkedinSearch")}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-1">Company (optional)</div>
                      <input
                        value={liCompany}
                        onChange={(e) => setLiCompany(e.target.value)}
                        className={`${input} text-sm w-full`}
                        placeholder="e.g., Lockheed Martin"
                        disabled={isBusy("linkedinSearch")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-1">Title (optional)</div>
                      <input
                        value={liTitle}
                        onChange={(e) => setLiTitle(e.target.value)}
                        className={`${input} text-sm w-full`}
                        placeholder="e.g., Security Engineer"
                        disabled={isBusy("linkedinSearch")}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={isBusy("linkedinSearch") || liQuery.trim().length === 0}
                      onClick={() =>
                        run("linkedinSearch", async () => {
                          const params = new URLSearchParams()
                          params.set("force", "true")
                          params.set("query", liQuery.trim())
                          if (liLocation.trim()) params.set("location", liLocation.trim())
                          if (liCompany.trim()) params.set("company", liCompany.trim())
                          if (liTitle.trim()) params.set("title", liTitle.trim())
                          return runFetch(`/api/linkedin-profiles?${params.toString()}`, { method: "GET" })
                        })
                      }
                    >
                      {isBusy("linkedinSearch") ? "Searching…" : "Search & Save URLs"}
                    </button>
                  </div>
                </>
              ) : null}

              {result ? (
                <div className="mt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Result</div>
                  <pre className="rounded-3xl border border-surface-tertiary/60 bg-surface-primary p-4 text-xs text-content-primary overflow-auto max-h-[18rem]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  )
}

