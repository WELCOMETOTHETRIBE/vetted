"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

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
    company: {
      name: string
      slug: string
    }
  }
  candidate?: {
    id: string
    fullName: string
    linkedinUrl: string
  }
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

export default function ReferralSystem() {
  const { data: session } = useSession()
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
    if (session?.user) {
      loadReferrals()
      loadStats()
    }
  }, [session])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HIRED":
        return "bg-green-100 text-green-700"
      case "INTERVIEWING":
        return "bg-blue-100 text-blue-700"
      case "CONTACTED":
        return "bg-yellow-100 text-yellow-700"
      case "REJECTED":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Referral Network</h2>
          <p className="text-gray-600 mt-1">Refer candidates from your network</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ Submit Referral"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Referrals</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Hired</div>
            <div className="text-2xl font-bold text-gray-900">{stats.hiredReferrals}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Hire Rate</div>
            <div className="text-2xl font-bold text-gray-900">{stats.hireRate.toFixed(1)}%</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Rewards</div>
            <div className="text-2xl font-bold text-gray-900">${stats.totalRewards.toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* Submit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate Name *
            </label>
            <input
              type="text"
              required
              value={formData.candidateName}
              onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.candidateEmail}
                onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL (optional)
              </label>
              <input
                type="url"
                value={formData.candidateLinkedInUrl}
                onChange={(e) => setFormData({ ...formData, candidateLinkedInUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Referral
          </button>
        </form>
      )}

      {/* Referrals List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Referrals</h3>
        {referrals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No referrals yet. Submit your first referral above!</p>
        ) : (
          referrals.map((referral) => (
            <div
              key={referral.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{referral.candidateName}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-lg ${getStatusColor(
                        referral.status
                      )}`}
                    >
                      {referral.status}
                    </span>
                  </div>
                  {referral.candidateEmail && (
                    <p className="text-sm text-gray-600 mb-1">📧 {referral.candidateEmail}</p>
                  )}
                  {referral.job && (
                    <p className="text-sm text-gray-600 mb-1">
                      💼 {referral.job.title} at {referral.job.company.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(referral.submittedAt).toLocaleDateString()}
                  </p>
                  {referral.hiredAt && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Hired: {new Date(referral.hiredAt).toLocaleDateString()}
                    </p>
                  )}
                  {referral.rewardAmount && referral.rewardStatus === "PAID" && (
                    <p className="text-xs text-green-600 mt-1">
                      💰 Reward: ${referral.rewardAmount}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

