import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

/**
 * POST /api/linkedin-profiles/import
 * 
 * Imports LinkedIn profiles from the scraped data file.
 * Processes HTML through profileProcessor.js logic and imports as candidates.
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const outputFile = process.env.LINKEDIN_OUTPUT_FILE || "linkedin_profiles.json"
    let outputPath = join(process.cwd(), outputFile)
    const tmpPath = join("/tmp", outputFile)

    // Read the scraped profiles file
    let data: string
    try {
      data = await readFile(outputPath, "utf-8")
    } catch (error: any) {
      if (error.code === "ENOENT") {
        try {
          data = await readFile(tmpPath, "utf-8")
          outputPath = tmpPath
        } catch (tmpError) {
          return NextResponse.json(
            { error: "No scraped profiles found. Please run the search first." },
            { status: 404 }
          )
        }
      } else {
        throw error
      }
    }

    const profiles = JSON.parse(data)
    
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: "No profiles found in scraped data" },
        { status: 400 }
      )
    }

    // Import profiles by sending them to the candidate upload endpoint
    // The upload endpoint will use AI enrichment to extract data from HTML/raw_text
    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as any[],
    }

    // Process each profile
    for (const profile of profiles) {
      try {
        if (!profile.linkedin_url) {
          results.errors++
          results.errorDetails.push({ profile, error: "Missing LinkedIn URL" })
          continue
        }

        // Check if candidate already exists
        const existing = await prisma.candidate.findUnique({
          where: { linkedinUrl: profile.linkedin_url },
        })

        if (existing) {
          results.skipped++
          continue
        }

        // Create candidate data structure
        // The upload endpoint will use AI enrichment if raw HTML/text is provided
        let candidateData: any = {
          "Linkedin URL": profile.linkedin_url,
        }

        // If profile has HTML and raw_text, include it for AI enrichment
        if (profile.html && profile.raw_text) {
          // Create a structure similar to what the extension sends
          // The upload endpoint will extract this and use AI enrichment
          candidateData["Raw Data"] = JSON.stringify({
            extraction_metadata: {
              source_url: profile.linkedin_url,
              extracted_at: profile.scraped_at || new Date().toISOString(),
            },
            raw_html: profile.html,
            raw_text: profile.raw_text,
            personal_info: {
              profile_url: profile.linkedin_url,
            },
          })
        }

        // Send to candidate upload endpoint (internal call)
        // We need to construct the full URL properly
        const baseUrl = process.env.NEXTAUTH_URL || 
          (req.headers.get("x-forwarded-proto") 
            ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get("host")}`
            : `http://${req.headers.get("host") || "localhost:3000"}`)
        
        const uploadUrl = `${baseUrl}/api/candidates/upload`
        
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": req.headers.get("Cookie") || "",
          },
          body: JSON.stringify(candidateData),
        })

        if (uploadResponse.ok) {
          results.created++
        } else {
          const errorData = await uploadResponse.json().catch(() => ({ error: "Upload failed" }))
          results.errors++
          results.errorDetails.push({
            profile: profile.linkedin_url,
            error: errorData.error || "Upload failed",
          })
        }

        results.processed++
      } catch (error: any) {
        results.errors++
        results.errorDetails.push({
          profile: profile.linkedin_url || "Unknown",
          error: error.message || String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.processed} profiles: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`,
    })
  } catch (error: any) {
    console.error("[linkedin-profiles/import] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to import LinkedIn profiles",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

