import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recommendContent } from "@/lib/ai/content-ai"

/**
 * GET /api/posts/recommend
 * Get personalized post recommendations for the current user
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's connections
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

    // Get recent posts from connections
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: Array.from(connectedUserIds) },
        isActive: true,
        groupId: null, // Exclude group posts for now
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
        reactions: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Get more posts to rank
    })

    // Get user interests from profile/skills (if available)
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
    if (userProfile?.headline) {
      interests.push(userProfile.headline)
    }
    userSkills.forEach((us) => {
      if (us.skill.name) interests.push(us.skill.name)
    })

    // Get AI recommendations
    const recommendations = await recommendContent(
      session.user.id,
      posts.map((p) => ({
        id: p.id,
        content: p.content,
        authorId: p.authorId,
        createdAt: p.createdAt,
        reactions: p.reactions,
        comments: p.comments,
      })),
      interests
    )

    // Map recommendations back to full post data
    const recommendedPosts = recommendations
      .slice(0, 20) // Top 20 recommendations
      .map((rec) => {
        const post = posts.find((p) => p.id === rec.postId)
        return post ? { ...post, relevanceScore: rec.relevanceScore, reasoning: rec.reasoning } : null
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    return NextResponse.json({
      posts: recommendedPosts,
      total: recommendedPosts.length,
    })
  } catch (error: any) {
    console.error("Recommend posts error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

