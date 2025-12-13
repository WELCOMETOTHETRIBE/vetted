import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import GroupsContent from "@/components/GroupsContent"

async function getGroups(userId: string) {
  const [allGroups, myGroups] = await Promise.all([
    prisma.group.findMany({
      where: { isActive: true, isPublic: true },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        memberships: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.groupMembership.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Groups</h1>
        <GroupsContent initialData={groupsData} currentUserId={session.user.id} />
      </div>
    </div>
  )
}


