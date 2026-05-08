"use client"

import { useState, useEffect } from "react"
import { Mail, Briefcase, CheckCircle2, DollarSign, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Referral {
  id: string
  candidateName: string
  candidateEmail?: string
  candidateLinkedInUrl?: string
  status: string
  submittedAt: string
  hiredAt?: string
  rewardStatus: string
  rewardAmount?: number
  job?: {
    id: string
    title: string
    company: { name: string; slug: string }
  }
  candidate?: { id: string; fullName: string; linkedinUrl: string }
}

interface ReferralStats {
  totalReferrals: number
  pendingReferrals: number
  contactedReferrals: number
  interviewingReferrals: number
  hiredReferrals: number
  rejectedReferrals: number
  hireRate: number
  totalRewards: number
  pendingRewards: number
}

const statusBadge = (status: string) => {
  switch (status) {
    case "HIRED":
      return "text-success border-success/40"
    case "INTERVIEWING":
      return "text-primary border-primary/40"
    case "CONTACTED":
      return "text-warning border-warning/40"
    case "REJECTED":
      return "text-destructive border-destructive/40"
    default:
      return "text-muted-foreground border-border"
  }
}

export default function ReferralSystem() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    candidateLinkedInUrl: "",
    jobId: "",
    notes: "",
  })

  useEffect(() => {
    loadReferrals()
    loadStats()
  }, [])

  const loadReferrals = async () => {
    try {
      const response = await fetch("/api/referrals?type=mine")
      const data = await response.json()
      setReferrals(data.referrals || [])
    } catch (error) {
      console.error("Error loading referrals:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/referrals?type=stats")
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          candidateName: "",
          candidateEmail: "",
          candidateLinkedInUrl: "",
          jobId: "",
          notes: "",
        })
        setShowForm(false)
        loadReferrals()
        loadStats()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to submit referral")
      }
    } catch (error) {
      console.error("Error submitting referral:", error)
      alert("Failed to submit referral")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-secondary rounded w-1/3" />
            <div className="h-4 bg-secondary rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Referral Network</CardTitle>
          <CardDescription className="text-xs mt-1">
            Refer candidates from your network.
          </CardDescription>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1.5">
          {showForm ? "Cancel" : (
            <>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Submit Referral
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-md border border-border bg-secondary/40 p-3">
              <div className="text-xs text-muted-foreground">Total Referrals</div>
              <div className="text-xl font-semibold text-foreground mt-0.5">
                {stats.totalReferrals}
              </div>
            </div>
            <div className="rounded-md border border-border bg-secondary/40 p-3">
              <div className="text-xs text-muted-foreground">Hired</div>
              <div className="text-xl font-semibold text-success mt-0.5">
                {stats.hiredReferrals}
              </div>
            </div>
            <div className="rounded-md border border-border bg-secondary/40 p-3">
              <div className="text-xs text-muted-foreground">Hire Rate</div>
              <div className="text-xl font-semibold text-foreground mt-0.5">
                {stats.hireRate.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-md border border-border bg-secondary/40 p-3">
              <div className="text-xs text-muted-foreground">Total Rewards</div>
              <div className="text-xl font-semibold text-primary mt-0.5">
                ${stats.totalRewards.toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-md border border-border bg-secondary/30 p-4 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="ref-name">Candidate Name *</Label>
              <Input
                id="ref-name"
                type="text"
                required
                value={formData.candidateName}
                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ref-email">Email (optional)</Label>
                <Input
                  id="ref-email"
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ref-linkedin">LinkedIn URL (optional)</Label>
                <Input
                  id="ref-linkedin"
                  type="url"
                  value={formData.candidateLinkedInUrl}
                  onChange={(e) => setFormData({ ...formData, candidateLinkedInUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref-notes">Notes (optional)</Label>
              <Textarea
                id="ref-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Referral
            </Button>
          </form>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Referrals
          </h3>
          {referrals.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">
              No referrals yet. Submit your first referral above!
            </p>
          ) : (
            referrals.map((referral) => (
              <div
                key={referral.id}
                className="rounded-md border border-border p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{referral.candidateName}</h4>
                      <Badge variant="outline" className={cn(statusBadge(referral.status))}>
                        {referral.status}
                      </Badge>
                    </div>
                    {referral.candidateEmail && (
                      <p className="text-sm text-muted-foreground mb-1 inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" aria-hidden />
                        {referral.candidateEmail}
                      </p>
                    )}
                    {referral.job && (
                      <p className="text-sm text-muted-foreground mb-1 inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" aria-hidden />
                        {referral.job.title} at {referral.job.company.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/80">
                      Submitted: {new Date(referral.submittedAt).toLocaleDateString()}
                    </p>
                    {referral.hiredAt && (
                      <p className="text-xs text-success mt-1 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        Hired: {new Date(referral.hiredAt).toLocaleDateString()}
                      </p>
                    )}
                    {referral.rewardAmount && referral.rewardStatus === "PAID" && (
                      <p className="text-xs text-primary mt-1 inline-flex items-center gap-1.5">
                        <DollarSign className="h-3 w-3" aria-hidden />
                        Reward: ${referral.rewardAmount}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
