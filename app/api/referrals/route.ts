import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import {
  submitReferral,
  getUserReferrals,
  getAllReferrals,
  getReferralLeaderboard,
  getUserReferralStats,
} from "@/lib/referrals/referral-system"
import { prisma } from "@/lib/prisma"

const submitReferralSchema = z.object({
  candidateName: z.string().min(1),
  candidateEmail: z.string().email().optional(),
  candidateLinkedInUrl: z.string().url().optional(),
  candidateId: z.string().optional(),
  jobId: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/referrals
 * Get referrals (user's own referrals or all if admin)
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "mine", "all", "leaderboard", "stats"

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const isAdmin = user?.role === "ADMIN"

    if (type === "leaderboard") {
      const limit = parseInt(searchParams.get("limit") || "10")
      const leaderboard = await getReferralLeaderboard(limit)
      return NextResponse.json({ leaderboard })
    }

    if (type === "stats") {
      const stats = await getUserReferralStats(session.user.id)
      return NextResponse.json({ stats })
    }

    if (type === "all" && isAdmin) {
      const referrals = await getAllReferrals()
      return NextResponse.json({ referrals })
    }

    // Default: get user's own referrals
    const referrals = await getUserReferrals(session.user.id)
    return NextResponse.json({ referrals })
  } catch (error: any) {
    console.error("[referrals] Error fetching referrals:", error)
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
  }
}

/**
 * POST /api/referrals
 * Submit a new referral
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validated = submitReferralSchema.parse(body)

    const referral = await submitReferral({
      referrerId: session.user.id,
      candidateName: validated.candidateName,
      candidateEmail: validated.candidateEmail,
      candidateLinkedInUrl: validated.candidateLinkedInUrl,
      candidateId: validated.candidateId,
      jobId: validated.jobId,
      notes: validated.notes,
    })

    return NextResponse.json({ referral }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[referrals] Error submitting referral:", error)
    return NextResponse.json({ error: "Failed to submit referral" }, { status: 500 })
  }
}

