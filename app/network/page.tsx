import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import NetworkContent from "@/components/NetworkContent"

async function getNetworkData(userId: string) {
  const [connections, pendingReceived, pendingSent] = await Promise.all([
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
            profile: { select: { headline: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: { select: { headline: true } },
          },
        },
      },
    }),
    prisma.connection.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: { select: { headline: true } },
          },
        },
      },
    }),
    prisma.connection.findMany({
      where: { requesterId: userId, status: "PENDING" },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: { select: { headline: true } },
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
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        accountType: session.user.accountType,
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Trusted Network"
          description="Mission-aligned connections, pending requests, and AI-assisted suggestions."
        />
        <NetworkContent
          initialData={networkData as any}
          currentUserId={session.user.id}
        />
      </div>
    </ClearDShell>
  )
}
