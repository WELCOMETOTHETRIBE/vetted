import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findReEngagementCandidates } from "@/lib/ai/passive-candidate-tracking"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const maxDays = parseInt(searchParams.get("maxDays") || "90")

    const candidates = await findReEngagementCandidates(maxDays)

    return NextResponse.json({
      candidates,
      count: candidates.length,
    })
  } catch (error: any) {
    console.error("[re-engagement-list] GET error:", error)
    return NextResponse.json(
      { error: "Failed to find re-engagement candidates", details: error.message },
      { status: 500 }
    )
  }
}

