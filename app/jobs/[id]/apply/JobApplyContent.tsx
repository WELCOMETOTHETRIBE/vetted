"use client"

import { useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  Target,
  ScrollText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  KeyRound,
  Lightbulb,
  MessageCircle,
  HelpCircle,
  ListChecks,
} from "lucide-react"
import JobApplicationForm from "@/components/JobApplicationForm"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface InterviewPrep {
  questions?: {
    technical?: string[]
    behavioral?: string[]
    roleSpecific?: string[]
  }
  insights?: {
    strengths?: string[]
    talkingPoints?: string[]
    questionsToAsk?: string[]
    tips?: string[]
  }
}

interface ResumeImprovements {
  overallScore?: number
  summary?: string
  strengths?: string[]
  improvements?: { section?: string; priority?: string; suggestion: string }[]
  keywordSuggestions?: string[]
  missingSkills?: string[]
  actionItems?: string[]
}

interface JobApplyShellProps {
  viewer: {
    name?: string | null
    email: string
    role: string
    accountType: string
  }
}

export default function JobApplyContent({ viewer }: JobApplyShellProps) {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = params.id as string
  const tab = searchParams.get("tab") || "apply"

  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null)
  const [loadingInterviewPrep, setLoadingInterviewPrep] = useState(false)
  const [resumeImprovements, setResumeImprovements] = useState<ResumeImprovements | null>(null)
  const [loadingResumeImprovements, setLoadingResumeImprovements] = useState(false)
  const [resumeText, setResumeText] = useState("")

  const loadInterviewPrep = async () => {
    setLoadingInterviewPrep(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/user-interview-prep`, {
        method: "POST",
      })
      if (response.ok) {
        const data = await response.json()
        setInterviewPrep(data)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate interview prep")
      }
    } catch (error) {
      console.error("Error loading interview prep:", error)
      alert("An error occurred while generating interview prep")
    } finally {
      setLoadingInterviewPrep(false)
    }
  }

  const loadResumeImprovements = async () => {
    if (!resumeText.trim() || resumeText.length < 100) {
      alert("Please enter at least 100 characters of your resume text")
      return
    }
    setLoadingResumeImprovements(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/user-resume-improvement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      })
      if (response.ok) {
        const data = await response.json()
        setResumeImprovements(data)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate resume improvements")
      }
    } catch (error) {
      console.error("Error loading resume improvements:", error)
      alert("An error occurred")
    } finally {
      setLoadingResumeImprovements(false)
    }
  }

  const tabs = [
    { id: "apply", label: "Apply", Icon: FileText },
    { id: "interview-prep", label: "Interview Prep", Icon: Target },
    { id: "resume-improvement", label: "Resume Improvement", Icon: ScrollText },
  ]

  return (
    <ClearDShell viewer={viewer}>
      <div className="max-w-5xl mx-auto space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-3">
          <Link href={`/jobs/${jobId}`}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to Job
          </Link>
        </Button>

        <Card>
          <div className="flex border-b border-border" role="tablist">
            {tabs.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => router.push(`/jobs/${jobId}/apply?tab=${t.id}`)}
                  className={cn(
                    "flex-1 px-4 sm:px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "text-primary border-b-2 border-primary -mb-px bg-secondary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    <t.Icon className="h-4 w-4" aria-hidden />
                    <span>{t.label}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <CardContent className="p-6">
            {tab === "apply" && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Apply for this Position
                </h2>
                <JobApplicationForm jobId={jobId} />
              </div>
            )}

            {tab === "interview-prep" && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Interview Preparation
                </h2>
                {loadingInterviewPrep ? (
                  <div className="flex items-center justify-center py-12 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
                    <span className="text-muted-foreground">
                      Generating interview prep…
                    </span>
                  </div>
                ) : !interviewPrep ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-10 h-10 rounded-md bg-secondary border border-border flex items-center justify-center text-primary mb-3">
                      <Target className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      Get Interview Preparation
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-prose mx-auto">
                      Generate personalized interview questions and insights tailored to
                      this job and your profile.
                    </p>
                    <Button
                      onClick={loadInterviewPrep}
                      disabled={loadingInterviewPrep}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden />
                      Generate Interview Prep
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {interviewPrep.questions && (
                      <div className="rounded-md border border-border p-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">
                          Interview Questions
                        </h3>

                        {interviewPrep.questions.technical?.length ? (
                          <div className="mb-6">
                            <h4 className="font-semibold text-foreground mb-3 text-sm">
                              Technical Questions
                            </h4>
                            <ul className="space-y-2">
                              {interviewPrep.questions.technical.map((q, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-1" aria-hidden>•</span>
                                  <span className="text-sm text-muted-foreground">{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {interviewPrep.questions.behavioral?.length ? (
                          <div className="mb-6">
                            <h4 className="font-semibold text-foreground mb-3 text-sm">
                              Behavioral Questions
                            </h4>
                            <ul className="space-y-2">
                              {interviewPrep.questions.behavioral.map((q, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-1" aria-hidden>•</span>
                                  <span className="text-sm text-muted-foreground">{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {interviewPrep.questions.roleSpecific?.length ? (
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 text-sm">
                              Role-Specific Questions
                            </h4>
                            <ul className="space-y-2">
                              {interviewPrep.questions.roleSpecific.map((q, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-1" aria-hidden>•</span>
                                  <span className="text-sm text-muted-foreground">{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {interviewPrep.insights && (
                      <div className="rounded-md border border-border p-6">
                        <h3 className="text-base font-semibold text-foreground mb-4">
                          Interview Insights
                        </h3>

                        {interviewPrep.insights.strengths?.length ? (
                          <div className="mb-4">
                            <h4 className="font-semibold text-success mb-2 inline-flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4" aria-hidden />
                              Your Strengths
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                              {interviewPrep.insights.strengths.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {interviewPrep.insights.talkingPoints?.length ? (
                          <div className="mb-4">
                            <h4 className="font-semibold text-primary mb-2 inline-flex items-center gap-2 text-sm">
                              <MessageCircle className="h-4 w-4" aria-hidden />
                              Talking Points
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                              {interviewPrep.insights.talkingPoints.map((tp, idx) => (
                                <li key={idx}>{tp}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {interviewPrep.insights.questionsToAsk?.length ? (
                          <div className="mb-4">
                            <h4 className="font-semibold text-primary mb-2 inline-flex items-center gap-2 text-sm">
                              <HelpCircle className="h-4 w-4" aria-hidden />
                              Questions to Ask
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                              {interviewPrep.insights.questionsToAsk.map((q, idx) => (
                                <li key={idx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {interviewPrep.insights.tips?.length ? (
                          <div>
                            <h4 className="font-semibold text-primary mb-2 inline-flex items-center gap-2 text-sm">
                              <Lightbulb className="h-4 w-4" aria-hidden />
                              Tips
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                              {interviewPrep.insights.tips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "resume-improvement" && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Resume Improvement
                </h2>
                <div className="space-y-6">
                  <div className="rounded-md border border-border p-6">
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      Upload Your Resume
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Paste your resume text below to get AI-powered optimization
                      suggestions tailored to this job.
                    </p>
                    <Textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here (at least 100 characters)…"
                      rows={10}
                      className="resize-none"
                      aria-label="Resume text"
                    />
                    <Button
                      onClick={loadResumeImprovements}
                      disabled={
                        loadingResumeImprovements ||
                        !resumeText.trim() ||
                        resumeText.length < 100
                      }
                      className="mt-4 gap-2"
                    >
                      {loadingResumeImprovements ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" aria-hidden />
                          Analyze Resume
                        </>
                      )}
                    </Button>
                  </div>

                  {resumeImprovements && (
                    <div className="space-y-4">
                      {resumeImprovements.overallScore !== undefined && (
                        <div className="rounded-md border border-border p-6">
                          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">
                              Resume Score
                            </h3>
                            <span
                              className={cn(
                                "text-2xl font-semibold",
                                resumeImprovements.overallScore >= 80 && "text-success",
                                resumeImprovements.overallScore >= 60 &&
                                  resumeImprovements.overallScore < 80 &&
                                  "text-primary",
                                resumeImprovements.overallScore < 60 && "text-warning",
                              )}
                            >
                              {resumeImprovements.overallScore}%
                            </span>
                          </div>
                          {resumeImprovements.summary && (
                            <p className="text-sm text-muted-foreground">
                              {resumeImprovements.summary}
                            </p>
                          )}
                        </div>
                      )}

                      {resumeImprovements.strengths?.length ? (
                        <div className="rounded-md border border-border p-6">
                          <h4 className="font-semibold text-success mb-3 inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" aria-hidden />
                            Strengths
                          </h4>
                          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            {resumeImprovements.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {resumeImprovements.improvements?.length ? (
                        <div className="rounded-md border border-border p-6">
                          <h4 className="font-semibold text-warning mb-3 inline-flex items-center gap-2">
                            <Wrench className="h-4 w-4" aria-hidden />
                            Improvements
                          </h4>
                          <div className="space-y-3">
                            {resumeImprovements.improvements.map((imp, idx) => (
                              <div
                                key={idx}
                                className="border-l-2 border-warning/40 pl-4"
                              >
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="outline">
                                    {imp.section || "General"}
                                  </Badge>
                                  {imp.priority && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        imp.priority === "high" && "text-destructive border-destructive/40",
                                        imp.priority === "medium" && "text-warning border-warning/40",
                                        imp.priority === "low" && "text-primary border-primary/40",
                                      )}
                                    >
                                      {imp.priority}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{imp.suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {resumeImprovements.keywordSuggestions?.length ? (
                        <div className="rounded-md border border-border p-6">
                          <h4 className="font-semibold text-primary mb-3 inline-flex items-center gap-2">
                            <KeyRound className="h-4 w-4" aria-hidden />
                            Keyword Suggestions
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {resumeImprovements.keywordSuggestions.map((kw, idx) => (
                              <Badge key={idx} variant="outline" className="text-primary border-primary/30">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {resumeImprovements.missingSkills?.length ? (
                        <div className="rounded-md border border-border p-6">
                          <h4 className="font-semibold text-warning mb-3 inline-flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" aria-hidden />
                            Missing Skills
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {resumeImprovements.missingSkills.map((skill, idx) => (
                              <li key={idx}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {resumeImprovements.actionItems?.length ? (
                        <div className="rounded-md border border-border p-6">
                          <h4 className="font-semibold text-primary mb-3 inline-flex items-center gap-2">
                            <ListChecks className="h-4 w-4" aria-hidden />
                            Action Items
                          </h4>
                          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            {resumeImprovements.actionItems.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClearDShell>
  )
}
