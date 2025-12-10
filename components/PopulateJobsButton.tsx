"use client"

import { useState } from "react"

export default function PopulateJobsButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handlePopulate = async () => {
    if (!confirm("This will add 20 jobs to the Jobs page. Continue?")) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/jobs/bulk-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Successfully added ${data.created} jobs!`)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage(`Error: ${data.error || "Failed to add jobs"}`)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message || "Failed to add jobs"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handlePopulate}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding Jobs..." : "Populate Jobs"}
      </button>
      {message && (
        <div
          className={`absolute top-full mt-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
            message.includes("Success")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  )
}

