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
    const skipExisting = searchParams.get("skipExisting") !== "false" // Default to true

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
    const fs = await import("fs")
    
    // Check if script exists
    if (!fs.existsSync(pythonScript)) {
      console.error(`[ashby-jobs] Script not found: ${pythonScript}`)
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
      await execAsync(`which ${pythonCmd}`, { timeout: 5000 })
    } catch (error) {
      console.error(`[ashby-jobs] Python command not found: ${pythonCmd}`)
      return NextResponse.json(
        { 
          error: "Python not found", 
          pythonCmd,
          suggestion: "Make sure Python 3 is installed and accessible"
        },
        { status: 500 }
      )
    }
    
    // Check SERPAPI_KEY
    if (!process.env.SERPAPI_KEY) {
      console.error("[ashby-jobs] SERPAPI_KEY not set")
      return NextResponse.json(
        { error: "SERPAPI_KEY environment variable is not set" },
        { status: 500 }
      )
    }
    
    // Build command with search query if provided
    let command = `${pythonCmd} ${pythonScript}`
    if (searchQuery) {
      // Escape the query for shell safety
      const escapedQuery = searchQuery.replace(/"/g, '\\"')
      command += ` "${escapedQuery}"`
    }
    
    console.log(`[ashby-jobs] Running scraper: ${command}`)
    console.log(`[ashby-jobs] Script path: ${pythonScript}`)
    console.log(`[ashby-jobs] Python command: ${pythonCmd}`)

    // Set timeout to 10 minutes (scraping can take a while)
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
            ASHBY_OUTPUT_FILE: outputFile,
            // Also set as env var as fallback
            ...(searchQuery ? { ASHBY_SEARCH_QUERY: searchQuery } : {}),
          },
        }
      )
      stdout = result.stdout || ""
      stderr = result.stderr || ""
    } catch (execError: any) {
      console.error("[ashby-jobs] Exec error:", execError)
      stdout = execError.stdout || ""
      stderr = execError.stderr || execError.message || ""
      
      // Return detailed error
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
      console.error("[ashby-jobs] Scraper stderr:", stderr)
    }
    if (stdout) {
      console.log("[ashby-jobs] Scraper stdout:", stdout.substring(0, 500))
    }

    // Read the output file
    try {
      const data = await readFile(outputPath, "utf-8")
      let jobs = JSON.parse(data)

      // Filter out jobs that already exist in database if skipExisting is true
      if (skipExisting && jobs.length > 0) {
        const { prisma } = await import("@/lib/prisma")
        
        // Get all active jobs with their companies
        const existingJobs = await prisma.job.findMany({
          where: { isActive: true },
          include: {
            company: {
              select: { name: true },
            },
          },
        })

        // Create a set of existing job identifiers for fast lookup
        const existingJobKeys = new Set<string>()
        for (const job of existingJobs) {
          // Key 1: title + company name (normalized)
          const key1 = `${job.title.trim().toLowerCase()}|${job.company.name.trim().toLowerCase()}`
          existingJobKeys.add(key1)
          
          // Key 2: URL in description (if present)
          if (job.description) {
            const urlMatch = job.description.match(/https?:\/\/[^\s]+/g)
            if (urlMatch) {
              for (const url of urlMatch) {
                try {
                  const urlObj = new URL(url)
                  const baseUrl = urlObj.href.split('?')[0]
                  existingJobKeys.add(`url:${baseUrl}`)
                } catch {
                  // Invalid URL, skip
                }
              }
            }
          }
        }

        // Filter out duplicates
        const originalCount = jobs.length
        jobs = jobs.filter((jobData: any) => {
          const companyName = (jobData.company || "Unknown Company").trim().toLowerCase()
          const jobTitle = (jobData.title || "Untitled Position").trim().toLowerCase()
          const key1 = `${jobTitle}|${companyName}`
          
          // Check by title + company
          if (existingJobKeys.has(key1)) {
            return false
          }
          
          // Check by URL
          if (jobData.url) {
            try {
              const urlObj = new URL(jobData.url)
              const baseUrl = urlObj.href.split('?')[0]
              if (existingJobKeys.has(`url:${baseUrl}`)) {
                return false
              }
            } catch {
              // Invalid URL, skip check
            }
          }
          
          return true
        })

        const filteredCount = originalCount - jobs.length
        if (filteredCount > 0) {
          console.log(`[ashby-jobs] Filtered out ${filteredCount} duplicate jobs`)
        }
      }

      return NextResponse.json({
        jobs,
        cached: false,
        count: jobs.length,
        ...(skipExisting && jobs.length > 0 ? { 
          note: "Duplicates filtered out automatically" 
        } : {}),
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

