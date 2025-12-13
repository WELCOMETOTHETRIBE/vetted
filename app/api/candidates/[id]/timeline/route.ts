import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getCandidateTimeline,
  calculateRelationshipHealth,
  getNextActions,
} from "@/lib/crm/interaction-tracking"

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

    const [timeline, health, nextActions] = await Promise.all([
      getCandidateTimeline(id),
      calculateRelationshipHealth(id),
      getNextActions(id),
    ])

    return NextResponse.json({
      timeline,
      health,
      nextActions,
    })
  } catch (error: any) {
    console.error("[candidate-timeline] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch timeline", details: error.message },
      { status: 500 }
    )
  }
}

