"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface JobApplicationFormProps {
  jobId: string
}

export default function JobApplicationForm({ jobId }: JobApplicationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [parsingResume, setParsingResume] = useState(false)
  const [parsedResume, setParsedResume] = useState<any>(null)

  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      alert("Please enter resume text first")
      return
    }

    setParsingResume(true)
    try {
      const response = await fetch("/api/resumes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText }),
      })

      if (response.ok) {
        const data = await response.json()
        setParsedResume(data.data)
        // Optionally auto-fill cover letter with summary
        if (data.data.summary && !coverLetter) {
          setCoverLetter(`I am interested in this position because ${data.data.summary.substring(0, 200)}...`)
        }
      } else {
        alert("Failed to parse resume")
      }
    } catch (error) {
      console.error("Error parsing resume:", error)
      alert("An error occurred while parsing resume")
    } finally {
      setParsingResume(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const resumeFile = formData.get("resume") as File

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("resume", resumeFile)
      formDataToSend.append("coverLetter", coverLetter)

      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert("Failed to submit application")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Apply for this position</h3>
      
      {/* AI Resume Parser Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🤖</span>
          <h4 className="text-sm font-semibold text-gray-900">AI Resume Parser (Optional)</h4>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Paste your resume text below to extract key information and auto-fill your application.
        </p>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here..."
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
        />
        <button
          type="button"
          onClick={handleParseResume}
          disabled={parsingResume || !resumeText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {parsingResume ? "Parsing..." : "Parse Resume"}
        </button>
        {parsedResume && (
          <div className="mt-3 p-3 bg-white rounded border border-blue-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Parsed Information:</p>
            <div className="text-xs text-gray-600 space-y-1">
              {parsedResume.name && <p><strong>Name:</strong> {parsedResume.name}</p>}
              {parsedResume.email && <p><strong>Email:</strong> {parsedResume.email}</p>}
              {parsedResume.skills && parsedResume.skills.length > 0 && (
                <p><strong>Skills:</strong> {parsedResume.skills.slice(0, 5).join(", ")}</p>
              )}
              {parsedResume.experience && parsedResume.experience.length > 0 && (
                <p><strong>Experience:</strong> {parsedResume.experience.length} positions found</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume (PDF, DOC, DOCX)
        </label>
        <input
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Letter (Optional)
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={6}
          placeholder="Tell us why you're interested in this position..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  )
}

