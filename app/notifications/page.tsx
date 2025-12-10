import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import NotificationsContent from "@/components/NotificationsContent"

async function getNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      // Include connection info for connection request notifications
      // We'll need to parse the message to extract connection ID or user info
    },
  })

  // Get connection requests for connection request notifications
  const connectionRequests = await prisma.connection.findMany({
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
        },
      },
    },
  })

  // Enrich notifications with connection data
  const enrichedNotifications = notifications.map((notification: any) => {
    if (notification.type === "CONNECTION_REQUEST") {
      // Find matching connection request
      const connection = connectionRequests.find(
        (conn: any) => notification.message.includes(conn.requester.name || "")
      )
      return {
        ...notification,
        connectionId: connection?.id,
        requester: connection?.requester,
      }
    }
    return notification
  })

  // Mark as read (but don't mark connection requests as read until they're acted upon)
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
      type: { not: "CONNECTION_REQUEST" }, // Don't auto-mark connection requests as read
    },
    data: { isRead: true },
  })

  return enrichedNotifications
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const notifications = await getNotifications(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>
        <NotificationsContent initialNotifications={notifications} />
      </div>
    </div>
  )
}

