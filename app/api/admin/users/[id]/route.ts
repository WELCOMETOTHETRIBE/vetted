import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const audienceSchema = z.object({
  audience: z.enum(["ADMIN", "CANDIDATE", "EMPLOYER"]),
})

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
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

    const userId = id

    // Deactivate user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Deactivate user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { audience } = audienceSchema.parse(body)

    // Prevent self-demotion to avoid accidental lockout
    if (id === session.user.id && audience !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot remove your own admin access." },
        { status: 400 }
      )
    }

    const data =
      audience === "ADMIN"
        ? { role: "ADMIN" as const, accountType: null }
        : {
            role: "USER" as const,
            accountType: audience === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE",
          }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountType: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update user audience error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

