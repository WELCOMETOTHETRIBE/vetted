import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import MessagesContent from "@/components/MessagesContent"

async function getThreads(userId: string) {
  const threads = await prisma.messageThread.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          image: true,
          handle: true,
        },
      },
      user2: {
        select: {
          id: true,
          name: true,
          image: true,
          handle: true,
        },
      },
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        <MessagesContent initialThreads={threads} currentUserId={session.user.id} />
      </div>
    </div>
  )
}

