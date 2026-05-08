"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface JobApplicationFormProps {
  jobId: string
}

interface ParsedResume {
  name?: string
  email?: string
  summary?: string
  skills?: string[]
  experience?: unknown[]
}

export default function JobApplicationForm({ jobId }: JobApplicationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [parsingResume, setParsingResume] = useState(false)
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false)
  const [coverLetterTone, setCoverLetterTone] = useState<
    "professional" | "casual" | "enthusiastic" | "formal"
  >("professional")
  const [coverLetterLength, setCoverLetterLength] = useState<
    "short" | "medium" | "long"
  >("medium")

  const handleGenerateCoverLetter = async () => {
    setGeneratingCoverLetter(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: coverLetterTone, length: coverLetterLength }),
      })

      if (response.ok) {
        const data = await response.json()
        setCoverLetter(data.coverLetter || "")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate cover letter")
      }
    } catch (error) {
      console.error("Error generating cover letter:", error)
      alert("An error occurred while generating cover letter")
    } finally {
      setGeneratingCoverLetter(false)
    }
  }

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
        if (data.data?.summary && !coverLetter) {
          setCoverLetter(
            `I am interested in this position because ${data.data.summary.substring(0, 200)}…`,
          )
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border border-border bg-secondary/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <h4 className="text-sm font-semibold text-foreground">
            AI Resume Parser (optional)
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Paste your resume text below to extract key information and auto-fill your
          application.
        </p>
        <Textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here…"
          rows={4}
          className="resize-none mb-2"
          aria-label="Resume text"
        />
        <Button
          type="button"
          onClick={handleParseResume}
          disabled={parsingResume || !resumeText.trim()}
          size="sm"
          variant="outline"
          className="gap-1.5"
        >
          {parsingResume ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Parsing…
            </>
          ) : (
            "Parse Resume"
          )}
        </Button>
        {parsedResume && (
          <div className="mt-3 p-3 rounded border border-border bg-card text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Parsed Information:</p>
            {parsedResume.name && (
              <p>
                <strong className="text-foreground">Name:</strong> {parsedResume.name}
              </p>
            )}
            {parsedResume.email && (
              <p>
                <strong className="text-foreground">Email:</strong> {parsedResume.email}
              </p>
            )}
            {parsedResume.skills && parsedResume.skills.length > 0 && (
              <p>
                <strong className="text-foreground">Skills:</strong>{" "}
                {parsedResume.skills.slice(0, 5).join(", ")}
              </p>
            )}
            {parsedResume.experience && parsedResume.experience.length > 0 && (
              <p>
                <strong className="text-foreground">Experience:</strong>{" "}
                {parsedResume.experience.length} positions found
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apply-resume">Resume (PDF, DOC, DOCX)</Label>
        <Input
          id="apply-resume"
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <Label htmlFor="apply-cover">Cover Letter (optional)</Label>
          <Button
            type="button"
            onClick={handleGenerateCoverLetter}
            disabled={generatingCoverLetter}
            size="sm"
            variant="outline"
            className="gap-1.5"
          >
            {generatingCoverLetter ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                AI Generate
              </>
            )}
          </Button>
        </div>
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <Select
            value={coverLetterTone}
            onValueChange={(v) => setCoverLetterTone(v as typeof coverLetterTone)}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={coverLetterLength}
            onValueChange={(v) => setCoverLetterLength(v as typeof coverLetterLength)}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="long">Long</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          id="apply-cover"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={6}
          placeholder="Tell us why you're interested in this position…"
          className="resize-none"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  )
}
