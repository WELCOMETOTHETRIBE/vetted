import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface EngineerFinderCandidate {
  title: string
  link: string
  snippet?: string
  source: string
  signals?: string[]
  score?: number
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { candidates } = body

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: "Candidates array is required" }, { status: 400 })
    }

    const saved: any[] = []
    const skipped: any[] = []
    const errors: any[] = []

    for (const candidateData of candidates as EngineerFinderCandidate[]) {
      try {
        // Extract LinkedIn URL if it's a LinkedIn profile
        const linkedinUrl = candidateData.source === "linkedin" ? candidateData.link : null

        // Extract name from title (usually "Name | Title" or just "Name")
        const fullName = candidateData.title
          .split("|")[0]
          .split("-")[0]
          .trim()
          .replace(/\s+/g, " ")

        // Extract job title from title or snippet
        let jobTitle: string | null = null
        if (candidateData.title.includes("|")) {
          jobTitle = candidateData.title.split("|")[1]?.trim() || null
        }
        if (!jobTitle && candidateData.snippet) {
          // Try to extract from snippet
          const titleMatch = candidateData.snippet.match(/(?:at|@)\s+([^,\.]+)/i)
          if (titleMatch) {
            jobTitle = titleMatch[1].trim()
          }
        }

        // Extract company from snippet
        let currentCompany: string | null = null
        if (candidateData.snippet) {
          const companyMatch = candidateData.snippet.match(/(?:at|@|works? at|employed at)\s+([^,\.]+)/i)
          if (companyMatch) {
            currentCompany = companyMatch[1].trim()
          }
        }

        // Only save if we have a LinkedIn URL (required field)
        if (!linkedinUrl) {
          skipped.push({
            link: candidateData.link,
            reason: "Not a LinkedIn profile (LinkedIn URL required)",
          })
          continue
        }

        // Check if candidate already exists
        const existing = await prisma.candidate.findUnique({
          where: { linkedinUrl },
        })

        if (existing) {
          skipped.push({
            link: linkedinUrl,
            reason: "Already exists",
            candidateId: existing.id,
          })
          continue
        }

        // Create candidate with minimal data
        const newCandidate = await prisma.candidate.create({
          data: {
            linkedinUrl,
            fullName: fullName || "Unknown",
            jobTitle: jobTitle || null,
            currentCompany: currentCompany || null,
            status: "ACTIVE",
            addedById: session.user.id,
            // Store signals and score in notes
            notes: candidateData.signals
              ? `Engineer Finder Result\nScore: ${candidateData.score || 0}\nSignals: ${candidateData.signals.join(", ")}\nSource: ${candidateData.source}\nOriginal Link: ${candidateData.link}`
              : `Engineer Finder Result\nScore: ${candidateData.score || 0}\nSource: ${candidateData.source}\nOriginal Link: ${candidateData.link}`,
          },
        })

        saved.push({
          id: newCandidate.id,
          fullName: newCandidate.fullName,
          linkedinUrl: newCandidate.linkedinUrl,
        })
      } catch (error: any) {
        errors.push({
          link: candidateData.link,
          error: error.message || String(error),
        })
        console.error("Error saving candidate:", error)
      }
    }

    return NextResponse.json({
      success: true,
      saved: saved.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        saved,
        skipped,
        errors,
      },
    })
  } catch (error: any) {
    console.error("[engineer-finder-save] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

