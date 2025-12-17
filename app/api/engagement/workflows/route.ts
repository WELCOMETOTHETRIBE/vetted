import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getUserWorkflows,
  createWorkflowFromTemplate,
  WORKFLOW_TEMPLATES,
} from "@/lib/ai/engagement-workflows"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["EMAIL", "CALL", "MESSAGE", "LINKEDIN", "SMS"]),
      delayDays: z.number().min(0),
      delayHours: z.number().min(0).optional(),
      subject: z.string().optional(),
      content: z.string().min(1),
      template: z.string().optional(),
    })
  ),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let workflows = await getUserWorkflows(session.user.id)

    // If user has no workflows, auto-create default templates
    if (workflows.length === 0) {
      console.log("[engagement-workflows] No workflows found, creating default templates")
      const createdWorkflows: any[] = []
      
      for (const [templateKey, template] of Object.entries(WORKFLOW_TEMPLATES)) {
        try {
          // Check if workflow already exists (in case of race condition)
          const existing = await prisma.engagementWorkflow.findFirst({
            where: {
              createdById: session.user.id,
              name: template.name,
              isActive: true,
            },
          })
          
          if (existing) {
            // Use existing workflow
            createdWorkflows.push({
              id: existing.id,
              name: existing.name,
              description: existing.description || undefined,
              steps: JSON.parse(existing.steps),
              isActive: existing.isActive,
              createdAt: existing.createdAt,
              updatedAt: existing.updatedAt,
            })
            continue
          }
          
          const workflow = await createWorkflowFromTemplate(
            templateKey as keyof typeof WORKFLOW_TEMPLATES,
            session.user.id
          )
          createdWorkflows.push(workflow)
        } catch (error: any) {
          console.error(`[engagement-workflows] Error creating template ${templateKey}:`, error.message)
          // Try to fetch existing workflows as fallback
          const fallbackWorkflows = await getUserWorkflows(session.user.id)
          if (fallbackWorkflows.length > 0) {
            workflows = fallbackWorkflows
            break
          }
        }
      }
      
      if (createdWorkflows.length > 0) {
        workflows = createdWorkflows
        console.log(`[engagement-workflows] Created ${createdWorkflows.length} default workflows`)
      }
    }

    return NextResponse.json({ workflows, templates: WORKFLOW_TEMPLATES })
  } catch (error: any) {
    console.error("[engagement-workflows] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflows", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Check if creating from template
    if (body.template && body.template in WORKFLOW_TEMPLATES) {
      const workflow = await createWorkflowFromTemplate(
        body.template as keyof typeof WORKFLOW_TEMPLATES,
        session.user.id,
        body.name
      )
      return NextResponse.json({ workflow }, { status: 201 })
    }

    // Create custom workflow
    const data = createWorkflowSchema.parse(body)
    const workflow = await prisma.engagementWorkflow.create({
      data: {
        name: data.name,
        description: data.description,
        steps: JSON.stringify(data.steps),
        isActive: true,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(
      {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: JSON.parse(workflow.steps),
          isActive: workflow.isActive,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[engagement-workflows] POST error:", error)
    return NextResponse.json(
      { error: "Failed to create workflow", details: error.message },
      { status: 500 }
    )
  }
}

