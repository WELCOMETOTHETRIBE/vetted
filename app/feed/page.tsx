import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
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
    redirect("/auth/signin?redirect_url=%2Ffeed")
  }

  const posts = await getFeed(session.user.id)

  return (
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        accountType: session.user.accountType,
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/*
         * The legacy `Sidebar` component is the in-page secondary nav (Groups
         * / Companies / Referrals / Admin quick-links). It is NOT the shell
         * sidebar. Keeping it here preserves the feed's tri-column layout
         * that long-tenured users are used to. Defer its merge into the
         * shell sidebar to a follow-up pass — the brief flagged shell chrome
         * as the priority, not the in-page secondary nav.
         */}
        <Sidebar className="hidden lg:block" />
        <main className="flex-1 w-full max-w-2xl mx-auto lg:mx-0">
          <FeedContent initialPosts={posts} userId={session.user.id} />
        </main>
        <aside className="w-full lg:w-80 space-y-4">
          <div className="lg:sticky lg:top-20">
            <div className="hidden lg:block">
              <TechTrends />
            </div>
            <div className="lg:hidden">
              <div className="rounded-md border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  Mission brief
                </h2>
                <p className="text-sm text-muted-foreground">
                  Keep updates professional and security-conscious. Avoid
                  posting classified or sensitive details.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </ClearDShell>
  )
}
