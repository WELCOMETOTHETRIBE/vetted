import { prisma } from "@/lib/prisma"
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"

export interface TimelineEvent {
  id: string
  type: "ENGAGEMENT" | "STATUS_CHANGE" | "NOTE" | "SCORE_CALCULATED"
  title: string
  description?: string
  timestamp: Date
  metadata?: Record<string, any>
  icon?: string
  color?: string
}

export interface RelationshipHealth {
  score: number // 0-100
  level: "excellent" | "good" | "fair" | "poor" | "cold"
  factors: Array<{
    factor: string
    impact: "positive" | "negative" | "neutral"
    description: string
  }>
  lastInteraction?: Date
  daysSinceLastInteraction: number
  totalInteractions: number
  responseRate: number // percentage
}

export interface NextAction {
  action: string
  type: "EMAIL" | "CALL" | "MESSAGE" | "LINKEDIN" | "WAIT" | "FOLLOW_UP"
  priority: "high" | "medium" | "low"
  reason: string
  suggestedDate?: Date
}

/**
 * Get timeline of all interactions for a candidate
 */
export async function getCandidateTimeline(candidateId: string): Promise<TimelineEvent[]> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      engagements: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  const events: TimelineEvent[] = []

  // Add engagement events
  for (const engagement of candidate.engagements) {
    const typeIconMap: Record<string, string> = {
      EMAIL: "📧",
      CALL: "📞",
      MESSAGE: "💬",
      LINKEDIN: "💼",
      SMS: "📱",
    }
    const typeIcon = typeIconMap[engagement.type as string] || "📨"

    const statusColorMap: Record<string, string> = {
      PENDING: "gray",
      SCHEDULED: "blue",
      SENT: "green",
      DELIVERED: "green",
      OPENED: "purple",
      CLICKED: "indigo",
      RESPONDED: "emerald",
      FAILED: "red",
      CANCELLED: "gray",
    }
    const statusColor = statusColorMap[engagement.status as string] || "gray"

    events.push({
      id: engagement.id,
      type: "ENGAGEMENT",
      title: `${engagement.type} ${engagement.subject ? `: ${engagement.subject}` : ""}`,
      description: engagement.content || undefined,
      timestamp: engagement.scheduledAt,
      metadata: {
        engagementId: engagement.id,
        type: engagement.type,
        status: engagement.status,
        sentAt: engagement.sentAt,
        openedAt: engagement.openedAt,
        respondedAt: engagement.respondedAt,
      },
      icon: typeIcon,
      color: statusColor,
    })
  }

  // Add status change events
  if (candidate.status === "CONTACTED") {
    events.push({
      id: `status-${candidate.id}`,
      type: "STATUS_CHANGE",
      title: "Status changed to CONTACTED",
      timestamp: candidate.updatedAt,
      icon: "📝",
      color: "blue",
    })
  }

  // Add creation event
  events.push({
    id: `created-${candidate.id}`,
    type: "STATUS_CHANGE",
    title: "Candidate added to system",
    timestamp: candidate.createdAt,
    icon: "➕",
    color: "green",
  })

  // Add predictive score events
  if (candidate.scoreGeneratedAt) {
    events.push({
      id: `score-${candidate.id}`,
      type: "SCORE_CALCULATED",
      title: `Predictive score calculated: ${candidate.predictiveScore}%`,
      description: `Confidence: ${candidate.scoreConfidence}`,
      timestamp: candidate.scoreGeneratedAt,
      icon: "📊",
      color: candidate.predictiveScore && candidate.predictiveScore >= 70 ? "green" : "yellow",
      metadata: {
        score: candidate.predictiveScore,
        confidence: candidate.scoreConfidence,
      },
    })
  }

  // Sort by timestamp (newest first)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return events
}

/**
 * Calculate relationship health score
 */
export async function calculateRelationshipHealth(
  candidateId: string
): Promise<RelationshipHealth> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      engagements: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  const engagements = candidate.engagements
  const totalInteractions = engagements.length

  // Calculate response rate
  const respondedEngagements = engagements.filter((e) => e.respondedAt !== null).length
  const sentEngagements = engagements.filter(
    (e) => e.status === "SENT" || e.status === "DELIVERED" || e.status === "OPENED" || e.status === "CLICKED" || e.status === "RESPONDED"
  ).length
  const responseRate = sentEngagements > 0 ? (respondedEngagements / sentEngagements) * 100 : 0

  // Calculate days since last interaction
  const lastInteraction =
    engagements.length > 0 ? engagements[0].createdAt : candidate.createdAt
  const daysSinceLastInteraction = Math.floor(
    (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate health score (0-100)
  let score = 50 // Base score

  const factors: Array<{
    factor: string
    impact: "positive" | "negative" | "neutral"
    description: string
  }> = []

  // Factor 1: Response rate
  if (responseRate > 50) {
    score += 20
    factors.push({
      factor: "High Response Rate",
      impact: "positive",
      description: `${responseRate.toFixed(0)}% response rate indicates good engagement`,
    })
  } else if (responseRate > 25) {
    score += 10
    factors.push({
      factor: "Moderate Response Rate",
      impact: "neutral",
      description: `${responseRate.toFixed(0)}% response rate`,
    })
  } else if (responseRate > 0) {
    factors.push({
      factor: "Low Response Rate",
      impact: "negative",
      description: `${responseRate.toFixed(0)}% response rate - candidate may not be interested`,
    })
    score -= 10
  } else {
    factors.push({
      factor: "No Responses",
      impact: "negative",
      description: "No responses to outreach attempts",
    })
    score -= 20
  }

  // Factor 2: Recency of interaction
  if (daysSinceLastInteraction < 7) {
    score += 15
    factors.push({
      factor: "Recent Interaction",
      impact: "positive",
      description: `Last interaction ${daysSinceLastInteraction} days ago`,
    })
  } else if (daysSinceLastInteraction < 30) {
    score += 5
    factors.push({
      factor: "Moderately Recent",
      impact: "neutral",
      description: `Last interaction ${daysSinceLastInteraction} days ago`,
    })
  } else if (daysSinceLastInteraction < 90) {
    factors.push({
      factor: "Stale Relationship",
      impact: "negative",
      description: `No interaction for ${daysSinceLastInteraction} days`,
    })
    score -= 10
  } else {
    factors.push({
      factor: "Cold Relationship",
      impact: "negative",
      description: `No interaction for ${daysSinceLastInteraction} days - relationship is cold`,
    })
    score -= 20
  }

  // Factor 3: Total interactions
  if (totalInteractions > 5) {
    score += 10
    factors.push({
      factor: "Multiple Touchpoints",
      impact: "positive",
      description: `${totalInteractions} total interactions show consistent engagement`,
    })
  } else if (totalInteractions > 2) {
    score += 5
    factors.push({
      factor: "Some Engagement",
      impact: "neutral",
      description: `${totalInteractions} interactions`,
    })
  } else if (totalInteractions === 0) {
    factors.push({
      factor: "No Engagement",
      impact: "negative",
      description: "No interactions yet - initiate outreach",
    })
    score -= 15
  }

  // Factor 4: Engagement quality (opened/clicked)
  const openedCount = engagements.filter((e) => e.openedAt !== null).length
  const openedRate = totalInteractions > 0 ? (openedCount / totalInteractions) * 100 : 0

  if (openedRate > 50) {
    score += 10
    factors.push({
      factor: "High Open Rate",
      impact: "positive",
      description: `${openedRate.toFixed(0)}% of messages were opened`,
    })
  }

  // Factor 5: Candidate status
  if (candidate.status === "CONTACTED") {
    score += 5
    factors.push({
      factor: "Active Status",
      impact: "positive",
      description: "Candidate is in CONTACTED status",
    })
  } else if (candidate.status === "ARCHIVED" || candidate.status === "REJECTED") {
    score -= 20
    factors.push({
      factor: "Inactive Status",
      impact: "negative",
      description: `Candidate status: ${candidate.status}`,
    })
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))

  // Determine level
  let level: "excellent" | "good" | "fair" | "poor" | "cold"
  if (score >= 80) level = "excellent"
  else if (score >= 60) level = "good"
  else if (score >= 40) level = "fair"
  else if (score >= 20) level = "poor"
  else level = "cold"

  return {
    score: Math.round(score),
    level,
    factors,
    lastInteraction: totalInteractions > 0 ? lastInteraction : undefined,
    daysSinceLastInteraction,
    totalInteractions,
    responseRate: Math.round(responseRate * 10) / 10,
  }
}

/**
 * Get next best action recommendations
 */
export async function getNextActions(candidateId: string): Promise<NextAction[]> {
  const health = await calculateRelationshipHealth(candidateId)
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      engagements: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  const actions: NextAction[] = []

  // If no interactions, recommend initial outreach
  if (health.totalInteractions === 0) {
    actions.push({
      action: "Send initial outreach email",
      type: "EMAIL",
      priority: "high",
      reason: "No interactions yet - initiate contact",
      suggestedDate: new Date(),
    })
    return actions
  }

  // If relationship is cold, recommend re-engagement
  if (health.daysSinceLastInteraction > 30) {
    actions.push({
      action: "Re-engage with follow-up message",
      type: "MESSAGE",
      priority: "high",
      reason: `No interaction for ${health.daysSinceLastInteraction} days - relationship is getting cold`,
      suggestedDate: new Date(),
    })
  }

  // If low response rate, try different channel
  if (health.responseRate < 25 && health.totalInteractions > 2) {
    const lastEngagement = candidate.engagements[0]
    if (lastEngagement && lastEngagement.type === "EMAIL") {
      actions.push({
        action: "Try LinkedIn message",
        type: "LINKEDIN",
        priority: "medium",
        reason: "Low email response rate - try different channel",
        suggestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      })
    }
  }

  // If candidate responded recently, follow up quickly
  const lastResponse = candidate.engagements.find((e) => e.respondedAt !== null)
  if (lastResponse && lastResponse.respondedAt) {
    const daysSinceResponse = Math.floor(
      (Date.now() - lastResponse.respondedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceResponse < 3) {
      actions.push({
        action: "Follow up on recent response",
        type: "EMAIL",
        priority: "high",
        reason: "Candidate responded recently - capitalize on momentum",
        suggestedDate: new Date(),
      })
    }
  }

  // If relationship is excellent, maintain with periodic check-ins
  if (health.level === "excellent") {
    actions.push({
      action: "Schedule monthly check-in",
      type: "EMAIL",
      priority: "low",
      reason: "Relationship is strong - maintain with periodic touchpoints",
      suggestedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    })
  }

  // If no actions suggested, recommend wait
  if (actions.length === 0) {
    actions.push({
      action: "Wait and monitor",
      type: "WAIT",
      priority: "low",
      reason: "Relationship is healthy - no immediate action needed",
    })
  }

  return actions
}

