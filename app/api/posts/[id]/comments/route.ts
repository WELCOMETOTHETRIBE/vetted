import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCommentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().optional(),
})

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

    const body = await req.json()
    const data = createCommentSchema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: session.user.id,
        content: data.content,
        parentId: data.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create comment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        isActive: true,
        parentId: null, // Top-level comments only
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
        replies: {
          where: { isActive: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                handle: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

