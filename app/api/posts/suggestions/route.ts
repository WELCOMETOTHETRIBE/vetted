import { auth } from "@/lib/auth"
import { generateContentSuggestions } from "@/lib/ai/content-suggestions"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const tone = (searchParams.get("tone") || "professional") as "professional" | "casual" | "thoughtful" | "enthusiastic"

    const suggestions = await generateContentSuggestions(session.user.id, tone)

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error("Error generating content suggestions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    )
  }
}

