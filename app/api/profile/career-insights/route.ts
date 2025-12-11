import { auth } from "@/lib/auth"
import { generateCareerInsights } from "@/lib/ai/career-insights"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const insights = await generateCareerInsights(session.user.id)

    if (!insights) {
      return NextResponse.json(
        { error: "Failed to generate insights. AI service may not be configured." },
        { status: 500 }
      )
    }

    return NextResponse.json(insights)
  } catch (error: any) {
    console.error("Error generating career insights:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate insights" },
      { status: 500 }
    )
  }
}

