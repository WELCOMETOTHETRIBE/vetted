import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
import OperatorConsole from "@/components/admin/OperatorConsole"

async function getAdminData() {
  const [users, posts, jobs, candidates, linkedInUrls, linkedInUrlsTotal] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.post.findMany({
      where: { isActive: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.job.findMany({
      where: { isActive: true },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.candidate.findMany({
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        currentCompany: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.linkedInProfileUrl.findMany({
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []), // Return empty array if table doesn't exist
    prisma.linkedInProfileUrl.count().catch(() => 0), // Return 0 if table doesn't exist
  ])

  return { users, posts, jobs, candidates, linkedInUrls, linkedInUrlsTotal }
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "ADMIN") {
    redirect("/feed")
  }

  const adminData = await getAdminData()

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
       * Per the brief: do NOT redesign Operator Console internals. We only
       * swap the outer chrome (NavbarAdvanced → ClearDShell). The console
       * picks up the new copper tokens through the bg-card / text-foreground
       * cascade automatically.
       */}
      <OperatorConsole initialData={adminData as any} />
    </ClearDShell>
  )
}

