import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { prisma } from "@/lib/prisma"

export interface CoverLetterOptions {
  tone?: "professional" | "casual" | "enthusiastic" | "formal"
  length?: "short" | "medium" | "long"
  highlight?: string[] // Specific skills/experiences to highlight
}

/**
 * Generate a personalized cover letter for a job application
 */
export async function generateCoverLetter(
  userId: string,
  jobId: string,
  options: CoverLetterOptions = {}
): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        experiences: {
          include: { company: true },
          orderBy: { startDate: "desc" },
        },
        educations: {
          orderBy: { startDate: "desc" },
        },
        skills: {
          include: { skill: true },
        },
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
      },
    })

    if (!job) {
      throw new Error("Job not found")
    }

    // Build user profile text
    const userProfile = buildUserProfileText(user)

    // Build job description
    const jobDescription = `
Title: ${job.title}
Company: ${job.company.name}
Location: ${job.location || "Not specified"}
Description: ${job.description.substring(0, 1000)}${job.description.length > 1000 ? "..." : ""}
${job.requirements ? `Requirements: ${job.requirements.substring(0, 500)}${job.requirements.length > 500 ? "..." : ""}` : ""}
`

    const tone = options.tone || "professional"
    const length = options.length || "medium"
    const highlight = options.highlight || []

    const toneInstructions = {
      professional: "Professional and polished, but approachable",
      casual: "Friendly and conversational, but still respectful",
      enthusiastic: "Energetic and passionate about the opportunity",
      formal: "Very formal and traditional business style",
    }

    const lengthInstructions = {
      short: "2-3 short paragraphs (150-200 words)",
      medium: "3-4 paragraphs (250-350 words)",
      long: "4-5 paragraphs (400-500 words)",
    }

    const highlightText = highlight.length > 0
      ? `\n\nSpecifically highlight these aspects: ${highlight.join(", ")}`
      : ""

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert career coach writing personalized cover letters. Write a compelling cover letter that:
1. Opens with a strong introduction mentioning the specific role and company
2. Highlights relevant experience and skills that match the job
3. Shows enthusiasm and cultural fit
4. Closes with a clear call to action
5. Uses ${toneInstructions[tone]} tone
6. Is ${lengthInstructions[length]}${highlightText}

Make it specific, authentic, and tailored to this exact role. Avoid generic phrases.`
        },
        {
          role: "user",
          content: `Write a cover letter for this application:

My Profile:
${userProfile}

Job Details:
${jobDescription}`
        }
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || null
  } catch (error: any) {
    console.error("Error generating cover letter:", error)
    return null
  }
}

function buildUserProfileText(user: any): string {
  const parts: string[] = []

  parts.push(`Name: ${user.name || "Candidate"}`)
  
  if (user.profile?.headline) {
    parts.push(`Headline: ${user.profile.headline}`)
  }

  if (user.profile?.about) {
    parts.push(`About: ${user.profile.about.substring(0, 300)}${user.profile.about.length > 300 ? "..." : ""}`)
  }

  if (user.experiences.length > 0) {
    parts.push("\nExperience:")
    user.experiences.slice(0, 3).forEach((exp: any) => {
      const company = exp.company?.name || exp.companyName || "Company"
      const duration = exp.isCurrent
        ? `${new Date(exp.startDate).getFullYear()} - Present`
        : exp.endDate
        ? `${new Date(exp.startDate).getFullYear()} - ${new Date(exp.endDate).getFullYear()}`
        : new Date(exp.startDate).getFullYear()
      parts.push(`- ${exp.title} at ${company} (${duration})`)
      if (exp.description) {
        parts.push(`  ${exp.description.substring(0, 150)}${exp.description.length > 150 ? "..." : ""}`)
      }
    })
  }

  if (user.educations.length > 0) {
    parts.push("\nEducation:")
    user.educations.slice(0, 2).forEach((edu: any) => {
      parts.push(`- ${edu.degree || "Degree"} from ${edu.school}`)
      if (edu.fieldOfStudy) {
        parts.push(`  Field: ${edu.fieldOfStudy}`)
      }
    })
  }

  if (user.skills.length > 0) {
    const skills = user.skills.slice(0, 10).map((us: any) => us.skill.name).join(", ")
    parts.push(`\nSkills: ${skills}`)
  }

  return parts.join("\n")
}

