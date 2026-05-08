"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

    try {
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        const text = await file.text()
        setResumeText(text)
      } else if (
        file.name.toLowerCase().endsWith(".pdf") ||
        file.name.toLowerCase().endsWith(".docx") ||
        file.name.toLowerCase().endsWith(".doc")
      ) {
        setResumeText("")
      } else {
        setError(
          `Unsupported file type: ${file.name.split(".").pop()}. Please use PDF, DOCX, or TXT.`,
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(`Error reading file: ${msg}`)
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
      if (resumeFile) formData.append("resume", resumeFile)
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const isBinary =
    resumeFile &&
    (resumeFile.name.toLowerCase().endsWith(".pdf") ||
      resumeFile.name.toLowerCase().endsWith(".docx") ||
      resumeFile.name.toLowerCase().endsWith(".doc"))

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-2">
          Complete Profile from Resume
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your resume or paste the text below. AI will automatically extract and
          fill in your profile information.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="resume-file">Upload Resume (PDF / DOCX / TXT)</Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              {isBinary
                ? "PDF/DOCX file selected — text will be extracted automatically."
                : "Upload PDF, DOCX, or TXT file, or paste text below."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resume-text">
              Resume Text{" "}
              {isBinary ? (
                <span className="text-muted-foreground font-normal">
                  (optional — will be extracted from file)
                </span>
              ) : (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Textarea
              id="resume-text"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder={
                isBinary
                  ? "Text will be extracted from file automatically. You can also paste additional text here."
                  : "Paste your resume text here, or upload a PDF/DOCX file above."
              }
              required={!isBinary}
            />
            <p className="text-xs text-muted-foreground">
              {resumeText.length} characters
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <AlertDescription>
                Profile updated successfully. Redirecting to edit page…
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || (!resumeFile && !resumeText.trim())}
            className="w-full"
          >
            {loading
              ? resumeFile
                ? "Extracting & Processing Resume…"
                : "Processing Resume…"
              : "Complete Profile with AI"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
