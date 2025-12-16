import { Suspense } from "react"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import JobApplyContent from "./JobApplyContent"

export default function JobApplyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <Suspense fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      }>
        <JobApplyContent />
      </Suspense>
    </div>
  )
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
    { id: "apply", label: "Apply", icon: "📝" },
    { id: "interview-prep", label: "Interview Prep", icon: "🎯" },
    { id: "resume-improvement", label: "Resume Improvement", icon: "📄" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <span>←</span>
          <span>Back to Job</span>
        </Link>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => router.push(`/jobs/${jobId}/apply?tab=${t.id}`)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {tab === "apply" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for this Position</h2>
                <JobApplicationForm jobId={jobId} />
              </div>
            )}

            {tab === "interview-prep" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Interview Preparation</h2>
                {loadingInterviewPrep ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Generating interview prep...</span>
                  </div>
                ) : !interviewPrep ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Interview Preparation</h3>
                    <p className="text-gray-600 mb-4">
                      Generate personalized interview questions and insights tailored to this job and your profile.
                    </p>
                    <button
                      onClick={loadInterviewPrep}
                      disabled={loadingInterviewPrep}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                      <span>🤖</span>
                      <span>Generate Interview Prep</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Questions */}
                    {interviewPrep.questions && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Interview Questions</h3>
                        
                        {interviewPrep.questions.technical && interviewPrep.questions.technical.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-800 mb-3">Technical Questions</h4>
                            <ul className="space-y-2">
                              {interviewPrep.questions.technical.map((q: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <span className="text-gray-700">{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {interviewPrep.questions.behavioral && interviewPrep.questions.behavioral.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-800 mb-3">Behavioral Questions</h4>
                            <ul className="space-y-2">
                              {interviewPrep.questions.behavioral.map((q: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-600 mt-1">•</span>
                                  <span className="text-gray-700">{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {interviewPrep.questions.roleSpecific && interviewPrep.questions.roleSpecific.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Role-Specific Questions</h4>
                            <ul className="space-y-2">
                              {interviewPrep.questions.roleSpecific.map((q: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-600 mt-1">•</span>
                                  <span className="text-gray-700">{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Insights */}
                    {interviewPrep.insights && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Interview Insights</h3>
                        
                        {interviewPrep.insights.strengths && interviewPrep.insights.strengths.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                              <span>✅</span>
                              <span>Your Strengths</span>
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                              {interviewPrep.insights.strengths.map((s: string, idx: number) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {interviewPrep.insights.talkingPoints && interviewPrep.insights.talkingPoints.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                              <span>💬</span>
                              <span>Talking Points</span>
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                              {interviewPrep.insights.talkingPoints.map((tp: string, idx: number) => (
                                <li key={idx}>{tp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {interviewPrep.insights.questionsToAsk && interviewPrep.insights.questionsToAsk.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                              <span>❓</span>
                              <span>Questions to Ask</span>
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                              {interviewPrep.insights.questionsToAsk.map((q: string, idx: number) => (
                                <li key={idx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {interviewPrep.insights.tips && interviewPrep.insights.tips.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                              <span>💡</span>
                              <span>Tips</span>
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                              {interviewPrep.insights.tips.map((tip: string, idx: number) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "resume-improvement" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Improvement</h2>
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Your Resume</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Paste your resume text below to get AI-powered optimization suggestions tailored to this job.
                    </p>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here (at least 100 characters)..."
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <button
                      onClick={loadResumeImprovements}
                      disabled={loadingResumeImprovements || !resumeText.trim() || resumeText.length < 100}
                      className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loadingResumeImprovements ? "Analyzing..." : "Analyze Resume"}
                    </button>
                  </div>

                  {resumeImprovements && (
                    <div className="space-y-4">
                      {/* Overall Score */}
                      {resumeImprovements.overallScore !== undefined && (
                        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Resume Score</h3>
                            <div className={`text-3xl font-bold ${
                              resumeImprovements.overallScore >= 80 ? "text-green-600" :
                              resumeImprovements.overallScore >= 60 ? "text-blue-600" :
                              "text-orange-600"
                            }`}>
                              {resumeImprovements.overallScore}%
                            </div>
                          </div>
                          {resumeImprovements.summary && (
                            <p className="text-gray-700">{resumeImprovements.summary}</p>
                          )}
                        </div>
                      )}

                      {/* Strengths */}
                      {resumeImprovements.strengths && resumeImprovements.strengths.length > 0 && (
                        <div className="bg-white border border-green-200 rounded-lg p-6">
                          <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <span>✅</span>
                            <span>Strengths</span>
                          </h4>
                          <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {resumeImprovements.strengths.map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvements */}
                      {resumeImprovements.improvements && resumeImprovements.improvements.length > 0 && (
                        <div className="bg-white border border-orange-200 rounded-lg p-6">
                          <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                            <span>🔧</span>
                            <span>Improvements</span>
                          </h4>
                          <div className="space-y-3">
                            {resumeImprovements.improvements.map((imp: any, idx: number) => (
                              <div key={idx} className="border-l-4 border-orange-300 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                    {imp.section || "General"}
                                  </span>
                                  {imp.priority && (
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                      imp.priority === "high" ? "bg-red-100 text-red-700" :
                                      imp.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                                      "bg-blue-100 text-blue-700"
                                    }`}>
                                      {imp.priority}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-700">{imp.suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keyword Suggestions */}
                      {resumeImprovements.keywordSuggestions && resumeImprovements.keywordSuggestions.length > 0 && (
                        <div className="bg-white border border-blue-200 rounded-lg p-6">
                          <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                            <span>🔑</span>
                            <span>Keyword Suggestions</span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {resumeImprovements.keywordSuggestions.map((kw: string, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {resumeImprovements.missingSkills && resumeImprovements.missingSkills.length > 0 && (
                        <div className="bg-white border border-yellow-200 rounded-lg p-6">
                          <h4 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Missing Skills</span>
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {resumeImprovements.missingSkills.map((skill: string, idx: number) => (
                              <li key={idx}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {resumeImprovements.actionItems && resumeImprovements.actionItems.length > 0 && (
                        <div className="bg-white border border-indigo-200 rounded-lg p-6">
                          <h4 className="font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                            <span>📋</span>
                            <span>Action Items</span>
                          </h4>
                          <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {resumeImprovements.actionItems.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <NavbarAdvanced />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <JobApplyContent />
    </Suspense>
  )
}

