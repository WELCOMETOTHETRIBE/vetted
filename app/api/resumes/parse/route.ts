import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseResumeText } from "@/lib/ai/resume-parser"

/**
 * Parse resume text and extract structured data
 * POST /api/resumes/parse
 * Body: { text: string }
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { text } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      )
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Resume text too long (max 10000 characters)" },
        { status: 400 }
      )
    }

    const parsed = await parseResumeText(text)

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse resume" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    })
  } catch (error: any) {
    console.error("Resume parsing error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

