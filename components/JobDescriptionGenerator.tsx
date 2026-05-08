"use client"

import { useState } from "react"

interface JobDescriptionGeneratorProps {
  jobId?: string
  existingDescription?: string
  onGenerated?: (description: string) => void
}

export default function JobDescriptionGenerator({ jobId, existingDescription, onGenerated }: JobDescriptionGeneratorProps) {
  const [title, setTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [location, setLocation] = useState("")
  const [requirements, setRequirements] = useState("")
  const [responsibilities, setResponsibilities] = useState("")
  const [generated, setGenerated] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"generate" | "enhance">(existingDescription ? "enhance" : "generate")

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/jobs/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          title,
          companyName,
          location,
          requirements: requirements.split("\n").filter(r => r.trim()),
          responsibilities: responsibilities.split("\n").filter(r => r.trim()),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGenerated(data.description || "")
        onGenerated?.(data.description || "")
      } else {
        alert("Failed to generate description")
      }
    } catch (error) {
      console.error("Error generating description:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleEnhance = async () => {
    if (!existingDescription) return
    setLoading(true)
    try {
      const response = await fetch("/api/jobs/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance",
          existingDescription,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGenerated(data.description || "")
        onGenerated?.(data.description || "")
      } else {
        alert("Failed to enhance description")
      }
    } catch (error) {
      console.error("Error enhancing description:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "enhance" && existingDescription) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span>✨</span>
            <span>Enhance Job Description</span>
          </h3>
          <button
            onClick={() => setMode("generate")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Switch to Generate
          </button>
        </div>
        <button
          onClick={handleEnhance}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Enhancing...</span>
            </>
          ) : (
            <>
              <span>🤖</span>
              <span>Enhance with AI</span>
            </>
          )}
        </button>
        {generated && (
          <div className="mt-4">
            <textarea
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <button
              onClick={() => onGenerated?.(generated)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Use This Description
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span>✨</span>
          <span>Generate Job Description</span>
        </h3>
        {existingDescription && (
          <button
            onClick={() => setMode("enhance")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Switch to Enhance
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Job Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Tech Company Inc."
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA or Remote"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Key Responsibilities (one per line)</label>
          <textarea
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            placeholder="Develop and maintain web applications&#10;Collaborate with cross-functional teams&#10;Write clean, maintainable code"
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Requirements (one per line)</label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="5+ years of software development experience&#10;Proficiency in JavaScript and TypeScript&#10;Experience with React and Node.js"
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !title.trim()}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>🤖</span>
              <span>Generate Description</span>
            </>
          )}
        </button>
        {generated && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">Generated Description</label>
            <textarea
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <button
              onClick={() => onGenerated?.(generated)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Use This Description
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

