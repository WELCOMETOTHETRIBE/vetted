import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ClearDShell } from "@/components/layout/cleard-shell"
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

  const viewer = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    accountType: session.user.accountType,
  }

  return (
    <Suspense
      fallback={
        <ClearDShell viewer={viewer}>
          <div className="max-w-5xl mx-auto py-8">
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
              <span className="text-muted-foreground">Loading…</span>
            </div>
          </div>
        </ClearDShell>
      }
    >
      <JobApplyContent viewer={viewer} />
    </Suspense>
  )
}
