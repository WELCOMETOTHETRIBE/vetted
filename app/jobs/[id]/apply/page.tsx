import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import JobApplyContent from "./JobApplyContent"

export default async function JobApplyPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, accountType: true },
  })

  const canAccessJobs = user?.role === "ADMIN" || user?.accountType !== "EMPLOYER"
  if (!canAccessJobs) {
    redirect("/feed")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <Suspense fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      }>
        <JobApplyContent />
      </Suspense>
    </div>
  )
}

