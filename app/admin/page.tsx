import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import AdminContent from "@/components/AdminContent"
import PopulateJobsButton from "@/components/PopulateJobsButton"
import AshbyScraperButton from "@/components/AshbyScraperButton"
import MigrateButton from "@/components/MigrateButton"
import SetupGroupsButton from "@/components/SetupGroupsButton"
import LinkedInScraperButton from "@/components/LinkedInScraperButton"
import LinkedInUrlsList from "@/components/LinkedInUrlsList"
import Link from "next/link"

async function getAdminData() {
  const [users, posts, jobs, candidates, linkedInUrls, linkedInUrlsTotal] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
    <div className="min-h-screen bg-neutral-50">
      <NavbarAdvanced />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <div className="flex gap-3 flex-wrap">
            <MigrateButton />
            <PopulateJobsButton />
            <AshbyScraperButton />
            <LinkedInScraperButton />
            <Link
              href="/candidates"
              className="px-5 py-2.5 bg-primary-700 text-white rounded-xl hover:bg-primary-800 font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              View Candidates
            </Link>
          </div>
        </div>
        <SetupGroupsButton />
        <AdminContent initialData={adminData} />
        
        <div className="mt-8">
          <LinkedInUrlsList 
            initialUrls={adminData.linkedInUrls as any}
            initialTotal={adminData.linkedInUrlsTotal}
          />
        </div>
      </div>
    </div>
  )
}

