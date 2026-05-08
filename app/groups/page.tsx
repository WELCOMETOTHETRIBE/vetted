import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import GroupsContent from "@/components/GroupsContent"

async function getGroups(userId: string) {
  const [allGroups, myGroups] = await Promise.all([
    prisma.group.findMany({
      where: { isActive: true, isPublic: true },
      include: {
        owner: { select: { id: true, name: true } },
        memberships: { where: { userId }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.groupMembership.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ])

  return { allGroups, myGroups }
}

export default async function GroupsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const groupsData = await getGroups(session.user.id)

  return (
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        accountType: session.user.accountType,
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Groups"
          description="Communities of cleared professionals around skills, missions, and clients."
        />
        <GroupsContent
          initialData={groupsData as any}
          currentUserId={session.user.id}
        />
      </div>
    </ClearDShell>
  )
}
