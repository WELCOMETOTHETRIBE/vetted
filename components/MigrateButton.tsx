"use client"

import { useState } from "react"

export default function MigrateButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const handleMigrate = async () => {
    if (!confirm("This will update the database schema. Continue?")) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/migrate", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Migration completed successfully!",
        })
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setResult({
          success: false,
          error: data.error || data.details || "Migration failed",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Failed to run migration",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleMigrate}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Running Migration...</span>
          </>
        ) : (
          <>
            <span>🗄️</span>
            <span>Run Database Migration</span>
          </>
        )}
      </button>

      {result && (
        <div
          className={`absolute top-full left-0 mt-2 p-4 rounded-lg border z-50 min-w-[300px] ${
            result.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="font-semibold mb-2">
            {result.success ? "✅ Success" : "❌ Error"}
          </div>
          <div className="text-sm">
            {result.message || result.error}
          </div>
          {result.success && (
            <div className="text-xs mt-2 text-green-700">
              Page will refresh in 2 seconds...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

