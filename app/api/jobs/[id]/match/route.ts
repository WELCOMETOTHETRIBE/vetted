import { auth } from "@/lib/auth"
import { matchUserToJob } from "@/lib/ai/user-job-matching"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: jobId } = await params

    const match = await matchUserToJob(session.user.id, jobId)

    if (!match) {
      return NextResponse.json(
        { error: "Failed to generate match. AI service may not be configured." },
        { status: 500 }
      )
    }

    return NextResponse.json(match)
  } catch (error: any) {
    console.error("Error in job matching:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate match" },
      { status: 500 }
    )
  }
}

