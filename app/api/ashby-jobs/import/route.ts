import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/ashby-jobs/import
 * 
 * Imports scraped Ashby jobs from the JSON file into the database.
 * Requires admin authentication.
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

    // Read the scraped jobs file
    const outputFile = process.env.ASHBY_OUTPUT_FILE || "ashby_jobs.json"
    const outputPath = join(process.cwd(), outputFile)

    let scrapedJobs: any[]
    try {
      const data = await readFile(outputPath, "utf-8")
      scrapedJobs = JSON.parse(data)
    } catch (error) {
      return NextResponse.json(
        { error: "No scraped jobs found. Please run the scraper first." },
        { status: 404 }
      )
    }

    if (!Array.isArray(scrapedJobs) || scrapedJobs.length === 0) {
      return NextResponse.json(
        { error: "No jobs found in scraped data." },
        { status: 400 }
      )
    }

    // Get or create a system user to post jobs
    let postedBy = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    if (!postedBy) {
      postedBy = await prisma.user.findUnique({
        where: { id: session.user.id },
      })
      if (!postedBy) {
        return NextResponse.json({ error: "No user found" }, { status: 404 })
      }
    }

    const createdJobs = []
    const errors = []
    const skipped = []

    for (const jobData of scrapedJobs) {
      try {
        // Extract company name and job title
        const companyName = jobData.company || "Unknown Company"
        const jobTitle = jobData.title || "Untitled Position"

        // Check if company exists, create if not
        let company = await prisma.company.findFirst({
          where: {
            name: { equals: companyName, mode: "insensitive" },
          },
        })

        if (!company) {
          // Create slug from company name
          const slug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")

          // Extract website from job URL if available
          let website: string | undefined
          if (jobData.url) {
            try {
              const url = new URL(jobData.url)
              website = `${url.protocol}//${url.host}`
            } catch {
              // Invalid URL, skip
            }
          }

          company = await prisma.company.create({
            data: {
              name: companyName,
              slug: slug,
              industry: "Technology",
              location: jobData.location || "Remote",
              size: "11-50",
              website: website,
              about: jobData.overview?.summary || `Technology company offering ${jobTitle} position.`,
            },
          })
        }

        // Check if job already exists using multiple strategies
        // 1. Check by exact title + company match
        let existingJob = await prisma.job.findFirst({
          where: {
            title: jobTitle,
            companyId: company.id,
            isActive: true,
          },
        })

        // 2. If not found, check by URL in description (if URL exists)
        if (!existingJob && jobData.url) {
          // Extract the base URL for matching
          let baseUrl: string | undefined
          try {
            const url = new URL(jobData.url)
            baseUrl = url.href.split('?')[0] // Remove query params
          } catch {
            // Invalid URL, skip URL check
          }

          if (baseUrl) {
            // Search for jobs with this URL in their description
            const jobsWithUrl = await prisma.job.findMany({
              where: {
                companyId: company.id,
                isActive: true,
                description: {
                  contains: baseUrl,
                },
              },
            })

            if (jobsWithUrl.length > 0) {
              existingJob = jobsWithUrl[0]
            }
          }
        }

        // 3. If still not found, check by normalized title + company (case-insensitive, trimmed)
        if (!existingJob) {
          const normalizedTitle = jobTitle.trim().toLowerCase()
          const allCompanyJobs = await prisma.job.findMany({
            where: {
              companyId: company.id,
              isActive: true,
            },
            select: {
              id: true,
              title: true,
            },
          })

          // Check if any job has a normalized title that matches
          existingJob = allCompanyJobs.find(
            (job: { id: string; title: string }) => job.title.trim().toLowerCase() === normalizedTitle
          ) as any
        }

        if (existingJob) {
          skipped.push({
            job: jobTitle,
            company: companyName,
            reason: "Already exists in database",
            existingJobId: existingJob.id,
          })
          continue
        }

        // Determine employment type
        let employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY" =
          "FULL_TIME"
        const empTypeLower = (jobData.employment_type || "").toLowerCase()
        if (empTypeLower.includes("part")) {
          employmentType = "PART_TIME"
        } else if (empTypeLower.includes("contract")) {
          employmentType = "CONTRACT"
        } else if (empTypeLower.includes("intern")) {
          employmentType = "INTERNSHIP"
        } else if (empTypeLower.includes("temp")) {
          employmentType = "TEMPORARY"
        }

        // Determine if remote/hybrid
        const locationLower = (jobData.location || "").toLowerCase()
        const metaLocation = (jobData.meta?.location_expectation || "").toLowerCase()
        const isRemote =
          locationLower.includes("remote") ||
          metaLocation.includes("remote") ||
          jobData.meta?.location_expectation?.includes("Remote")
        const isHybrid =
          locationLower.includes("hybrid") || metaLocation.includes("hybrid")

        // Build description from scraped data
        let description = ""
        if (jobData.overview?.summary) {
          description += jobData.overview.summary + "\n\n"
        }
        if (jobData.role?.summary) {
          description += jobData.role.summary + "\n\n"
        }
        if (jobData.description_text) {
          description += jobData.description_text.substring(0, 2000) // Limit length
        }
        if (jobData.url) {
          description += `\n\nApply at: ${jobData.url}`
        }

        // Build requirements from scraped data
        let requirements = ""
        if (jobData.requirements && jobData.requirements.length > 0) {
          requirements = jobData.requirements.join("\n• ")
          requirements = "• " + requirements
        } else if (jobData.what_we_require_raw) {
          requirements = jobData.what_we_require_raw
        } else {
          requirements = `Requirements will be listed on the application page. Please visit ${jobData.url || "the job posting"} for full details.`
        }

        // Extract salary range if available
        let salaryMin: number | undefined
        let salaryMax: number | undefined
        if (jobData.compensation?.salary_range) {
          salaryMin = jobData.compensation.salary_range.min
          salaryMax = jobData.compensation.salary_range.max
        }

        // Determine location
        let location = jobData.location || "Location TBD"
        if (isRemote) {
          location = "Remote"
        } else if (!location || location === "Location TBD") {
          // Try to extract from meta or description
          if (jobData.meta?.location_expectation) {
            location = jobData.meta.location_expectation
          } else {
            location = "Location TBD"
          }
        }

        // Create job
        const job = await prisma.job.create({
          data: {
            title: jobTitle,
            companyId: company.id,
            postedById: postedBy.id,
            location: location,
            isRemote: isRemote,
            isHybrid: isHybrid,
            employmentType: employmentType,
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            salaryCurrency: jobData.compensation?.salary_range?.currency || "USD",
            description: description || `We are hiring a ${jobTitle} at ${companyName}.`,
            requirements: requirements,
          },
        })

        createdJobs.push(job)
      } catch (error: any) {
        console.error(`Error importing job "${jobData.title || "Unknown"}":`, error)
        errors.push({
          job: jobData.title || "Unknown",
          company: jobData.company || "Unknown",
          error: error.message,
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        created: createdJobs.length,
        skipped: skipped.length,
        errors: errors.length,
        jobs: createdJobs,
        skippedDetails: skipped,
        errorDetails: errors,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Import Ashby jobs error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

