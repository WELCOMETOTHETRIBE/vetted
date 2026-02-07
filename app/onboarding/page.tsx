"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import NavbarAdvanced from "@/components/NavbarAdvanced"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<"CANDIDATE" | "EMPLOYER">("CANDIDATE")
  const [formData, setFormData] = useState({
    headline: "",
    location: "",
    about: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Persist audience selection first
      const acctRes = await fetch("/api/account-type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType }),
      })
      if (!acctRes.ok) {
        const acctErr = await acctRes.json().catch(() => ({}))
        throw new Error(acctErr.error || "Failed to set account type")
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Redirect to feed after successful profile update
        window.location.href = "/feed"
        return
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Profile update failed:", errorData)
        alert("Failed to update profile. Please try again.")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Complete Your Cleared Mission Profile
          </h1>
          <p className="text-gray-600 mb-8">
            Capture clearance context, mission readiness, and professional continuity for defense work. Keep details professional and security-conscious.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="text-sm font-semibold text-gray-900 mb-2">I’m using clearD as</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  accountType === "CANDIDATE" ? "bg-white border-blue-300" : "bg-white/70 border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="CANDIDATE"
                    checked={accountType === "CANDIDATE"}
                    onChange={() => setAccountType("CANDIDATE")}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Cleared Professional</div>
                    <div className="text-xs text-gray-600">
                      Build a cleared mission profile and discover aligned roles.
                    </div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  accountType === "EMPLOYER" ? "bg-white border-blue-300" : "bg-white/70 border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="EMPLOYER"
                    checked={accountType === "EMPLOYER"}
                    onChange={() => setAccountType("EMPLOYER")}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Hiring Team</div>
                    <div className="text-xs text-gray-600">
                      Review cleared talent pools and engage mission-ready candidates.
                    </div>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Admin accounts can manage both experiences.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headline
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) =>
                  setFormData({ ...formData, headline: e.target.value })
                }
                placeholder="e.g., Systems Engineer | Active Secret | Transitioning 2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., San Francisco, CA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About
              </label>
              <textarea
                value={formData.about}
                onChange={(e) =>
                  setFormData({ ...formData, about: e.target.value })
                }
                rows={6}
                placeholder="Brief mission summary: what programs/mission areas you’ve supported, validated capabilities, and clearance status (avoid classified details)."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/feed"
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Complete Mission Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

