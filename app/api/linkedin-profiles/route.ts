import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { readFile, stat } from "fs/promises"
import { join } from "path"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const execAsync = promisify(exec)

/**
 * GET /api/linkedin-profiles
 * 
 * Searches for LinkedIn profiles using SerpAPI and returns profile URLs.
 * Requires authentication.
 * 
 * Query parameters:
 * - force: if "true", forces a new search even if cached data exists
 * - query: search query term (e.g., "software engineer", "machine learning")
 * - location: location filter (e.g., "San Francisco", "New York")
 * - company: company filter (e.g., "Google", "Microsoft")
 * - title: job title filter (e.g., "Senior Engineer", "Product Manager")
 * 
 * Returns: JSON array of LinkedIn profile URLs
 */
export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const force = searchParams.get("force") === "true"
    const searchQuery = searchParams.get("query") || null
    const location = searchParams.get("location") || null
    const company = searchParams.get("company") || null
    const title = searchParams.get("title") || null
    const scrape = searchParams.get("scrape") === "true" // Whether to scrape HTML

    const outputFile = process.env.LINKEDIN_OUTPUT_FILE || "linkedin_profiles.json"
    let outputPath = join(process.cwd(), outputFile)
    const tmpPath = join("/tmp", outputFile)

    // Check if cached file exists and force is not set
    if (!force) {
      try {
        const cachedData = await readFile(outputPath, "utf-8")
        const profiles = JSON.parse(cachedData)
        
        // Check if file is recent (less than 24 hours old)
        const stats = await stat(outputPath)
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60)
        
        if (ageHours < 24 && profiles.length > 0) {
          // Save cached URLs to database
          let savedCount = 0
          let skippedCount = 0
          
          for (const profileUrl of profiles) {
            if (typeof profileUrl === 'string' && profileUrl.includes('linkedin.com/in/')) {
              try {
                await prisma.linkedInProfileUrl.upsert({
                  where: { url: profileUrl },
                  update: {
                    searchQuery: searchQuery || undefined,
                    location: location || undefined,
                    company: company || undefined,
                    title: title || undefined,
                    addedById: session.user.id,
                  },
                  create: {
                    url: profileUrl,
                    searchQuery: searchQuery || undefined,
                    location: location || undefined,
                    company: company || undefined,
                    title: title || undefined,
                    addedById: session.user.id,
                  },
                })
                savedCount++
              } catch (error: any) {
                if (error.code === 'P2002') {
                  skippedCount++
                } else {
                  console.error(`[linkedin-profiles] Error saving cached URL ${profileUrl}:`, error)
                }
              }
            }
          }

          return NextResponse.json({
            success: true,
            saved: savedCount,
            skipped: skippedCount,
            total: profiles.length,
            cached: true,
            age_hours: Math.round(ageHours * 10) / 10,
            message: `Saved ${savedCount} LinkedIn profile URL${savedCount !== 1 ? 's' : ''} to database${skippedCount > 0 ? ` (${skippedCount} already existed)` : ''} (from cache)`,
          })
        }
      } catch (error) {
        // File doesn't exist or is invalid, proceed with searching
        console.log("[linkedin-profiles] No valid cache found, searching...")
      }
    }

    // Run the Python scraper
    const pythonScript = join(process.cwd(), "scripts", "linkedin", "linkedin_profile_scraper.py")
    const fs = await import("fs")
    
    // Check if script exists
    if (!fs.existsSync(pythonScript)) {
      console.error(`[linkedin-profiles] Script not found: ${pythonScript}`)
      return NextResponse.json(
        { error: "Scraper script not found", path: pythonScript },
        { status: 500 }
      )
    }
    
    // Use virtual environment Python if available, otherwise fallback to system python3
    let pythonCmd = process.env.PYTHON_COMMAND
    if (!pythonCmd) {
      if (process.env.VIRTUAL_ENV) {
        pythonCmd = `${process.env.VIRTUAL_ENV}/bin/python3`
      } else if (process.platform !== 'win32' && fs.existsSync('/opt/venv/bin/python3')) {
        pythonCmd = "/opt/venv/bin/python3"
      } else {
        pythonCmd = "python3"
      }
    }
    
    // Verify Python command exists
    try {
      await execAsync(`${pythonCmd} --version`, { timeout: 5000 })
    } catch (error) {
      console.error(`[linkedin-profiles] Python command not found: ${pythonCmd}`, error)
      const alternatives = ["python3", "python", "/opt/venv/bin/python3", "/usr/bin/python3"]
      let workingPython = null
      for (const alt of alternatives) {
        try {
          await execAsync(`${alt} --version`, { timeout: 5000 })
          workingPython = alt
          break
        } catch {
          // Continue trying
        }
      }
      
      if (workingPython) {
        pythonCmd = workingPython
        console.log(`[linkedin-profiles] Using alternative Python: ${pythonCmd}`)
      } else {
        return NextResponse.json(
          { 
            error: "Python not found", 
            pythonCmd,
            tried: alternatives,
            suggestion: "Make sure Python 3 is installed and accessible"
          },
          { status: 500 }
        )
      }
    }
    
    // Check SERPAPI_KEY
    if (!process.env.SERPAPI_KEY) {
      console.error("[linkedin-profiles] SERPAPI_KEY not set")
      return NextResponse.json(
        { error: "SERPAPI_KEY environment variable is not set" },
        { status: 500 }
      )
    }
    
    // Build command with search query and filters
    let command = `${pythonCmd} ${pythonScript}`
    if (searchQuery) {
      const escapedQuery = searchQuery.replace(/"/g, '\\"')
      command += ` "${escapedQuery}"`
    }
    if (location) {
      const escapedLocation = location.replace(/"/g, '\\"')
      command += ` --location "${escapedLocation}"`
    }
    if (company) {
      const escapedCompany = company.replace(/"/g, '\\"')
      command += ` --company "${escapedCompany}"`
    }
    if (title) {
      const escapedTitle = title.replace(/"/g, '\\"')
      command += ` --title "${escapedTitle}"`
    }
    if (scrape) {
      command += ` --scrape`
    }
    
    console.log(`[linkedin-profiles] Running scraper: ${command}`)
    console.log(`[linkedin-profiles] Scrape HTML: ${scrape}`)
    console.log(`[linkedin-profiles] Script path: ${pythonScript}`)
    console.log(`[linkedin-profiles] Python command: ${pythonCmd}`)

    // Set timeout to 10 minutes
    let stdout = ""
    let stderr = ""
    try {
      const result = await execAsync(
        command,
        {
          timeout: 600000, // 10 minutes
          env: {
            ...process.env,
            SERPAPI_KEY: process.env.SERPAPI_KEY,
            LINKEDIN_OUTPUT_FILE: outputFile,
            SCRAPE_PROFILES: scrape ? "true" : "false",
            ...(searchQuery ? { LINKEDIN_SEARCH_QUERY: searchQuery } : {}),
            ...(location ? { LINKEDIN_LOCATION: location } : {}),
            ...(company ? { LINKEDIN_COMPANY: company } : {}),
            ...(title ? { LINKEDIN_TITLE: title } : {}),
          },
        }
      )
      stdout = result.stdout || ""
      stderr = result.stderr || ""
    } catch (execError: any) {
      console.error("[linkedin-profiles] Exec error:", execError)
      stdout = execError.stdout || ""
      stderr = execError.stderr || execError.message || ""
      
      return NextResponse.json(
        {
          error: "Failed to execute scraper",
          message: execError.message || String(execError),
          stdout: stdout.substring(0, 1000),
          stderr: stderr.substring(0, 1000),
          command,
        },
        { status: 500 }
      )
    }

    if (stderr) {
      console.error("[linkedin-profiles] Scraper stderr:", stderr)
    }
    if (stdout) {
      console.log("[linkedin-profiles] Scraper stdout:", stdout.substring(0, 500))
    }

    // Read the output file (try project root first, then /tmp)
    let data: string
    try {
      data = await readFile(outputPath, "utf-8")
    } catch (error: any) {
      if (error.code === "ENOENT") {
        try {
          data = await readFile(tmpPath, "utf-8")
          outputPath = tmpPath
          console.log(`[linkedin-profiles] Found output file in /tmp: ${tmpPath}`)
        } catch (tmpError) {
          throw error
        }
      } else {
        throw error
      }
    }
    
    try {
      const profiles = JSON.parse(data)

      // Save URLs to database instead of returning them
      let savedCount = 0
      let skippedCount = 0
      
      for (const profileUrl of profiles) {
        if (typeof profileUrl === 'string' && profileUrl.includes('linkedin.com/in/')) {
          try {
            await prisma.linkedInProfileUrl.upsert({
              where: { url: profileUrl },
              update: {
                searchQuery: searchQuery || undefined,
                location: location || undefined,
                company: company || undefined,
                title: title || undefined,
                addedById: session.user.id,
              },
              create: {
                url: profileUrl,
                searchQuery: searchQuery || undefined,
                location: location || undefined,
                company: company || undefined,
                title: title || undefined,
                addedById: session.user.id,
              },
            })
            savedCount++
          } catch (error: any) {
            if (error.code === 'P2002') {
              // Unique constraint violation - URL already exists
              skippedCount++
            } else {
              console.error(`[linkedin-profiles] Error saving URL ${profileUrl}:`, error)
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        saved: savedCount,
        skipped: skippedCount,
        total: profiles.length,
        message: `Saved ${savedCount} LinkedIn profile URL${savedCount !== 1 ? 's' : ''} to database${skippedCount > 0 ? ` (${skippedCount} already existed)` : ''}`,
      })
    } catch (error) {
      console.error("[linkedin-profiles] Error reading output file:", error)
      return NextResponse.json(
        {
          error: "Scraper completed but output file could not be read",
          stdout: stdout.substring(0, 500),
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[linkedin-profiles] Error:", error)

    if (error.code === "ETIMEDOUT" || error.signal === "SIGTERM") {
      return NextResponse.json(
        { error: "Search operation timed out. This can take several minutes." },
        { status: 504 }
      )
    }

    if (error.message?.includes("SERPAPI_KEY")) {
      return NextResponse.json(
        { error: "SERPAPI_KEY environment variable is not set" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to search LinkedIn profiles",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

