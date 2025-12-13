import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { executeWorkflow } from "./engagement-workflows"

export interface CareerMilestone {
  type: "PROMOTION" | "JOB_CHANGE" | "COMPANY_CHANGE" | "SKILL_ADDITION" | "CERTIFICATION"
  detectedAt: Date
  description: string
  confidence: "high" | "medium" | "low"
  metadata?: Record<string, any>
}

export interface ReEngagementCandidate {
  candidateId: string
  candidateName: string
  lastContacted?: Date
  daysSinceLastContact: number
  milestones: CareerMilestone[]
  recommendedJobs?: Array<{
    jobId: string
    jobTitle: string
    matchScore: number
    reason: string
  }>
  reEngagementReason: string
  priority: "high" | "medium" | "low"
}

/**
 * Detect career milestones from candidate data
 */
export async function detectCareerMilestones(candidateId: string): Promise<CareerMilestone[]> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  })

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  const milestones: CareerMilestone[] = []
  const now = new Date()

  // Check for job title changes (promotion indicators)
  if (candidate.jobTitle) {
    const titleLower = candidate.jobTitle.toLowerCase()
    
    // Detect seniority indicators
    if (
      titleLower.includes("senior") ||
      titleLower.includes("lead") ||
      titleLower.includes("principal") ||
      titleLower.includes("staff")
    ) {
      milestones.push({
        type: "PROMOTION",
        detectedAt: now,
        description: `Promoted to ${candidate.jobTitle}`,
        confidence: "medium",
        metadata: { jobTitle: candidate.jobTitle },
      })
    }
  }

  // Check for company changes (if we have previous company data)
  if (candidate.previousTargetCompany && candidate.currentCompany) {
    if (candidate.previousTargetCompany !== candidate.currentCompany) {
      milestones.push({
        type: "COMPANY_CHANGE",
        detectedAt: now,
        description: `Moved from ${candidate.previousTargetCompany} to ${candidate.currentCompany}`,
        confidence: "high",
        metadata: {
          previousCompany: candidate.previousTargetCompany,
          currentCompany: candidate.currentCompany,
        },
      })
    }
  }

  // Check for new certifications
  if (candidate.certifications) {
    try {
      const certs = JSON.parse(candidate.certifications)
      if (Array.isArray(certs) && certs.length > 0) {
        milestones.push({
          type: "CERTIFICATION",
          detectedAt: now,
          description: `Earned ${certs.length} certification(s)`,
          confidence: "medium",
          metadata: { certifications: certs },
        })
      }
    } catch {
      // Not JSON, treat as single certification
      if (candidate.certifications.trim().length > 0) {
        milestones.push({
          type: "CERTIFICATION",
          detectedAt: now,
          description: `Earned certification: ${candidate.certifications}`,
          confidence: "low",
        })
      }
    }
  }

  // Use AI to detect more subtle milestones if available
  if (isOpenAIConfigured() && candidate.rawData) {
    try {
      const openai = getOpenAIClient()
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a career analyst. Analyze candidate data and identify recent career milestones (promotions, job changes, skill additions, certifications). Return a JSON array of milestones with type, description, and confidence level.",
          },
          {
            role: "user",
            content: `Candidate Data:\n${JSON.stringify(JSON.parse(candidate.rawData), null, 2).substring(0, 2000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        try {
          const parsed = JSON.parse(content)
          const aiMilestones = Array.isArray(parsed.milestones) ? parsed.milestones : []
          for (const milestone of aiMilestones) {
            if (milestone.type && milestone.description) {
              milestones.push({
                type: milestone.type,
                detectedAt: now,
                description: milestone.description,
                confidence: milestone.confidence || "medium",
                metadata: milestone.metadata,
              })
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
    } catch (error) {
      console.error("Error detecting milestones with AI:", error)
      // Continue without AI milestones
    }
  }

  return milestones
}

/**
 * Find candidates who should be re-engaged
 */
export async function findReEngagementCandidates(
  maxDaysSinceContact: number = 90
): Promise<ReEngagementCandidate[]> {
  const cutoffDate = new Date(Date.now() - maxDaysSinceContact * 24 * 60 * 60 * 1000)

  // Find candidates who:
  // 1. Haven't been contacted recently
  // 2. Are still ACTIVE (not rejected/hired)
  // 3. Have recent updates (created or updated recently)
  const candidates = await prisma.candidate.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { createdAt: { gte: cutoffDate } },
        { updatedAt: { gte: cutoffDate } },
      ],
    },
    include: {
      engagements: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  const reEngagementCandidates: ReEngagementCandidate[] = []

  for (const candidate of candidates) {
    const lastEngagement = candidate.engagements[0]
    const lastContacted = lastEngagement?.createdAt || candidate.createdAt
    const daysSinceLastContact = Math.floor(
      (Date.now() - lastContacted.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Only include if hasn't been contacted recently
    if (daysSinceLastContact >= 30) {
      const milestones = await detectCareerMilestones(candidate.id)

      // Determine priority
      let priority: "high" | "medium" | "low" = "low"
      let reEngagementReason = ""

      if (milestones.length > 0) {
        priority = "high"
        reEngagementReason = `Recent career milestones detected: ${milestones.map((m) => m.type).join(", ")}`
      } else if (daysSinceLastContact > 60) {
        priority = "medium"
        reEngagementReason = `No contact for ${daysSinceLastContact} days - time to re-engage`
      } else {
        priority = "low"
        reEngagementReason = `Periodic check-in - ${daysSinceLastContact} days since last contact`
      }

      // Find matching jobs
      const matchingJobs = await findMatchingJobs(candidate.id)

      reEngagementCandidates.push({
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        lastContacted: lastEngagement ? lastEngagement.createdAt : undefined,
        daysSinceLastContact,
        milestones,
        recommendedJobs: matchingJobs,
        reEngagementReason,
        priority,
      })
    }
  }

  // Sort by priority and days since contact
  reEngagementCandidates.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.daysSinceLastContact - a.daysSinceLastContact
  })

  return reEngagementCandidates
}

/**
 * Find jobs that match a candidate for re-engagement
 */
async function findMatchingJobs(candidateId: string): Promise<
  Array<{
    jobId: string
    jobTitle: string
    matchScore: number
    reason: string
  }>
> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  })

  if (!candidate || !candidate.jobTitle) {
    return []
  }

  // Find active jobs that match the candidate's title
  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      title: {
        contains: candidate.jobTitle.split(" ")[0], // Match first word of title
        mode: "insensitive",
      },
    },
    include: {
      company: true,
    },
    take: 5,
  })

  return jobs.map((job) => ({
    jobId: job.id,
    jobTitle: job.title,
    matchScore: 75, // Simplified - would use actual matching algorithm
    reason: `Matches candidate's role: ${candidate.jobTitle}`,
  }))
}

/**
 * Trigger re-engagement for a candidate
 */
export async function triggerReEngagement(
  candidateId: string,
  workflowId?: string
): Promise<void> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  })

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  // If workflow ID provided, use it
  if (workflowId) {
    await executeWorkflow(candidateId, workflowId)
    return
  }

  // Otherwise, find or create a re-engagement workflow
  const reEngagementWorkflows = await prisma.engagementWorkflow.findMany({
    where: {
      name: {
        contains: "re-engagement",
        mode: "insensitive",
      },
      isActive: true,
    },
    take: 1,
  })

  if (reEngagementWorkflows.length > 0) {
    await executeWorkflow(candidateId, reEngagementWorkflows[0].id)
  } else {
    // Create a default re-engagement workflow
    const { createWorkflowFromTemplate } = await import("./engagement-workflows")
    const workflow = await createWorkflowFromTemplate("reEngagement", "system", "Re-engagement")
    await executeWorkflow(candidateId, workflow.id)
  }
}

