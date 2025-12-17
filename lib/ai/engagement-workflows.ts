import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface WorkflowStep {
  id: string
  type: "EMAIL" | "CALL" | "MESSAGE" | "LINKEDIN" | "SMS"
  delayDays: number // Days after previous step
  delayHours?: number // Additional hours
  subject?: string // For emails
  content: string // Message content (can include placeholders)
  template?: string // Template name
}

export interface EngagementWorkflowData {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Pre-built workflow templates
 */
export const WORKFLOW_TEMPLATES = {
  initialOutreach: {
    name: "Initial Outreach Sequence",
    description: "3-touch sequence over 2 weeks for new candidates",
    steps: [
      {
        id: "1",
        type: "EMAIL",
        delayDays: 0,
        subject: "Exciting opportunity at {{companyName}}",
        content:
          "Hi {{candidateName}},\n\nI came across your profile and was impressed by your experience in {{skillArea}}. We have an exciting opportunity that might be a great fit.\n\nWould you be open to a quick conversation?\n\nBest,\n{{recruiterName}}",
        template: "initial_outreach_email_1",
      },
      {
        id: "2",
        type: "EMAIL",
        delayDays: 5,
        subject: "Following up - {{companyName}} opportunity",
        content:
          "Hi {{candidateName}},\n\nI wanted to follow up on my previous message about the {{roleTitle}} position. I think your background in {{skillArea}} would be a great match.\n\nAre you available for a brief call this week?\n\nBest,\n{{recruiterName}}",
        template: "initial_outreach_email_2",
      },
      {
        id: "3",
        type: "LINKEDIN",
        delayDays: 10,
        content:
          "Hi {{candidateName}}, I wanted to reach out about an opportunity that aligns with your experience. Would you be open to connecting?",
        template: "initial_outreach_linkedin",
      },
    ],
  },
  followUp: {
    name: "Follow-up Sequence",
    description: "2-touch follow-up for candidates who didn't respond",
    steps: [
      {
        id: "1",
        type: "EMAIL",
        delayDays: 0,
        subject: "Quick check-in - {{companyName}}",
        content:
          "Hi {{candidateName}},\n\nI wanted to check in about the {{roleTitle}} role. I know you're busy, but I think this could be a great fit.\n\nWould you have 15 minutes for a quick call?\n\nBest,\n{{recruiterName}}",
        template: "followup_email_1",
      },
      {
        id: "2",
        type: "MESSAGE",
        delayDays: 7,
        content:
          "Hi {{candidateName}}, just wanted to follow up one more time. The {{roleTitle}} position is still open and I'd love to discuss it with you.",
        template: "followup_message",
      },
    ],
  },
  reEngagement: {
    name: "Re-engagement Sequence",
    description: "Monthly touchpoint for passive candidates",
    steps: [
      {
        id: "1",
        type: "EMAIL",
        delayDays: 0,
        subject: "New opportunities at {{companyName}}",
        content:
          "Hi {{candidateName}},\n\nI noticed you've been growing in your career. We have some new opportunities that might interest you.\n\nWould you be open to a conversation?\n\nBest,\n{{recruiterName}}",
        template: "reengagement_email",
      },
    ],
  },
}

/**
 * Personalize message content with candidate and job data
 */
export async function personalizeMessage(
  template: string,
  candidate: any,
  job?: any,
  recruiterName: string = "Recruiter"
): Promise<string> {
  let personalized = template

  // Replace candidate placeholders
  personalized = personalized.replace(/\{\{candidateName\}\}/g, candidate.fullName || "there")
  personalized = personalized.replace(
    /\{\{skillArea\}\}/g,
    candidate.jobTitle?.split(" ")[0] || "your field"
  )

  // Replace job placeholders
  if (job) {
    personalized = personalized.replace(/\{\{roleTitle\}\}/g, job.title || "this role")
    personalized = personalized.replace(/\{\{companyName\}\}/g, job.company?.name || "our company")
  } else {
    personalized = personalized.replace(/\{\{roleTitle\}\}/g, "this role")
    personalized = personalized.replace(/\{\{companyName\}\}/g, "our company")
  }

  // Replace recruiter placeholders
  personalized = personalized.replace(/\{\{recruiterName\}\}/g, recruiterName)

  // Use AI to enhance personalization if available
  if (isOpenAIConfigured() && candidate.aiSummary) {
    try {
      const openai = getOpenAIClient()
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional recruiter. Personalize this message to make it more engaging and specific to the candidate. Keep it concise and professional.",
          },
          {
            role: "user",
            content: `Candidate Summary: ${candidate.aiSummary}\n\nMessage to personalize:\n${personalized}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      })

      const enhanced = response.choices[0]?.message?.content
      if (enhanced) {
        personalized = enhanced
      }
    } catch (error) {
      console.error("Error enhancing message with AI:", error)
      // Fall back to template-based personalization
    }
  }

  return personalized
}

/**
 * Create a workflow from a template
 */
export async function createWorkflowFromTemplate(
  templateName: keyof typeof WORKFLOW_TEMPLATES,
  userId: string,
  customName?: string
): Promise<EngagementWorkflowData> {
  const template = WORKFLOW_TEMPLATES[templateName]
  const workflow = await prisma.engagementWorkflow.create({
    data: {
      name: customName || template.name,
      description: template.description,
      steps: JSON.stringify(template.steps),
      isActive: true,
      createdById: userId,
    },
  })

  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description || undefined,
    steps: JSON.parse(workflow.steps),
    isActive: workflow.isActive,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  }
}

/**
 * Execute a workflow for a candidate
 */
export async function executeWorkflow(
  candidateId: string,
  workflowId: string,
  jobId?: string
): Promise<void> {
  const workflow = await prisma.engagementWorkflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow || !workflow.isActive) {
    throw new Error("Workflow not found or inactive")
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  })

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  const job = jobId
    ? await prisma.job.findUnique({
        where: { id: jobId },
        include: { company: true },
      })
    : null

  const steps: WorkflowStep[] = JSON.parse(workflow.steps)
  const now = new Date()

  // Create engagements for each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    let scheduledAt = new Date(now)

    // Calculate delay
    if (i === 0) {
      scheduledAt = new Date(now.getTime() + (step.delayHours || 0) * 60 * 60 * 1000)
    } else {
      const previousStep = steps[i - 1]
      const delayMs =
        (previousStep.delayDays * 24 + (previousStep.delayHours || 0)) * 60 * 60 * 1000
      scheduledAt = new Date(
        scheduledAt.getTime() + delayMs + (step.delayDays * 24 + (step.delayHours || 0)) * 60 * 60 * 1000
      )
    }

    // Personalize content
    const personalizedContent = await personalizeMessage(
      step.content,
      candidate,
      job || undefined,
      "Recruiter"
    )

    const personalizedSubject = step.subject
      ? await personalizeMessage(step.subject, candidate, job || undefined, "Recruiter")
      : null

    // Create engagement record
    await prisma.engagement.create({
      data: {
        candidateId,
        workflowId,
        type: step.type,
        subject: personalizedSubject,
        content: personalizedContent,
        scheduledAt,
        status: "PENDING",
        metadata: JSON.stringify({
          stepId: step.id,
          template: step.template,
          jobId: jobId || null,
        }),
      },
    })
  }
}

/**
 * Get all workflows for a user (including active ones)
 */
export async function getUserWorkflows(userId: string): Promise<EngagementWorkflowData[]> {
  const workflows = await prisma.engagementWorkflow.findMany({
    where: { 
      createdById: userId,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return workflows.map((w: { id: string; name: string; description: string | null; steps: string; isActive: boolean; createdAt: Date; updatedAt: Date }) => ({
    id: w.id,
    name: w.name,
    description: w.description || undefined,
    steps: JSON.parse(w.steps),
    isActive: w.isActive,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }))
}

/**
 * Get engagements for a candidate
 */
export async function getCandidateEngagements(candidateId: string) {
  return prisma.engagement.findMany({
    where: { candidateId },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

/**
 * Update engagement status
 */
export async function updateEngagementStatus(
  engagementId: string,
  status: "PENDING" | "SCHEDULED" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "RESPONDED" | "FAILED" | "CANCELLED",
  metadata?: Record<string, any>
) {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  }

  // Set timestamp based on status
  if (status === "SENT") updateData.sentAt = new Date()
  if (status === "DELIVERED") updateData.deliveredAt = new Date()
  if (status === "OPENED") updateData.openedAt = new Date()
  if (status === "CLICKED") updateData.clickedAt = new Date()
  if (status === "RESPONDED") updateData.respondedAt = new Date()

  if (metadata) {
    updateData.metadata = JSON.stringify(metadata)
  }

  return prisma.engagement.update({
    where: { id: engagementId },
    data: updateData,
  })
}

