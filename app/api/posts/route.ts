import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPostSchema = z.object({
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
  groupId: z.string().optional(),
  companyId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = createPostSchema.parse(body)

    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        content: data.content,
        imageUrl: data.imageUrl,
        groupId: data.groupId,
        companyId: data.companyId,
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

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create post error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get("groupId")
    const userId = searchParams.get("userId")

    let where: any = { isActive: true }

    if (groupId) {
      where.groupId = groupId
    } else if (userId) {
      where.authorId = userId
    } else {
      // Get user's connections for feed
      const connections = await prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: session.user.id, status: "ACCEPTED" },
            { receiverId: session.user.id, status: "ACCEPTED" },
          ],
        },
      })

      const connectedUserIds = new Set<string>([session.user.id])
      connections.forEach((conn: { requesterId: string; receiverId: string }) => {
        connectedUserIds.add(conn.requesterId)
        connectedUserIds.add(conn.receiverId)
      })

      where.authorId = { in: Array.from(connectedUserIds) }
      where.groupId = null
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
        reactions: {
          select: {
            id: true,
            userId: true,
            type: true,
          },
        },
        comments: {
          where: { isActive: true },
          select: { id: true },
        },
        reposts: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

