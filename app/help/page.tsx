import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import HelpContent from "@/components/HelpContent"

export default async function HelpPage() {
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
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Help Center"
          description="Guides for getting started, optimizing your profile, and using clearD’s AI features."
        />
        <HelpContent />
      </div>
    </ClearDShell>
  )
}
