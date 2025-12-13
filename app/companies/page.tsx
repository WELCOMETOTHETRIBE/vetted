import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import CompaniesContent from "@/components/CompaniesContent"

async function getCompanies() {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          employees: true,
          jobs: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return companies
}

export default async function CompaniesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const companies = await getCompanies()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Companies</h1>
        <CompaniesContent initialCompanies={companies} />
      </div>
    </div>
  )
}

