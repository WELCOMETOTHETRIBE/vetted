import { auth } from "@/lib/auth"
import { generateMessageSuggestions } from "@/lib/ai/message-suggestions"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { threadId, tone } = body

    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    const suggestions = await generateMessageSuggestions(
      session.user.id,
      threadId,
      tone || "friendly"
    )

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error("Error generating message suggestions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    )
  }
}

