import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import Sidebar from "@/components/Sidebar"
import FeedContent from "@/components/FeedContent"
import TechTrends from "@/components/TechTrends"

async function getFeed(userId: string) {
  // Get user's connections
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: userId, status: "ACCEPTED" },
        { receiverId: userId, status: "ACCEPTED" },
      ],
    },
    select: {
      requesterId: true,
      receiverId: true,
    },
  })

  const connectedUserIds = new Set<string>([userId])
  connections.forEach((conn: { requesterId: string; receiverId: string }) => {
    connectedUserIds.add(conn.requesterId)
    connectedUserIds.add(conn.receiverId)
  })

  // Get posts from connections and self
  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: Array.from(connectedUserIds) },
      isActive: true,
      groupId: null, // Only main feed posts, not group posts
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

  return posts
}

export default async function FeedPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const posts = await getFeed(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <Sidebar className="hidden lg:block" />
          <main className="flex-1 max-w-2xl">
            <FeedContent initialPosts={posts} userId={session.user.id} />
          </main>
          <aside className="hidden lg:block w-80 space-y-4">
            <TechTrends />
          </aside>
        </div>
      </div>
    </div>
  )
}
