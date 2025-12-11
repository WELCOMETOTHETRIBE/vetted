import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateJobDescription, enhanceJobDescription } from "@/lib/ai/job-description"
import { z } from "zod"

const generateDescriptionSchema = z.object({
  title: z.string().min(1),
  companyName: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  preferredQualifications: z.array(z.string()).optional(),
})

const enhanceDescriptionSchema = z.object({
  existingDescription: z.string().min(1),
  improvements: z.array(z.string()).optional(),
})

/**
 * POST /api/jobs/generate-description
 * Generate or enhance a job description
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, ...data } = body

    if (action === "enhance") {
      const enhanceData = enhanceDescriptionSchema.parse(data)
      const enhanced = await enhanceJobDescription(
        enhanceData.existingDescription,
        enhanceData.improvements
      )

      if (!enhanced) {
        return NextResponse.json(
          { error: "Failed to enhance description" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        description: enhanced,
        action: "enhance",
      })
    } else {
      // Generate new description
      const generateData = generateDescriptionSchema.parse(data)
      const description = await generateJobDescription(generateData)

      if (!description) {
        return NextResponse.json(
          { error: "Failed to generate description" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        description,
        action: "generate",
      })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Generate job description error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

