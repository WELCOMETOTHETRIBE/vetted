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

