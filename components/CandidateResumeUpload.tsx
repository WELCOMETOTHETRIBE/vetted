"use client"

import { useState } from "react"

export default function CandidateResumeUpload() {
  const [resumeText, setResumeText] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeFile(file)
    setError(null)

    // Extract text from file (basic implementation)
    if (file.type === "text/plain") {
      const text = await file.text()
      setResumeText(text)
    } else {
      setError(
        "Please paste the resume text below, or convert your PDF/DOCX to text first. PDF/DOCX parsing coming soon!"
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeText.trim()) {
      setError("Please paste resume text or upload a text file")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      if (resumeFile) {
        formData.append("resume", resumeFile)
      }
      formData.append("resumeText", resumeText)
      if (linkedinUrl) {
        formData.append("linkedinUrl", linkedinUrl)
      }

      const response = await fetch("/api/candidates/upload-resume", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create candidate")
      }

      setSuccess(true)
      setResumeText("")
      setResumeFile(null)
      setLinkedinUrl("")
      setTimeout(() => {
        setShowForm(false)
        setSuccess(false)
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <span>📄</span>
        <span>Add Candidate from Resume</span>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Candidate from Resume</h3>
        <button
          onClick={() => {
            setShowForm(false)
            setResumeText("")
            setResumeFile(null)
            setLinkedinUrl("")
            setError(null)
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn URL (optional)
          </label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Resume (PDF/DOCX/TXT)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            For PDF/DOCX files, please paste the text below. Full file parsing coming soon!
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume Text *
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Paste resume text here... (or copy from PDF/DOCX)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {resumeText.length} characters
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">
              ✅ Candidate created successfully! AI is analyzing the resume...
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !resumeText.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing Resume..." : "Create Candidate with AI"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false)
              setResumeText("")
              setResumeFile(null)
              setLinkedinUrl("")
              setError(null)
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

