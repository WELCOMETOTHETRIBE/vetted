import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import {
  updateReferralStatus,
  updateRewardStatus,
} from "@/lib/referrals/referral-system"
import { prisma } from "@/lib/prisma"

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "CONTACTED", "INTERVIEWING", "HIRED", "REJECTED", "WITHDRAWN"]),
  contactedAt: z.string().optional(),
  interviewedAt: z.string().optional(),
  hiredAt: z.string().optional(),
  rejectedAt: z.string().optional(),
})

const updateRewardSchema = z.object({
  rewardStatus: z.enum(["PENDING", "APPROVED", "PAID", "DENIED"]),
  rewardAmount: z.number().optional(),
  rewardNotes: z.string().optional(),
})

/**
 * GET /api/referrals/[id]
 * Get a specific referral
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const referral = await prisma.referral.findUnique({
      where: { id },
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
    })

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    // Check if user has permission (own referral or admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const isAdmin = user?.role === "ADMIN"
    const isOwner = referral.referrerId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ referral })
  } catch (error: any) {
    console.error("[referrals] Error fetching referral:", error)
    return NextResponse.json({ error: "Failed to fetch referral" }, { status: 500 })
  }
}

/**
 * PATCH /api/referrals/[id]
 * Update referral status or reward
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Check if user is admin (only admins can update referrals)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    // Check if updating status or reward
    if (body.status) {
      const validated = updateStatusSchema.parse(body)
      const updateData: any = {}
      if (validated.contactedAt) updateData.contactedAt = new Date(validated.contactedAt)
      if (validated.interviewedAt) updateData.interviewedAt = new Date(validated.interviewedAt)
      if (validated.hiredAt) updateData.hiredAt = new Date(validated.hiredAt)
      if (validated.rejectedAt) updateData.rejectedAt = new Date(validated.rejectedAt)

      const referral = await updateReferralStatus(id, validated.status, updateData)
      return NextResponse.json({ referral })
    }

    if (body.rewardStatus) {
      const validated = updateRewardSchema.parse(body)
      const referral = await updateRewardStatus(
        id,
        validated.rewardStatus,
        validated.rewardAmount,
        validated.rewardNotes
      )
      return NextResponse.json({ referral })
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[referrals] Error updating referral:", error)
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 })
  }
}

