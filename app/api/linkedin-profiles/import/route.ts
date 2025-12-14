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

    // Quality metrics tracking for feedback loops
    const qualityMetrics = {
      totalProfiles: profiles.length,
      withHtml: 0,
      withoutHtml: 0,
      htmlExtractionSuccess: 0,
      htmlExtractionFailed: 0,
      profileProcessorSuccess: 0,
      profileProcessorFailed: 0,
      completeData: 0,
      needsAiEnrichment: 0,
      fieldFillRates: {
        fullName: 0,
        jobTitle: 0,
        currentCompany: 0,
        location: 0,
        companies: 0,
        universities: 0,
        fieldsOfStudy: 0,
        totalYearsExperience: 0,
        skillsCount: 0,
        experienceCount: 0,
        educationCount: 0,
      },
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
        // This is the same parsing pipeline that the extension uses:
        // 1. Extension: contentScript.js extracts HTML -> JSON structure
        // 2. Extension: profileProcessor.js processes JSON -> structured candidate data
        // 3. SERPAPI: profile-processor-server.ts extracts HTML -> JSON structure (same as step 1)
        // 4. SERPAPI: profileProcessor.js processes JSON -> structured candidate data (same as step 2)
        // This ensures both methods use identical parsing logic for data enrichment
        if (profile.html && profile.raw_text) {
          qualityMetrics.withHtml++
          try {
            // Step 1: Extract structured data from HTML (like contentScript.js does)
            // This mimics the extension's HTML extraction logic
            const { buildProfileDocumentFromHTML } = await import("@/lib/profile-processor-server")
            let profileDocument: any
            try {
              profileDocument = buildProfileDocumentFromHTML(profile.html, profile.linkedin_url)
              qualityMetrics.htmlExtractionSuccess++
            } catch (extractError: any) {
              qualityMetrics.htmlExtractionFailed++
              throw new Error(`HTML extraction failed: ${extractError.message}`)
            }
            
            // Step 2: Process using profileProcessor.js (like the extension does)
            // This is the exact same processor the extension uses for multi-layered parsing
            // Load the JavaScript file dynamically using vm (like Prisma client loading)
            const profileProcessorPath = join(process.cwd(), "extension", "profileProcessor.js")
            
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
            
            // Log what we extracted for debugging - COMPREHENSIVE
            console.log(`\n========== [LINKEDIN IMPORT] Processing ${profile.linkedin_url} ==========`)
            console.log(`[STEP 1] HTML Extraction Results:`)
            console.log(`  - Name: ${profileDocument.personal_info?.name || "NOT FOUND"}`)
            console.log(`  - Headline: ${profileDocument.personal_info?.headline || "NOT FOUND"}`)
            console.log(`  - Location: ${profileDocument.personal_info?.location || "NOT FOUND"}`)
            console.log(`  - Experience items: ${profileDocument.experience?.length || 0}`)
            if (profileDocument.experience && profileDocument.experience.length > 0) {
              console.log(`  - First experience:`, JSON.stringify(profileDocument.experience[0], null, 2))
            }
            console.log(`  - Education items: ${profileDocument.education?.length || 0}`)
            if (profileDocument.education && profileDocument.education.length > 0) {
              console.log(`  - First education:`, JSON.stringify(profileDocument.education[0], null, 2))
            }
            console.log(`  - Skills items: ${profileDocument.skills?.length || 0}`)
            console.log(`  - Raw text length: ${profileDocument.raw_text?.length || 0} chars`)
            console.log(`  - Raw HTML length: ${profileDocument.raw_html?.length || 0} chars`)
            
            // Process the profile document
            let processedResult: any
            try {
              processedResult = profileProcessor.processProfileDocument(profileDocument)
              if (processedResult) {
                qualityMetrics.profileProcessorSuccess++
              } else {
                qualityMetrics.profileProcessorFailed++
              }
            } catch (processorError: any) {
              qualityMetrics.profileProcessorFailed++
              throw new Error(`ProfileProcessor failed: ${processorError.message}`)
            }
            
            console.log(`[STEP 2] ProfileProcessor Results:`)
            if (processedResult) {
              console.log(`  - Full Name: ${processedResult["Full Name"] || "NOT FOUND"}`)
              console.log(`  - Job Title: ${processedResult["Job title"] || "NOT FOUND"}`)
              console.log(`  - Current Company: ${processedResult["Current Company"] || "NOT FOUND"}`)
              console.log(`  - Location: ${processedResult["Location"] || "NOT FOUND"}`)
              console.log(`  - Total Years Experience: ${processedResult["Total Years full time experience"] || "NOT FOUND"}`)
              console.log(`  - Companies: ${processedResult["Companies"] ? JSON.stringify(processedResult["Companies"]) : "NOT FOUND"}`)
              console.log(`  - Universities: ${processedResult["Universities"] ? JSON.stringify(processedResult["Universities"]) : "NOT FOUND"}`)
              console.log(`  - Fields of Study: ${processedResult["Fields of Study"] ? JSON.stringify(processedResult["Fields of Study"]) : "NOT FOUND"}`)
              console.log(`  - Certifications: ${processedResult["Certifications"] || "NOT FOUND"}`)
              console.log(`  - Languages: ${processedResult["Languages"] || "NOT FOUND"}`)
              console.log(`  - Projects: ${processedResult["Projects"] || "NOT FOUND"}`)
              console.log(`  - Publications: ${processedResult["Publications"] || "NOT FOUND"}`)
              console.log(`  - All processed fields:`, Object.keys(processedResult))
              console.log(`  - Raw Data included: ${!!processedResult["Raw Data"]}`)
              if (processedResult["Raw Data"]) {
                try {
                  const rawDataParsed = JSON.parse(processedResult["Raw Data"])
                  console.log(`  - Raw Data structure:`, {
                    hasPersonalInfo: !!rawDataParsed.personal_info,
                    hasExperience: !!rawDataParsed.experience,
                    hasEducation: !!rawDataParsed.education,
                    hasSkills: !!rawDataParsed.skills,
                    hasComprehensiveData: !!rawDataParsed.comprehensive_data,
                    comprehensiveDataLength: rawDataParsed.comprehensive_data?.length || 0,
                  })
                } catch (e) {
                  console.log(`  - Raw Data parse error:`, e)
                }
              }
            } else {
              console.log(`  - ProfileProcessor returned NULL (invalid profile)`)
            }
            
            // Check if processed data is complete enough
            const hasEssentialFields = processedResult && processedResult["Full Name"] && 
              (processedResult["Current Company"] || processedResult["Job title"] || 
               processedResult["Companies"] || processedResult["Universities"])
            
            // Check if we're missing critical data that should be extracted
            const missingCriticalData = !processedResult || 
              !processedResult["Companies"] || 
              processedResult["Companies"]?.length === 0 ||
              (!processedResult["Current Company"] && processedResult["Companies"]?.length === 0) ||
              (!processedResult["Universities"] || processedResult["Universities"]?.length === 0) ||
              (!processedResult["Total Years full time experience"] && profileDocument.experience?.length > 0)
            
            if (hasEssentialFields && !missingCriticalData) {
              // Use the processed data directly - it's already in the correct format
              candidateData = processedResult
<<<<<<< HEAD
              results.qualityMetrics.parsingSuccess++
=======
              qualityMetrics.completeData++
>>>>>>> fdef56c (Fix SERPAPI LinkedIn import to use extension parsing pipeline with monitoring)
              console.log(`[STEP 3] Using processed data - SUCCESS (complete data)`)
              console.log(`========== [LINKEDIN IMPORT] Complete for ${profile.linkedin_url} ==========\n`)
            } else {
              // Use processed data as base, but add raw data for AI enrichment to fill gaps
              if (processedResult) {
                candidateData = processedResult
                qualityMetrics.needsAiEnrichment++
                console.log(`[STEP 3] Using processed data as base, adding raw data for AI enrichment to fill gaps`)
              }
              
              // Always include comprehensive raw data for AI enrichment
              candidateData["Raw Data"] = JSON.stringify({
                ...profileDocument,
                // Include full raw text and HTML for AI parsing
                raw_text: profile.raw_text || profileDocument.raw_text,
                raw_html: profile.html || profileDocument.raw_html,
              })
              
              console.log(`[STEP 3] Data status:`)
              console.log(`  - Has essential fields: ${hasEssentialFields}`)
              console.log(`  - Missing critical data: ${missingCriticalData}`)
              console.log(`  - Experience items extracted: ${profileDocument.experience?.length || 0}`)
              console.log(`  - Education items extracted: ${profileDocument.education?.length || 0}`)
              console.log(`  - Skills items extracted: ${profileDocument.skills?.length || 0}`)
              console.log(`  - Will use AI enrichment to fill gaps`)
              console.log(`========== [LINKEDIN IMPORT] Complete for ${profile.linkedin_url} ==========\n`)
            }

            // Track field fill rates for quality metrics
            if (processedResult) {
              if (processedResult["Full Name"]) qualityMetrics.fieldFillRates.fullName++
              if (processedResult["Job title"]) qualityMetrics.fieldFillRates.jobTitle++
              if (processedResult["Current Company"]) qualityMetrics.fieldFillRates.currentCompany++
              if (processedResult["Location"]) qualityMetrics.fieldFillRates.location++
              if (processedResult["Companies"] && Array.isArray(processedResult["Companies"]) && processedResult["Companies"].length > 0) qualityMetrics.fieldFillRates.companies++
              if (processedResult["Universities"] && Array.isArray(processedResult["Universities"]) && processedResult["Universities"].length > 0) qualityMetrics.fieldFillRates.universities++
              if (processedResult["Fields of Study"] && Array.isArray(processedResult["Fields of Study"]) && processedResult["Fields of Study"].length > 0) qualityMetrics.fieldFillRates.fieldsOfStudy++
              if (processedResult["Total Years full time experience"]) qualityMetrics.fieldFillRates.totalYearsExperience++
              if (processedResult["Skills Count"]) qualityMetrics.fieldFillRates.skillsCount++
              if (processedResult["Experience Count"]) qualityMetrics.fieldFillRates.experienceCount++
              if (processedResult["Education Count"]) qualityMetrics.fieldFillRates.educationCount++
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
        } else {
          // If HTML wasn't scraped, we can't use the extension's parsing pipeline
          // Log a warning and create minimal candidate data for AI enrichment
          qualityMetrics.withoutHtml++
          console.warn(`[LINKEDIN IMPORT] Profile ${profile.linkedin_url} has no HTML. Cannot use extension parsing pipeline.`)
          console.warn(`  - Status: ${profile.status || "unknown"}`)
          console.warn(`  - Suggestion: Re-run search with scrape=true to get HTML`)
          
          // Create minimal structure for AI enrichment (will rely on AI to extract from URL/profile)
          candidateData["Raw Data"] = JSON.stringify({
            extraction_metadata: {
              source_url: profile.linkedin_url,
              extracted_at: profile.scraped_at || profile.found_at || new Date().toISOString(),
            },
            personal_info: {
              profile_url: profile.linkedin_url,
            },
            // Note: No HTML/raw_text available - AI enrichment will be limited
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
          stack: error.stack,
        })
        console.error(`[LINKEDIN IMPORT] Error processing ${profile.linkedin_url}:`, error)
      }
    }

<<<<<<< HEAD
    // Calculate quality percentages
    const quality = results.qualityMetrics
    const successRate = quality.totalProfiles > 0 ? Math.round((results.created / quality.totalProfiles) * 100) : 0
    const parsingSuccessRate = quality.profilesWithHtml > 0 ? Math.round((quality.parsingSuccess / quality.profilesWithHtml) * 100) : 0
    const aiEnrichmentRate = results.created > 0 ? Math.round((quality.aiEnrichmentUsed / results.created) * 100) : 0

    console.log(`\n========== [IMPORT QUALITY SUMMARY] ==========`)
    console.log(`Total profiles: ${quality.totalProfiles}`)
    console.log(`With HTML: ${quality.profilesWithHtml} (${Math.round((quality.profilesWithHtml/quality.totalProfiles)*100)}%)`)
    console.log(`URLs only: ${quality.profilesWithUrlsOnly} (${Math.round((quality.profilesWithUrlsOnly/quality.totalProfiles)*100)}%)`)
    console.log(`Success rate: ${successRate}% (${results.created}/${quality.totalProfiles})`)
    console.log(`Parsing success: ${parsingSuccessRate}% (${quality.parsingSuccess}/${quality.profilesWithHtml})`)
    console.log(`AI enrichment used: ${aiEnrichmentRate}% (${quality.aiEnrichmentUsed}/${results.created})`)
    console.log(`\nField fill rates:`)
    Object.entries(quality.criticalFieldsFilled).forEach(([field, count]) => {
      const rate = results.created > 0 ? Math.round((count / results.created) * 100) : 0
      console.log(`  - ${field}: ${rate}% (${count}/${results.created})`)
    })
    console.log(`========== [IMPORT QUALITY SUMMARY] ==========\n`)
=======
    // Calculate final quality metrics
    const processedCount = qualityMetrics.htmlExtractionSuccess
    const fieldFillRatePercentages: Record<string, number> = {}
    if (processedCount > 0) {
      Object.entries(qualityMetrics.fieldFillRates).forEach(([field, count]) => {
        fieldFillRatePercentages[field] = Math.round((count / processedCount) * 100)
      })
    }

    // Comprehensive summary for feedback loops
    console.log(`\n========== [LINKEDIN IMPORT] BATCH SUMMARY ==========`)
    console.log(`Total Profiles: ${qualityMetrics.totalProfiles}`)
    console.log(`  - With HTML: ${qualityMetrics.withHtml} (${Math.round((qualityMetrics.withHtml / qualityMetrics.totalProfiles) * 100)}%)`)
    console.log(`  - Without HTML: ${qualityMetrics.withoutHtml} (${Math.round((qualityMetrics.withoutHtml / qualityMetrics.totalProfiles) * 100)}%)`)
    console.log(`\nHTML Extraction:`)
    console.log(`  - Success: ${qualityMetrics.htmlExtractionSuccess}`)
    console.log(`  - Failed: ${qualityMetrics.htmlExtractionFailed}`)
    console.log(`\nProfileProcessor:`)
    console.log(`  - Success: ${qualityMetrics.profileProcessorSuccess}`)
    console.log(`  - Failed: ${qualityMetrics.profileProcessorFailed}`)
    console.log(`\nData Quality:`)
    console.log(`  - Complete Data (no AI needed): ${qualityMetrics.completeData}`)
    console.log(`  - Needs AI Enrichment: ${qualityMetrics.needsAiEnrichment}`)
    console.log(`\nField Fill Rates (${processedCount} processed):`)
    Object.entries(fieldFillRatePercentages).forEach(([field, percentage]) => {
      const count = qualityMetrics.fieldFillRates[field as keyof typeof qualityMetrics.fieldFillRates]
      console.log(`  - ${field}: ${count}/${processedCount} (${percentage}%)`)
    })
    console.log(`\nResults:`)
    console.log(`  - Created: ${results.created}`)
    console.log(`  - Skipped: ${results.skipped}`)
    console.log(`  - Errors: ${results.errors}`)
    console.log(`========== [LINKEDIN IMPORT] BATCH SUMMARY END ==========\n`)
>>>>>>> fdef56c (Fix SERPAPI LinkedIn import to use extension parsing pipeline with monitoring)

    return NextResponse.json({
      success: true,
      results,
<<<<<<< HEAD
      qualityMetrics: quality,
      summary: {
        successRate,
        parsingSuccessRate,
        aiEnrichmentRate,
        fieldFillRates: Object.fromEntries(
          Object.entries(quality.criticalFieldsFilled).map(([field, count]) => [
            field,
            results.created > 0 ? Math.round((count / results.created) * 100) : 0
          ])
        )
      },
      message: `Processed ${results.processed} profiles: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors. Quality: ${successRate}% success, ${parsingSuccessRate}% parsing success, ${aiEnrichmentRate}% AI enriched.`,
=======
      qualityMetrics: {
        ...qualityMetrics,
        fieldFillRatePercentages,
      },
      message: `Processed ${results.processed} profiles: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`,
>>>>>>> fdef56c (Fix SERPAPI LinkedIn import to use extension parsing pipeline with monitoring)
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

