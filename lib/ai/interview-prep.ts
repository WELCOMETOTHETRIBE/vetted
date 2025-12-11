import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai"
import { Candidate, Job } from "@prisma/client"

export interface InterviewQuestions {
  technical: string[]
  behavioral: string[]
  roleSpecific: string[]
  general: string[]
}

export interface InterviewInsights {
  candidateStrengths: string[]
  areasToExplore: string[]
  redFlags: string[]
  talkingPoints: string[]
  recommendedAssessments: string[]
}

/**
 * Generate interview questions for a candidate and job
 */
export async function generateInterviewQuestions(
  candidate: Candidate,
  job: Job
): Promise<InterviewQuestions | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    const candidateProfile = `
Name: ${candidate.fullName}
Current Title: ${candidate.jobTitle || "Not specified"}
Current Company: ${candidate.currentCompany || "Not specified"}
Experience: ${candidate.totalYearsExperience || "Not specified"} years
Education: ${candidate.degrees || "Not specified"}
Skills: ${candidate.skillsCount || 0} skills listed
${candidate.certifications ? `Certifications: ${candidate.certifications}` : ""}
`

    const jobDescription = `
Title: ${job.title}
Description: ${job.description.substring(0, 1000)}${job.description.length > 1000 ? "..." : ""}
Requirements: ${job.requirements?.substring(0, 500) || "Not specified"}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert interviewer. Generate relevant interview questions based on the candidate's profile and job requirements.

Return JSON:
{
  "technical": ["question1", "question2", ...],
  "behavioral": ["question1", "question2", ...],
  "roleSpecific": ["question1", "question2", ...],
  "general": ["question1", "question2", ...]
}

Generate 3-5 questions per category. Make them specific and relevant.`
        },
        {
          role: "user",
          content: `Candidate Profile:\n${candidateProfile}\n\nJob Description:\n${jobDescription}\n\nGenerate interview questions.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return null
    }

    const parsed = JSON.parse(content) as InterviewQuestions

    return {
      technical: Array.isArray(parsed.technical) ? parsed.technical : [],
      behavioral: Array.isArray(parsed.behavioral) ? parsed.behavioral : [],
      roleSpecific: Array.isArray(parsed.roleSpecific) ? parsed.roleSpecific : [],
      general: Array.isArray(parsed.general) ? parsed.general : [],
    }
  } catch (error: any) {
    console.error("Error generating interview questions:", error)
    return null
  }
}

/**
 * Generate interview insights and talking points
 */
export async function generateInterviewInsights(
  candidate: Candidate,
  job: Job
): Promise<InterviewInsights | null> {
  if (!isOpenAIConfigured()) {
    return null
  }

  try {
    const openai = getOpenAIClient()

    const candidateProfile = `
Name: ${candidate.fullName}
Current Title: ${candidate.jobTitle || "Not specified"}
Current Company: ${candidate.currentCompany || "Not specified"}
Experience: ${candidate.totalYearsExperience || "Not specified"} years
Education: ${candidate.degrees || "Not specified"}
Previous Companies: ${candidate.companies || "Not specified"}
${candidate.projects ? `Projects: ${candidate.projects}` : ""}
`

    const jobDescription = `
Title: ${job.title}
Description: ${job.description.substring(0, 1000)}${job.description.length > 1000 ? "..." : ""}
Requirements: ${job.requirements?.substring(0, 500) || "Not specified"}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert recruiter preparing for an interview. Analyze the candidate and job to provide insights.

Return JSON:
{
  "candidateStrengths": ["strength1", "strength2", ...],
  "areasToExplore": ["area1", "area2", ...],
  "redFlags": ["flag1", "flag2", ...],
  "talkingPoints": ["point1", "point2", ...],
  "recommendedAssessments": ["assessment1", "assessment2", ...]
}`
        },
        {
          role: "user",
          content: `Candidate:\n${candidateProfile}\n\nJob:\n${jobDescription}\n\nProvide interview insights.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return null
    }

    const parsed = JSON.parse(content) as InterviewInsights

    return {
      candidateStrengths: Array.isArray(parsed.candidateStrengths) ? parsed.candidateStrengths : [],
      areasToExplore: Array.isArray(parsed.areasToExplore) ? parsed.areasToExplore : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      talkingPoints: Array.isArray(parsed.talkingPoints) ? parsed.talkingPoints : [],
      recommendedAssessments: Array.isArray(parsed.recommendedAssessments) ? parsed.recommendedAssessments : [],
    }
  } catch (error: any) {
    console.error("Error generating interview insights:", error)
    return null
  }
}

