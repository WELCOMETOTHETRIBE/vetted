import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { readFile, stat } from "fs/promises"
import { join } from "path"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const execAsync = promisify(exec)

/**
 * GET /api/ashby-jobs
 * 
 * Scrapes Ashby job postings and returns the results.
 * Requires authentication.
 * 
 * Query parameters:
 * - force: if "true", forces a new scrape even if cached data exists
 * - query: search query term (e.g., "software engineer", "machine learning")
 * 
 * Returns: JSON array of job postings
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

    const outputFile = process.env.ASHBY_OUTPUT_FILE || "ashby_jobs.json"
    const outputPath = join(process.cwd(), outputFile)

    // Check if cached file exists and force is not set
    if (!force) {
      try {
        const cachedData = await readFile(outputPath, "utf-8")
        const jobs = JSON.parse(cachedData)
        
        // Check if file is recent (less than 24 hours old)
        const stats = await stat(outputPath)
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60)
        
        if (ageHours < 24 && jobs.length > 0) {
          return NextResponse.json({
            jobs,
            cached: true,
            age_hours: Math.round(ageHours * 10) / 10,
          })
        }
      } catch (error) {
        // File doesn't exist or is invalid, proceed with scraping
        console.log("[ashby-jobs] No valid cache found, scraping...")
      }
    }

    // Run the Python scraper
    const pythonScript = join(process.cwd(), "scripts", "ashby", "ashby_scraper.py")
    // Use virtual environment Python if available, otherwise fallback to system python3
    const fs = await import("fs")
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
    
    // Build command with search query if provided
    let command = `${pythonCmd} ${pythonScript}`
    if (searchQuery) {
      // Escape the query for shell safety
      const escapedQuery = searchQuery.replace(/"/g, '\\"')
      command += ` "${escapedQuery}"`
    }
    
    console.log(`[ashby-jobs] Running scraper: ${command}`)

    // Set timeout to 10 minutes (scraping can take a while)
    const { stdout, stderr } = await execAsync(
      command,
      {
        timeout: 600000, // 10 minutes
        env: {
          ...process.env,
          SERPAPI_KEY: process.env.SERPAPI_KEY,
          ASHBY_OUTPUT_FILE: outputFile,
          // Also set as env var as fallback
          ...(searchQuery ? { ASHBY_SEARCH_QUERY: searchQuery } : {}),
        },
      }
    )

    if (stderr) {
      console.error("[ashby-jobs] Scraper stderr:", stderr)
    }

    // Read the output file
    try {
      const data = await readFile(outputPath, "utf-8")
      const jobs = JSON.parse(data)

      return NextResponse.json({
        jobs,
        cached: false,
        count: jobs.length,
      })
    } catch (error) {
      console.error("[ashby-jobs] Error reading output file:", error)
      return NextResponse.json(
        {
          error: "Scraper completed but output file could not be read",
          stdout: stdout.substring(0, 500), // First 500 chars of stdout
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[ashby-jobs] Error:", error)

    // Handle timeout
    if (error.code === "ETIMEDOUT" || error.signal === "SIGTERM") {
      return NextResponse.json(
        { error: "Scraping operation timed out. This can take several minutes." },
        { status: 504 }
      )
    }

    // Handle missing SERPAPI_KEY
    if (error.message?.includes("SERPAPI_KEY")) {
      return NextResponse.json(
        { error: "SERPAPI_KEY environment variable is not set" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to scrape Ashby jobs",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

