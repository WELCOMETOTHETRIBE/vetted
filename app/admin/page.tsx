import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import AdminContent from "@/components/AdminContent"
import PopulateJobsButton from "@/components/PopulateJobsButton"
import AshbyScraperButton from "@/components/AshbyScraperButton"
import MigrateButton from "@/components/MigrateButton"
import Link from "next/link"

async function getAdminData() {
  const [users, posts, jobs] = await Promise.all([
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
  ])

  return { users, posts, jobs }
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
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <div className="flex gap-3 flex-wrap">
            <MigrateButton />
            <PopulateJobsButton />
            <AshbyScraperButton />
            <Link
              href="/candidates"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              View Candidates
            </Link>
          </div>
        </div>
        <AdminContent initialData={adminData} />
      </div>
    </div>
  )
}

