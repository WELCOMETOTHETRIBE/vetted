import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseResumeText, extractTextFromResume } from "@/lib/ai/resume-parser"

/**
 * POST /api/candidates/upload-resume
 * Upload resume and create candidate with AI field mapping
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
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const formData = await req.formData()
    const resumeFile = formData.get("resume") as File | null
    const resumeText = formData.get("resumeText") as string | null
    const linkedinUrl = formData.get("linkedinUrl") as string | null

    if (!resumeFile && !resumeText) {
      return NextResponse.json(
        { error: "Resume file or text is required" },
        { status: 400 }
      )
    }

    let textToParse = resumeText

    // If file uploaded, extract text from it
    if (resumeFile) {
      try {
        const arrayBuffer = await resumeFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const extractedText = await extractTextFromResume(buffer, resumeFile.name)
        
        // Use extracted text, or combine with manually provided text
        textToParse = extractedText + (resumeText ? `\n\n${resumeText}` : "")
      } catch (error: any) {
        console.error("Error extracting text from file:", error)
        return NextResponse.json(
          { error: `Failed to extract text from file: ${error.message}` },
          { status: 400 }
        )
      }
    }

    if (!textToParse || textToParse.trim().length === 0) {
      return NextResponse.json(
        { error: "Resume text is required (could not extract from file)" },
        { status: 400 }
      )
    }

    // Parse resume with AI
    const parsed = await parseResumeText(textToParse)

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse resume" },
        { status: 500 }
      )
    }

    if (!parsed.name) {
      return NextResponse.json(
        { error: "Could not extract name from resume" },
        { status: 400 }
      )
    }

    // Check if candidate already exists
    const existingCandidate = linkedinUrl
      ? await prisma.candidate.findUnique({
          where: { linkedinUrl },
        })
      : null

    if (existingCandidate) {
      return NextResponse.json(
        { error: "Candidate with this LinkedIn URL already exists", candidateId: existingCandidate.id },
        { status: 409 }
      )
    }

    // Map parsed resume to candidate fields
    const candidateData: any = {
      linkedinUrl: linkedinUrl || `manual-${Date.now()}`, // Generate unique URL if not provided
      fullName: parsed.name,
      jobTitle: parsed.currentTitle || null,
      currentCompany: parsed.currentCompany || null,
      location: parsed.location || null,
      addedById: session.user.id,
      status: "ACTIVE",
      rawData: JSON.stringify(parsed),
    }

    // Extract experience info
    if (parsed.experience && parsed.experience.length > 0) {
      // Sort experience by date (most recent first)
      const sortedExperience = [...parsed.experience].sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate + "-01").getTime() : 0
        const dateB = b.startDate ? new Date(b.startDate + "-01").getTime() : 0
        return dateB - dateA
      })

      // Get current experience (isCurrent=true or most recent)
      const currentExp = sortedExperience.find((exp) => exp.isCurrent) || sortedExperience[0]
      if (currentExp) {
        candidateData.currentCompany = currentExp.company
        candidateData.jobTitle = currentExp.title
        if (currentExp.startDate) {
          candidateData.currentCompanyStartDate = currentExp.startDate
        }
        if (currentExp.endDate && !currentExp.isCurrent) {
          candidateData.currentCompanyEndDate = currentExp.endDate
        }
      }

      // Get previous company (second most recent, or most recent non-current)
      const previousExp = sortedExperience.find((exp) => !exp.isCurrent && exp !== currentExp) || 
                          (sortedExperience.length > 1 && sortedExperience[1] !== currentExp ? sortedExperience[1] : null)
      if (previousExp) {
        candidateData.previousTargetCompany = previousExp.company
        if (previousExp.startDate) {
          candidateData.previousTargetCompanyStartDate = previousExp.startDate
        }
        if (previousExp.endDate) {
          candidateData.previousTargetCompanyEndDate = previousExp.endDate
        }
        if (previousExp.title) {
          candidateData.previousTitles = previousExp.title
        }
      }

      // Calculate total experience
      let totalYears = 0
      for (const exp of parsed.experience) {
        if (exp.startDate) {
          const start = new Date(exp.startDate + "-01")
          const end = exp.endDate && !exp.isCurrent ? new Date(exp.endDate + "-01") : new Date()
          const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
          totalYears += years
        }
      }
      if (totalYears > 0) {
        candidateData.totalYearsExperience = Math.round(totalYears * 10) / 10 + " years"
      }
    }

    // Extract education info
    if (parsed.education && parsed.education.length > 0) {
      const universities = parsed.education.map((edu) => edu.school)
      const fieldsOfStudy = parsed.education.map((edu) => edu.fieldOfStudy).filter(Boolean)
      const degrees = parsed.education.map((edu) => edu.degree).filter(Boolean)
      const graduationYear = parsed.education.find((edu) => edu.graduationYear)?.graduationYear

      candidateData.universities = JSON.stringify(universities)
      candidateData.fieldsOfStudy = JSON.stringify(fieldsOfStudy)
      candidateData.degrees = degrees.join(", ")
      candidateData.undergradGraduationYear = graduationYear || null
    }

    // Extract other fields
    if (parsed.certifications && parsed.certifications.length > 0) {
      candidateData.certifications = JSON.stringify(parsed.certifications)
    }
    if (parsed.languages && parsed.languages.length > 0) {
      candidateData.languages = JSON.stringify(parsed.languages)
    }
    if (parsed.projects && parsed.projects.length > 0) {
      candidateData.projects = JSON.stringify(parsed.projects.map((p) => p.name))
    }
    if (parsed.publications && parsed.publications.length > 0) {
      candidateData.publications = JSON.stringify(parsed.publications)
    }
    if (parsed.awards && parsed.awards.length > 0) {
      candidateData.honorsAwards = JSON.stringify(parsed.awards)
    }
    if (parsed.email) {
      candidateData.emails = JSON.stringify([parsed.email])
    }
    if (parsed.phone) {
      candidateData.phones = JSON.stringify([parsed.phone])
    }

    // Count arrays
    candidateData.skillsCount = parsed.skills?.length || 0
    candidateData.experienceCount = parsed.experience?.length || 0
    candidateData.educationCount = parsed.education?.length || 0

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: candidateData,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Generate AI summary asynchronously (don't wait)
    import("@/lib/ai/candidate-ai")
      .then(({ generateCandidateSummary }) => {
        generateCandidateSummary(candidate.id).catch((err) => {
          console.error("Error generating candidate summary:", err)
        })
      })
      .catch(() => {
        // Ignore if module not found
      })

    return NextResponse.json({
      success: true,
      candidate,
      parsed,
      message: "Candidate created successfully from resume",
    })
  } catch (error: any) {
    console.error("Error creating candidate from resume:", error)
    return NextResponse.json(
      { error: "Failed to create candidate", details: error.message },
      { status: 500 }
    )
  }
}

