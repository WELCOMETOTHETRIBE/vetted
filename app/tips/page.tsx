import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import TipsContent from "@/components/TipsContent"

export default async function TipsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

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
          title="Tips & Tricks"
          description="Practical playbooks for profile, networking, jobs, and personal brand."
        />
        <TipsContent />
      </div>
    </ClearDShell>
  )
}
