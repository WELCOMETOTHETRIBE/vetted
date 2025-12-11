import { auth } from "@/lib/auth"
import { generateCoverLetter } from "@/lib/ai/cover-letter"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: jobId } = await params
    const body = await req.json()
    const { tone, length, highlight } = body

    const coverLetter = await generateCoverLetter(session.user.id, jobId, {
      tone,
      length,
      highlight,
    })

    if (!coverLetter) {
      return NextResponse.json(
        { error: "Failed to generate cover letter. AI service may not be configured." },
        { status: 500 }
      )
    }

    return NextResponse.json({ coverLetter })
  } catch (error: any) {
    console.error("Error in cover letter generation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate cover letter" },
      { status: 500 }
    )
  }
}

