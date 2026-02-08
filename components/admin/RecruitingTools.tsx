"use client"

import { useState } from "react"
import EngineerFinder from "@/components/EngineerFinder"
import LinkedInProfileSearch from "@/components/LinkedInProfileSearch"
import ATSJobScraper from "@/components/ATSJobScraper"
import LinkedInUrlsList from "@/components/LinkedInUrlsList"

export default function RecruitingTools({
  linkedInUrls,
  linkedInUrlsTotal,
}: {
  linkedInUrls: any[]
  linkedInUrlsTotal: number
}) {
  const [activeMainTab, setActiveMainTab] = useState<"candidates" | "jobs" | "linkedin">("candidates")
  const [activeCandidateTab, setActiveCandidateTab] = useState<"advanced" | "basic">("advanced")

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-semibold text-neutral-900">Recruiting Tools</div>
            <div className="text-sm text-neutral-600">Private, invitation-only sourcing workflows.</div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="px-2 pt-2 border-b border-neutral-200 bg-white">
        <div className="flex gap-1">
          {[
            { key: "candidates", label: "Candidate Search" },
            { key: "jobs", label: "Job Scraper" },
            { key: "linkedin", label: "LinkedIn URL Queue" },
          ].map((t) => {
            const active = activeMainTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveMainTab(t.key as any)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-5">
        {activeMainTab === "candidates" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-2xl p-2">
              <button
                type="button"
                onClick={() => setActiveCandidateTab("advanced")}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeCandidateTab === "advanced"
                    ? "bg-white border border-neutral-200 shadow-sm text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Advanced (Templates)
              </button>
              <button
                type="button"
                onClick={() => setActiveCandidateTab("basic")}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeCandidateTab === "basic"
                    ? "bg-white border border-neutral-200 shadow-sm text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Basic (LinkedIn)
              </button>
            </div>

            <div>
              {activeCandidateTab === "advanced" ? <EngineerFinder /> : null}
              {activeCandidateTab === "basic" ? <LinkedInProfileSearch /> : null}
            </div>
          </div>
        ) : null}

        {activeMainTab === "jobs" ? <ATSJobScraper /> : null}

        {activeMainTab === "linkedin" ? (
          <LinkedInUrlsList initialUrls={linkedInUrls as any} initialTotal={linkedInUrlsTotal} />
        ) : null}
      </div>
    </div>
  )
}

