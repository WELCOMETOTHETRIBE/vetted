import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCandidateEngagements, updateEngagementStatus } from "@/lib/ai/engagement-workflows"
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
    const engagements = await getCandidateEngagements(id)

    return NextResponse.json({ engagements })
  } catch (error: any) {
    console.error("[candidate-engagements] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch engagements", details: error.message },
      { status: 500 }
    )
  }
}

const updateStatusSchema = z.object({
  engagementId: z.string(),
  status: z.enum([
    "PENDING",
    "SCHEDULED",
    "SENT",
    "DELIVERED",
    "OPENED",
    "CLICKED",
    "RESPONDED",
    "FAILED",
    "CANCELLED",
  ]),
  metadata: z.record(z.string(), z.any()).optional(),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = updateStatusSchema.parse(body)

    const engagement = await updateEngagementStatus(
      data.engagementId,
      data.status,
      data.metadata
    )

    return NextResponse.json({ engagement })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[candidate-engagements] PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update engagement", details: error.message },
      { status: 500 }
    )
  }
}

