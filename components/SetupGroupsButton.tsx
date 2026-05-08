"use client"

import { useState } from "react"

export default function SetupGroupsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    if (!confirm("This will create/update groups and assign candidates/jobs to them. Continue?")) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/groups/setup", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup groups")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleSetup}
        disabled={loading}
        className="px-5 py-2.5 bg-purple-700 text-white rounded-xl hover:bg-purple-800 font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Setting up groups..." : "🚀 Setup Groups & Assign Candidates/Jobs"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-success/10 border border-success/40 rounded-lg">
          <p className="text-success font-semibold mb-2">✅ Groups setup complete!</p>
          <div className="text-sm text-success space-y-1">
            <p>Groups created: {result.results?.groupsCreated || 0}</p>
            <p>Groups updated: {result.results?.groupsUpdated || 0}</p>
            <p>Candidates assigned: {result.results?.candidatesAssigned || 0}</p>
            <p>Jobs assigned: {result.results?.jobsAssigned || 0}</p>
          </div>
          <button
            onClick={() => window.location.href = "/groups"}
            className="mt-3 text-sm text-success hover:text-green-900 underline"
          >
            View Groups →
          </button>
        </div>
      )}
    </div>
  )
}

