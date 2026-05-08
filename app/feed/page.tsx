import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
import FeedContent from "@/components/FeedContent"
import TechTrends from "@/components/TechTrends"
import { Card, CardContent } from "@/components/ui/card"

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
      groupId: null,
    },
    include: {
      author: {
        select: { id: true, name: true, image: true, handle: true },
      },
      reactions: {
        select: { id: true, userId: true, type: true },
      },
      comments: {
        where: { isActive: true },
        select: { id: true },
      },
      reposts: { select: { id: true } },
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
      {/*
       * Two-column desktop layout: feed (max-w-2xl) | right rail (w-80).
       * The legacy in-page secondary `Sidebar` was folded into ClearDSidebar
       * (see components/layout/cleard-sidebar.tsx Resources group) per brief
       * LP #8. This drops the dual-sidebar pattern that previously consumed
       * 32rem of horizontal space on lg+ viewports.
       */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <main className="flex-1 w-full max-w-2xl mx-auto lg:mx-0">
          <FeedContent initialPosts={posts} userId={session.user.id} />
        </main>
        <aside className="w-full lg:w-80 space-y-4">
          <div className="lg:sticky lg:top-20">
            <div className="hidden lg:block">
              <TechTrends />
            </div>
            <div className="lg:hidden">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-sm font-semibold text-foreground mb-1">
                    Mission brief
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Keep updates professional and security-conscious. Avoid
                    posting classified or sensitive details.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </aside>
      </div>
    </ClearDShell>
  )
}
