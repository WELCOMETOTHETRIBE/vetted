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
    const { content } = await req.json().catch(() => ({ content: null }))

    // Check if already reposted
    const existing = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Already reposted" }, { status: 400 })
    }

    const repost = await prisma.repost.create({
      data: {
        userId: session.user.id,
        postId,
        content: content || undefined,
      },
    })

    return NextResponse.json(repost, { status: 201 })
  } catch (error) {
    console.error("Repost error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

