"use client"

import { useState, useEffect } from "react"

interface WorkflowStep {
  id: string
  type: "EMAIL" | "CALL" | "MESSAGE" | "LINKEDIN" | "SMS"
  delayDays: number
  delayHours?: number
  subject?: string
  content: string
  template?: string
}

interface EngagementWorkflow {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Engagement {
  id: string
  candidateId: string
  workflowId: string | null
  type: string
  subject: string | null
  content: string | null
  scheduledAt: string
  sentAt: string | null
  deliveredAt: string | null
  openedAt: string | null
  clickedAt: string | null
  respondedAt: string | null
  status: string
  workflow?: {
    id: string
    name: string
  }
}

interface EngagementWorkflowProps {
  candidateId: string
  jobId?: string
}

export default function EngagementWorkflow({ candidateId, jobId }: EngagementWorkflowProps) {
  const [workflows, setWorkflows] = useState<EngagementWorkflow[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("")
  const [showEngagements, setShowEngagements] = useState(false)

  useEffect(() => {
    fetchWorkflows()
    fetchEngagements()
  }, [candidateId])

  const fetchWorkflows = async (retryCount = 0) => {
    try {
      if (retryCount === 0) {
        setLoading(true)
      }
      const response = await fetch("/api/engagement/workflows")
      if (response.ok) {
        const data = await response.json()
        const fetchedWorkflows = data.workflows || []
        setWorkflows(fetchedWorkflows)
        console.log(`[EngagementWorkflow] Loaded ${fetchedWorkflows.length} workflows`)
        
        // If no workflows and we haven't retried too many times, retry once
        if (fetchedWorkflows.length === 0 && retryCount < 1) {
          console.log("[EngagementWorkflow] No workflows found, retrying after auto-creation...")
          setTimeout(() => fetchWorkflows(1), 1500)
          return
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[EngagementWorkflow] Error fetching workflows:", errorData)
      }
    } catch (error) {
      console.error("[EngagementWorkflow] Error fetching workflows:", error)
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }

  const fetchEngagements = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/engagements`)
      if (response.ok) {
        const data = await response.json()
        setEngagements(data.engagements || [])
      }
    } catch (error) {
      console.error("Error fetching engagements:", error)
    }
  }

  const executeWorkflow = async () => {
    if (!selectedWorkflow) return

    try {
      setExecuting(true)
      const response = await fetch("/api/engagement/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          workflowId: selectedWorkflow,
          jobId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Show success message
        const workflowName = workflows.find((w) => w.id === selectedWorkflow)?.name || "Workflow"
        alert(`✅ ${workflowName} executed successfully! Engagements have been scheduled.`)
        fetchEngagements()
        setSelectedWorkflow("")
      } else {
        const error = await response.json()
        const errorMessage = error.error || error.details || "Failed to execute workflow"
        alert(`❌ Error: ${errorMessage}`)
        console.error("[EngagementWorkflow] Execution error:", error)
      }
    } catch (error: any) {
      console.error("[EngagementWorkflow] Error executing workflow:", error)
      alert(`❌ Error: ${error.message || "Failed to execute workflow. Please try again."}`)
    } finally {
      setExecuting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800"
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "SENT":
        return "bg-green-100 text-green-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "OPENED":
        return "bg-purple-100 text-purple-800"
      case "CLICKED":
        return "bg-indigo-100 text-indigo-800"
      case "RESPONDED":
        return "bg-emerald-100 text-emerald-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "EMAIL":
        return "📧"
      case "CALL":
        return "📞"
      case "MESSAGE":
        return "💬"
      case "LINKEDIN":
        return "💼"
      case "SMS":
        return "📱"
      default:
        return "📨"
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Engagement Workflows</h3>
        <button
          onClick={() => setShowEngagements(!showEngagements)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showEngagements ? "Hide" : "Show"} Engagements ({engagements.length})
        </button>
      </div>

      {/* Execute Workflow */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Workflow
          </label>
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={executing}
          >
            <option value="">Choose a workflow...</option>
            {workflows
              .filter((w) => w.isActive)
              .map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name} ({workflow.steps.length} steps)
                </option>
              ))}
          </select>
        </div>

        {selectedWorkflow && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              {workflows.find((w) => w.id === selectedWorkflow)?.description ||
                "This workflow will schedule automated engagements with the candidate."}
            </p>
          </div>
        )}

        <button
          onClick={executeWorkflow}
          disabled={!selectedWorkflow || executing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {executing ? "Executing..." : "Execute Workflow"}
        </button>
      </div>

      {/* Engagements List */}
      {showEngagements && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Scheduled Engagements</h4>
          {engagements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No engagements scheduled yet.
            </p>
          ) : (
            <div className="space-y-2">
              {engagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon(engagement.type)}</span>
                        <span className="font-medium text-gray-900">
                          {engagement.type}
                          {engagement.workflow && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({engagement.workflow.name})
                            </span>
                          )}
                        </span>
                      </div>
                      {engagement.subject && (
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {engagement.subject}
                        </p>
                      )}
                      {engagement.content && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {engagement.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Scheduled: {new Date(engagement.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        engagement.status
                      )}`}
                    >
                      {engagement.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

