"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ResumeProfileUpload() {
  const router = useRouter()
  const [resumeText, setResumeText] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeFile(file)
    setError(null)

    // Extract text from file
    try {
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith('.txt')) {
        const text = await file.text()
        setResumeText(text)
      } else if (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
        // For PDF/DOCX, we'll extract on the server side
        // Just show a loading message
        setResumeText("") // Clear existing text - will be extracted server-side
      } else {
        setError(`Unsupported file type: ${file.name.split('.').pop()}. Please use PDF, DOCX, or TXT.`)
      }
    } catch (err: any) {
      setError(`Error reading file: ${err.message}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeFile && !resumeText.trim()) {
      setError("Please upload a resume file or paste resume text")
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

      const response = await fetch("/api/profile/complete-from-resume", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete profile")
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        router.push("/profile/edit")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Profile from Resume</h2>
      <p className="text-sm text-gray-600 mb-6">
        Upload your resume or paste the text below. AI will automatically extract and fill in your profile information.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            {resumeFile && (resumeFile.name.toLowerCase().endsWith('.pdf') || resumeFile.name.toLowerCase().endsWith('.docx') || resumeFile.name.toLowerCase().endsWith('.doc'))
              ? "✅ PDF/DOCX file selected - text will be extracted automatically"
              : "Upload PDF, DOCX, or TXT file. Text will be extracted automatically, or paste text below."}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume Text {resumeFile && (resumeFile.name.toLowerCase().endsWith('.pdf') || resumeFile.name.toLowerCase().endsWith('.docx') || resumeFile.name.toLowerCase().endsWith('.doc')) ? "(optional - will be extracted from file)" : "*"}
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder={resumeFile && (resumeFile.name.toLowerCase().endsWith('.pdf') || resumeFile.name.toLowerCase().endsWith('.docx') || resumeFile.name.toLowerCase().endsWith('.doc'))
              ? "Text will be extracted from file automatically. You can also paste additional text here if needed."
              : "Paste your resume text here, or upload a PDF/DOCX file above"}
            required={!resumeFile || (!resumeFile.name.toLowerCase().endsWith('.pdf') && !resumeFile.name.toLowerCase().endsWith('.docx') && !resumeFile.name.toLowerCase().endsWith('.doc'))}
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
              ✅ Profile updated successfully! Redirecting to edit page...
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (!resumeFile && !resumeText.trim())}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (resumeFile ? "Extracting & Processing Resume..." : "Processing Resume...") : "Complete Profile with AI"}
        </button>
      </form>
    </div>
  )
}

