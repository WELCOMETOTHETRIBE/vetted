import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { readFileSync } from "fs"
import { join } from "path"
import vm from "vm"

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

        // Process HTML using the extension's profileProcessor logic
        let candidateData: any = {
          "Linkedin URL": profile.linkedin_url,
        }

        // If profile has HTML, extract structured data using the extension's logic
        if (profile.html && profile.raw_text) {
          try {
            // Step 1: Extract structured data from HTML (like contentScript.js does)
            const { buildProfileDocumentFromHTML } = await import("@/lib/profile-processor-server")
            const profileDocument = buildProfileDocumentFromHTML(profile.html, profile.linkedin_url)
            
            // Step 2: Process using profileProcessor.js (like the extension does)
            // Load the JavaScript file dynamically using vm (like Prisma client loading)
            const profileProcessorPath = join(process.cwd(), "lib", "profile-processor.js")
            
            // Try require first (works in dev), fallback to vm evaluation (works in production)
            let profileProcessor: any
            try {
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              profileProcessor = require(profileProcessorPath)
            } catch (requireError: any) {
              // If require fails, read and evaluate the file
              try {
                const profileProcessorCode = readFileSync(profileProcessorPath, "utf-8")
                const moduleExports: any = {}
                const moduleObj = { exports: moduleExports }
                const requireFunc = (id: string) => {
                  if (id.startsWith("./") || id.startsWith("../")) {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    return require(join(profileProcessorPath, "..", id))
                  }
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  return require(id)
                }
                const context = {
                  exports: moduleExports,
                  module: moduleObj,
                  require: requireFunc,
                  __filename: profileProcessorPath,
                  __dirname: join(profileProcessorPath, ".."),
                  console: console,
                  Buffer: Buffer,
                  process: process,
                  global: global,
                  setTimeout: setTimeout,
                  setInterval: setInterval,
                  clearTimeout: clearTimeout,
                  clearInterval: clearInterval,
                }
                const script = new vm.Script(profileProcessorCode)
                script.runInNewContext(context)
                profileProcessor = context.module.exports || context.exports
              } catch (vmError: any) {
                throw new Error(`Failed to load profileProcessor: ${requireError.message}, ${vmError.message}`)
              }
            }
            
            // Process the profile document
            const processed = profileProcessor.processProfileDocument(profileDocument)
            
            if (processed && processed["Full Name"]) {
              // Use the processed data directly - it's already in the correct format
              candidateData = processed
              console.log(`Successfully processed profile ${profile.linkedin_url} using profileProcessor`)
            } else {
              // Fallback: include raw data for AI enrichment
              candidateData["Raw Data"] = JSON.stringify(profileDocument)
              console.log(`Profile ${profile.linkedin_url} processed but missing fields, using AI enrichment fallback`)
            }
          } catch (processError: any) {
            console.warn(`Error processing profile ${profile.linkedin_url}:`, processError)
            // Fallback: create structure for AI enrichment
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

