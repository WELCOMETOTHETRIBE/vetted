import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ProfileEditForm from "@/components/ProfileEditForm"
import ResumeProfileUpload from "@/components/ResumeProfileUpload"

async function getProfileData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        experiences: { include: { company: true }, orderBy: { startDate: "desc" } },
        educations: { orderBy: { startDate: "desc" } },
        skills: { include: { skill: true } },
      },
    })
    return user
  } catch (error) {
    const e = error as { message?: string; code?: string }
    console.error("Error fetching profile data:", e)
    if (
      e.message?.includes("column") ||
      e.message?.includes("Unknown column") ||
      e.code === "P2021" ||
      e.code === "P2022"
    ) {
      throw error
    }
    return null
  }
}

export default async function ProfileEditPage() {
  try {
    const session = await auth()
    if (!session?.user) {
      redirect("/auth/signin")
    }

    const viewer = {
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      accountType: session.user.accountType,
    }

    const user = await getProfileData(session.user.id)

    if (!user) {
      redirect("/auth/signin")
    }

    return (
      <ClearDShell viewer={viewer}>
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            title="Edit Cleared Mission Profile"
            description="Maintain clearance continuity, mission readiness, and validated capabilities."
          />
          <ResumeProfileUpload />
          <ProfileEditForm user={user as any} />
        </div>
      </ClearDShell>
    )
  } catch (error) {
    const e = error as { message?: string; code?: string }
    console.error("Profile edit page error:", e)
    return (
      <ClearDShell
        viewer={{
          name: null,
          email: "",
          role: "USER",
          accountType: "CANDIDATE",
        }}
      >
        <div className="max-w-4xl mx-auto py-8">
          <Alert variant="warning">
            <AlertTitle>Database Migration Required</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                {e.message?.includes("column") ||
                e.message?.includes("Unknown column") ||
                e.code === "P2021" ||
                e.code === "P2022"
                  ? "The database schema needs to be updated to include the new profile fields. Please run the migration."
                  : "An error occurred while loading the profile. Please try again."}
              </p>
              <Link
                href="/feed"
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                ← Back to Feed
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      </ClearDShell>
    )
  }
}
