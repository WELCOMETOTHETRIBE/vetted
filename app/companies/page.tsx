import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import CompaniesContent from "@/components/CompaniesContent"

async function getCompanies() {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { employees: true, jobs: true, posts: true } },
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
          title="Companies"
          description="Cleared employers and partner contractors hiring across the suite."
        />
        <CompaniesContent initialCompanies={companies} />
      </div>
    </ClearDShell>
  )
}
