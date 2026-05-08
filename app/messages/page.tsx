import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import MessagesContent from "@/components/MessagesContent"

async function getThreads(userId: string) {
  const threads = await prisma.messageThread.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: { id: true, name: true, image: true, handle: true } },
      user2: { select: { id: true, name: true, image: true, handle: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return threads
}

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const threads = await getThreads(session.user.id)

  return (
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        accountType: session.user.accountType,
      }}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="Messages"
          description="Direct mission and engagement conversations across your trusted network."
        />
        <MessagesContent
          initialThreads={threads as any}
          currentUserId={session.user.id}
        />
      </div>
    </ClearDShell>
  )
}
