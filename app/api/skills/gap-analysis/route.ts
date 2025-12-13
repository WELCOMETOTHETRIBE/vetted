import { NextResponse } from "next/server"
import { getSkillsGapAnalysis } from "@/lib/ai/skills-gap-analysis"

export async function GET() {
  try {
    console.log("[skills-gap-analysis] API: Fetching skills gap analysis")
    const analysis = await getSkillsGapAnalysis()

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error("[skills-gap-analysis] API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch skills gap analysis",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

