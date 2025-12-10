import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type } = await req.json()

    // Check if reaction already exists
    const existing = await prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      // Toggle: remove if same type, update if different
      if (existing.type === type) {
        await prisma.postReaction.delete({ where: { id: existing.id } })
        return NextResponse.json({ action: "removed" })
      } else {
        await prisma.postReaction.update({
          where: { id: existing.id },
          data: { type },
        })
        return NextResponse.json({ action: "updated" })
      }
    }

    // Create new reaction
    const reaction = await prisma.postReaction.create({
      data: {
        postId,
        userId: session.user.id,
        type: type || "LIKE",
      },
    })

    return NextResponse.json(reaction, { status: 201 })
  } catch (error) {
    console.error("Toggle reaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

