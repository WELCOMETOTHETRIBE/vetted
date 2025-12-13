import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseResumeText, extractTextFromResume } from "@/lib/ai/resume-parser"

/**
 * POST /api/profile/complete-from-resume
 * Upload resume and auto-complete user profile
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const resumeFile = formData.get("resume") as File | null
    const resumeText = formData.get("resumeText") as string | null

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

    // Get or create user profile
    let profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    const updateData: any = {
      resumeParsedAt: new Date(),
      resumeText: textToParse.substring(0, 10000), // Store first 10k chars
    }

    // Update profile fields from parsed resume
    if (parsed.headline) updateData.headline = parsed.headline
    if (parsed.location) updateData.location = parsed.location
    if (parsed.summary) updateData.about = parsed.summary
    if (parsed.phone) updateData.phone = parsed.phone
    if (parsed.website) updateData.website = parsed.website
    if (parsed.currentTitle) updateData.currentTitle = parsed.currentTitle
    if (parsed.currentCompany) updateData.currentCompany = parsed.currentCompany
    if (parsed.industry) updateData.industry = parsed.industry
    if (parsed.languages && parsed.languages.length > 0) {
      updateData.languages = JSON.stringify(parsed.languages)
    }
    if (parsed.certifications && parsed.certifications.length > 0) {
      updateData.certifications = JSON.stringify(parsed.certifications)
    }
    if (parsed.projects && parsed.projects.length > 0) {
      updateData.projects = JSON.stringify(parsed.projects)
    }
    if (parsed.publications && parsed.publications.length > 0) {
      updateData.publications = JSON.stringify(parsed.publications)
    }
    if (parsed.volunteerWork && parsed.volunteerWork.length > 0) {
      updateData.volunteerWork = JSON.stringify(parsed.volunteerWork)
    }
    if (parsed.awards && parsed.awards.length > 0) {
      updateData.awards = JSON.stringify(parsed.awards)
    }

    if (profile) {
      profile = await prisma.userProfile.update({
        where: { userId: session.user.id },
        data: updateData,
      })
    } else {
      profile = await prisma.userProfile.create({
        data: {
          userId: session.user.id,
          ...updateData,
        },
      })
    }

    // Update user name/email if found in resume
    const userUpdate: any = {}
    if (parsed.name && parsed.name !== session.user.name) {
      userUpdate.name = parsed.name
    }
    if (parsed.email && parsed.email !== session.user.email) {
      // Don't update email automatically - it's used for auth
      // userUpdate.email = parsed.email
    }
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdate,
      })
    }

    // Create/update experiences
    if (parsed.experience && parsed.experience.length > 0) {
      // Delete existing experiences and recreate
      await prisma.experience.deleteMany({
        where: { userId: session.user.id },
      })

      for (const exp of parsed.experience) {
        try {
          const startDate = exp.startDate ? new Date(exp.startDate + "-01") : new Date()
          const endDate = exp.endDate && !exp.isCurrent ? new Date(exp.endDate + "-01") : null

          await prisma.experience.create({
            data: {
              userId: session.user.id,
              title: exp.title,
              companyName: exp.company,
              location: exp.location || null,
              description: exp.description || null,
              startDate,
              endDate,
              isCurrent: exp.isCurrent || false,
            },
          })
        } catch (error: any) {
          console.warn(`Error creating experience: ${exp.title} at ${exp.company}:`, error.message)
        }
      }
    }

    // Create/update education
    if (parsed.education && parsed.education.length > 0) {
      // Delete existing education and recreate
      await prisma.education.deleteMany({
        where: { userId: session.user.id },
      })

      for (const edu of parsed.education) {
        try {
          const startDate = edu.graduationYear ? new Date(parseInt(edu.graduationYear) - 4, 0, 1) : null
          const endDate = edu.graduationYear ? new Date(parseInt(edu.graduationYear), 11, 31) : null

          await prisma.education.create({
            data: {
              userId: session.user.id,
              school: edu.school,
              degree: edu.degree || null,
              fieldOfStudy: edu.fieldOfStudy || null,
              startDate,
              endDate,
              description: edu.gpa ? `GPA: ${edu.gpa}` : null,
            },
          })
        } catch (error: any) {
          console.warn(`Error creating education: ${edu.school}:`, error.message)
        }
      }
    }

    // Create/update skills
    if (parsed.skills && parsed.skills.length > 0) {
      // Delete existing user skills
      await prisma.userSkill.deleteMany({
        where: { userId: session.user.id },
      })

      for (const skillName of parsed.skills) {
        try {
          // Find or create skill
          let skill = await prisma.skill.findUnique({
            where: { name: skillName },
          })

          if (!skill) {
            skill = await prisma.skill.create({
              data: { name: skillName },
            })
          }

          // Create user skill relationship
          await prisma.userSkill.create({
            data: {
              userId: session.user.id,
              skillId: skill.id,
            },
          })
        } catch (error: any) {
          // Skip duplicates
          if (!error.message?.includes("Unique constraint")) {
            console.warn(`Error creating skill: ${skillName}:`, error.message)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      parsed,
      message: "Profile updated successfully from resume",
    })
  } catch (error: any) {
    console.error("Error completing profile from resume:", error)
    return NextResponse.json(
      { error: "Failed to complete profile", details: error.message },
      { status: 500 }
    )
  }
}

