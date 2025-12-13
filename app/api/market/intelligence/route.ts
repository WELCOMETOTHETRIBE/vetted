import { NextResponse } from "next/server"
import { getMarketIntelligence } from "@/lib/ai/market-intelligence"

export async function GET() {
  try {
    console.log("[market-intelligence] API: Fetching market intelligence")
    const intelligence = await getMarketIntelligence()

    return NextResponse.json(intelligence)
  } catch (error: any) {
    console.error("[market-intelligence] API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch market intelligence",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

