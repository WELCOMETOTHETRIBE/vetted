import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  type: z.enum(["BUG", "FEATURE"]).default("BUG"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  title: z.string().min(3),
  description: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tickets = await prisma.opsTicket.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 50,
  })

  return NextResponse.json({ success: true, tickets })
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const data = createSchema.parse(body)

    const ticket = await prisma.opsTicket.create({
      data: {
        type: data.type,
        priority: data.priority,
        title: data.title,
        description: data.description || null,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 })
    }
    console.error("Create ops ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

