import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { executeWorkflow } from "@/lib/ai/engagement-workflows"
import { z } from "zod"

const executeSchema = z.object({
  candidateId: z.string(),
  workflowId: z.string(),
  jobId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = executeSchema.parse(body)

    await executeWorkflow(data.candidateId, data.workflowId, data.jobId)

    return NextResponse.json(
      { success: true, message: "Workflow executed successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[engagement-execute] POST error:", error)
    return NextResponse.json(
      { error: "Failed to execute workflow", details: error.message },
      { status: 500 }
    )
  }
}

