import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  detectCareerMilestones,
  triggerReEngagement,
  findMatchingJobs,
} from "@/lib/ai/passive-candidate-tracking"
import { z } from "zod"

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

    const [milestones, matchingJobs] = await Promise.all([
      detectCareerMilestones(id),
      findMatchingJobs(id),
    ])

    return NextResponse.json({
      milestones,
      matchingJobs,
    })
  } catch (error: any) {
    console.error("[candidate-re-engage] GET error:", error)
    return NextResponse.json(
      { error: "Failed to analyze candidate", details: error.message },
      { status: 500 }
    )
  }
}

const triggerSchema = z.object({
  workflowId: z.string().optional(),
})

export async function POST(
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
    const data = triggerSchema.parse(body)

    await triggerReEngagement(id, data.workflowId)

    return NextResponse.json({
      success: true,
      message: "Re-engagement workflow triggered successfully",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[candidate-re-engage] POST error:", error)
    return NextResponse.json(
      { error: "Failed to trigger re-engagement", details: error.message },
      { status: 500 }
    )
  }
}

