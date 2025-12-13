import { prisma } from "@/lib/prisma"

export interface ReferralData {
  referrerId: string
  candidateName: string
  candidateEmail?: string
  candidateLinkedInUrl?: string
  candidateId?: string
  jobId?: string
  notes?: string
}

export interface ReferralStats {
  totalReferrals: number
  pendingReferrals: number
  contactedReferrals: number
  interviewingReferrals: number
  hiredReferrals: number
  rejectedReferrals: number
  hireRate: number // percentage
  totalRewards: number
  pendingRewards: number
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  userImage: string | null
  totalReferrals: number
  hiredReferrals: number
  hireRate: number
  totalRewards: number
}

/**
 * Submit a new referral
 */
export async function submitReferral(data: ReferralData) {
  // Check if candidate already exists
  let candidateId = data.candidateId
  if (!candidateId && data.candidateLinkedInUrl) {
    const existingCandidate = await prisma.candidate.findUnique({
      where: { linkedinUrl: data.candidateLinkedInUrl },
    })
    if (existingCandidate) {
      candidateId = existingCandidate.id
    }
  }

  const referral = await prisma.referral.create({
    data: {
      referrerId: data.referrerId,
      candidateId,
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      candidateLinkedInUrl: data.candidateLinkedInUrl,
      jobId: data.jobId,
      notes: data.notes,
      status: "PENDING",
      rewardStatus: "PENDING",
    },
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      candidate: {
        select: {
          id: true,
          fullName: true,
          linkedinUrl: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  return referral
}

/**
 * Update referral status
 */
export async function updateReferralStatus(
  referralId: string,
  status: "PENDING" | "CONTACTED" | "INTERVIEWING" | "HIRED" | "REJECTED" | "WITHDRAWN",
  updateData?: {
    contactedAt?: Date
    interviewedAt?: Date
    hiredAt?: Date
    rejectedAt?: Date
  }
) {
  const updateFields: any = {
    status,
    updatedAt: new Date(),
  }

  if (status === "CONTACTED" && updateData?.contactedAt) {
    updateFields.contactedAt = updateData.contactedAt
  } else if (status === "CONTACTED") {
    updateFields.contactedAt = new Date()
  }

  if (status === "INTERVIEWING" && updateData?.interviewedAt) {
    updateFields.interviewedAt = updateData.interviewedAt
  } else if (status === "INTERVIEWING") {
    updateFields.interviewedAt = new Date()
  }

  if (status === "HIRED" && updateData?.hiredAt) {
    updateFields.hiredAt = updateData.hiredAt
    updateFields.rewardStatus = "APPROVED" // Auto-approve reward when hired
  } else if (status === "HIRED") {
    updateFields.hiredAt = new Date()
    updateFields.rewardStatus = "APPROVED"
  }

  if (status === "REJECTED" && updateData?.rejectedAt) {
    updateFields.rejectedAt = updateData.rejectedAt
  } else if (status === "REJECTED") {
    updateFields.rejectedAt = new Date()
  }

  const referral = await prisma.referral.update({
    where: { id: referralId },
    data: updateFields,
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      candidate: {
        select: {
          id: true,
          fullName: true,
          linkedinUrl: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  return referral
}

/**
 * Get referral statistics for a user
 */
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
  })

  const totalReferrals = referrals.length
  const pendingReferrals = referrals.filter((r: (typeof referrals)[number]) => r.status === "PENDING").length
  const contactedReferrals = referrals.filter((r: (typeof referrals)[number]) => r.status === "CONTACTED").length
  const interviewingReferrals = referrals.filter((r: (typeof referrals)[number]) => r.status === "INTERVIEWING").length
  const hiredReferrals = referrals.filter((r: (typeof referrals)[number]) => r.status === "HIRED").length
  const rejectedReferrals = referrals.filter((r: (typeof referrals)[number]) => r.status === "REJECTED").length

  const hireRate = totalReferrals > 0 ? (hiredReferrals / totalReferrals) * 100 : 0

  const totalRewards = referrals
    .filter((r: (typeof referrals)[number]) => r.rewardStatus === "PAID")
    .reduce((sum: number, r: (typeof referrals)[number]) => sum + (r.rewardAmount || 0), 0)

  const pendingRewards = referrals
    .filter((r: (typeof referrals)[number]) => r.rewardStatus === "APPROVED" || r.rewardStatus === "PENDING")
    .reduce((sum: number, r: (typeof referrals)[number]) => sum + (r.rewardAmount || 0), 0)

  return {
    totalReferrals,
    pendingReferrals,
    contactedReferrals,
    interviewingReferrals,
    hiredReferrals,
    rejectedReferrals,
    hireRate: Math.round(hireRate * 10) / 10,
    totalRewards,
    pendingRewards,
  }
}

/**
 * Get referral leaderboard
 */
export async function getReferralLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const referrals = await prisma.referral.findMany({
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  // Group by user and calculate stats
  const userStats = new Map<string, LeaderboardEntry>()

  for (const referral of referrals) {
    const userId = referral.referrerId
    if (!userStats.has(userId)) {
      userStats.set(userId, {
        userId,
        userName: referral.referrer.name || "Unknown",
        userImage: referral.referrer.image,
        totalReferrals: 0,
        hiredReferrals: 0,
        hireRate: 0,
        totalRewards: 0,
      })
    }

    const stats = userStats.get(userId)!
    stats.totalReferrals++
    if (referral.status === "HIRED") {
      stats.hiredReferrals++
      stats.totalRewards += referral.rewardAmount || 0
    }
  }

  // Calculate hire rates
  for (const stats of userStats.values()) {
    stats.hireRate = stats.totalReferrals > 0 ? (stats.hiredReferrals / stats.totalReferrals) * 100 : 0
  }

  // Sort by hired referrals, then by total referrals
  const leaderboard = Array.from(userStats.values()).sort((a, b) => {
    if (b.hiredReferrals !== a.hiredReferrals) {
      return b.hiredReferrals - a.hiredReferrals
    }
    return b.totalReferrals - a.totalReferrals
  })

  return leaderboard.slice(0, limit)
}

/**
 * Get all referrals for a user
 */
export async function getUserReferrals(userId: string) {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          linkedinUrl: true,
          currentCompany: true,
          jobTitle: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  })

  return referrals
}

/**
 * Get all referrals (admin view)
 */
export async function getAllReferrals() {
  const referrals = await prisma.referral.findMany({
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
      candidate: {
        select: {
          id: true,
          fullName: true,
          linkedinUrl: true,
          currentCompany: true,
          jobTitle: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  })

  return referrals
}

/**
 * Update reward status
 */
export async function updateRewardStatus(
  referralId: string,
  rewardStatus: "PENDING" | "APPROVED" | "PAID" | "DENIED",
  rewardAmount?: number,
  rewardNotes?: string
) {
  const referral = await prisma.referral.update({
    where: { id: referralId },
    data: {
      rewardStatus,
      rewardAmount,
      rewardNotes,
      updatedAt: new Date(),
    },
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  return referral
}

