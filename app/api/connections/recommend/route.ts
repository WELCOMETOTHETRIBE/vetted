import { auth } from "@/lib/auth"
import { getConnectionRecommendations } from "@/lib/ai/connection-recommendations"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const recommendations = await getConnectionRecommendations(session.user.id, limit)

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    console.error("Error getting connection recommendations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get recommendations" },
      { status: 500 }
    )
  }
}

