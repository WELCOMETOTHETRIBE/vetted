import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPostSchema = z.object({
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
  groupId: z.string().optional(),
  companyId: z.string().optional(),
  mentions: z.array(z.string()).optional(), // Array of user IDs mentioned
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

    // Parse mentions from content (@username or @handle) and create notifications
    if (data.content) {
      const mentionRegex = /@(\w+)/g
      const matches = Array.from(data.content.matchAll(mentionRegex))
      const mentionedHandles = matches.map(m => m[1])

      if (mentionedHandles.length > 0) {
        // Find users by handle
        const mentionedUsers = await prisma.user.findMany({
          where: {
            handle: { in: mentionedHandles },
            isActive: true,
          },
          select: { id: true },
        })

        // Create notifications for mentioned users
        const notifications = mentionedUsers
          .filter(user => user.id !== session.user.id) // Don't notify yourself
          .map(user => ({
            userId: user.id,
            type: "MENTION" as const,
            title: "You were mentioned",
            message: `${session.user.name || "Someone"} mentioned you in a post`,
            link: `/feed`,
          }))

        if (notifications.length > 0) {
          await prisma.notification.createMany({
            data: notifications,
          })
        }
      }
    }

    // Also handle explicit mentions array if provided
    if (data.mentions && Array.isArray(data.mentions) && data.mentions.length > 0) {
      const mentionedUserIds = data.mentions.filter(id => id !== session.user.id)
      if (mentionedUserIds.length > 0) {
        const notifications = mentionedUserIds.map(userId => ({
          userId,
          type: "MENTION" as const,
          title: "You were mentioned",
          message: `${session.user.name || "Someone"} mentioned you in a post`,
          link: `/feed`,
        }))

        await prisma.notification.createMany({
          data: notifications,
        })
      }
    }

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

