import { auth } from "@/lib/auth"
import { optimizeProfile } from "@/lib/ai/profile-optimization"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const optimization = await optimizeProfile(session.user.id)

    if (!optimization) {
      return NextResponse.json(
        { error: "Failed to optimize profile. AI service may not be configured." },
        { status: 500 }
      )
    }

    return NextResponse.json(optimization)
  } catch (error: any) {
    console.error("Error in profile optimization:", error)
    return NextResponse.json(
      { error: error.message || "Failed to optimize profile" },
      { status: 500 }
    )
  }
}

