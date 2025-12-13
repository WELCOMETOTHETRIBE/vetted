import { NextResponse } from "next/server"

/**
 * Proxy endpoint for Tech Trends API.
 * 
 * This endpoint can either:
 * 1. Proxy to the Python FastAPI backend (if BACKEND_API_URL is set)
 * 2. Return a mock response for development/testing
 * 
 * Set BACKEND_API_URL environment variable to point to your FastAPI service,
 * e.g., BACKEND_API_URL=http://localhost:8000
 */
export async function GET(req: Request) {
  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000"
    
    // If backend URL is explicitly set, proxy to it
    if (process.env.BACKEND_API_URL) {
      try {
        const response = await fetch(`${backendUrl}/api/trends`, {
          headers: {
            "Content-Type": "application/json",
          },
          // Add timeout
          signal: AbortSignal.timeout(30000), // 30 seconds
        })
        
        if (!response.ok) {
          throw new Error(`Backend API returned ${response.status}`)
        }
        
        const data = await response.json()
        return NextResponse.json(data)
      } catch (error: any) {
        console.error("Error proxying to backend API:", error)
        // Fall through to return empty response
      }
    }
    
    // Return empty response if backend is not available
    // Frontend can handle empty state gracefully
    return NextResponse.json({
      items: [],
      last_updated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error in trends API route:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch trends",
        items: [],
        last_updated: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

