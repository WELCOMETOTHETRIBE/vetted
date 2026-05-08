import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import NotificationsContent from "@/components/NotificationsContent"

async function getNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const connectionRequests = await prisma.connection.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    include: {
      requester: {
        select: { id: true, name: true, image: true, handle: true },
      },
    },
  })

  const enrichedNotifications = notifications.map((notification: any) => {
    if (notification.type === "CONNECTION_REQUEST") {
      const connection = connectionRequests.find((conn: any) =>
        notification.message.includes(conn.requester.name || ""),
      )
      return {
        ...notification,
        connectionId: connection?.id,
        requester: connection?.requester,
      }
    }
    return notification
  })

  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
      type: { not: "CONNECTION_REQUEST" },
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
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        accountType: session.user.accountType,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Notifications"
          description="Mission alerts, connection activity, and platform updates."
        />
        <NotificationsContent initialNotifications={notifications} />
      </div>
    </ClearDShell>
  )
}
