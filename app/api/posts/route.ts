import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { detectSpam, recommendContent } from "@/lib/ai/content-ai"

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

    // Check for spam (non-blocking, log if detected)
    detectSpam(data.content)
      .then((spamResult) => {
        if (spamResult.isSpam && spamResult.confidence > 70) {
          console.warn("Potential spam detected:", {
            userId: session.user.id,
            content: data.content.substring(0, 100),
            confidence: spamResult.confidence,
            reason: spamResult.reason,
            category: spamResult.category,
          })
          // In production, you might want to flag or reject the post
          // For now, we'll just log it
        }
      })
      .catch((error) => {
        console.error("Error checking spam (non-blocking):", error)
      })

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
          .filter((user: { id: string }) => user.id !== session.user.id) // Don't notify yourself
          .map((user: { id: string }) => ({
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
      const mentionedUserIds = data.mentions.filter((id: string) => id !== session.user.id)
      if (mentionedUserIds.length > 0) {
        const notifications = mentionedUserIds.map((userId: string) => ({
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
    const personalized = searchParams.get("personalized") === "true" // Optional AI personalization

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
      take: personalized ? 50 : 20, // Get more posts for AI ranking
    })

    // Apply AI personalization if requested
    if (personalized && posts.length > 0) {
      try {
        // Get user interests
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: session.user.id },
          select: { headline: true, about: true },
        })

        const userSkills = await prisma.userSkill.findMany({
          where: { userId: session.user.id },
          include: { skill: { select: { name: true } } },
          take: 10,
        })

        const interests: string[] = []
        if (userProfile?.headline) interests.push(userProfile.headline)
        userSkills.forEach((us: { skill: { name: string } }) => {
          if (us.skill.name) interests.push(us.skill.name)
        })

        // Get recommendations
        const recommendations = await recommendContent(
          session.user.id,
          posts.map((p: {
            id: string
            content: string
            authorId: string
            createdAt: Date
            reactions: Array<{ userId: string }>
            comments: Array<{ id: string }>
          }) => ({
            id: p.id,
            content: p.content,
            authorId: p.authorId,
            createdAt: p.createdAt,
            reactions: p.reactions,
            comments: p.comments,
          })),
          interests
        )

        // Sort posts by recommendation score
        const sortedPosts = recommendations
          .slice(0, 20) // Top 20
          .map((rec) => posts.find((p: { id: string }) => p.id === rec.postId))
          .filter((p): p is NonNullable<typeof p> => p !== null)

        return NextResponse.json(sortedPosts)
      } catch (error) {
        console.error("Error applying personalization (falling back to chronological):", error)
        // Fall through to return chronological posts
      }
    }

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

