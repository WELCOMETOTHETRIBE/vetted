import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import NetworkContent from "@/components/NetworkContent"

async function getNetworkData(userId: string) {
  const [connections, pendingReceived, pendingSent] = await Promise.all([
    // Accepted connections
    prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
      },
    }),
    // Pending requests received
    prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
      },
    }),
    // Pending requests sent
    prisma.connection.findMany({
      where: {
        requesterId: userId,
        status: "PENDING",
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
      },
    }),
  ])

  return { connections, pendingReceived, pendingSent }
}

export default async function NetworkPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const networkData = await getNetworkData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Network</h1>
        <NetworkContent
          initialData={networkData}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
}

