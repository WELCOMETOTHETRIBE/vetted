import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import ProfileEditForm from "@/components/ProfileEditForm"
import ResumeProfileUpload from "@/components/ResumeProfileUpload"

async function getProfileData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        experiences: {
          include: { company: true },
          orderBy: { startDate: "desc" },
        },
        educations: {
          orderBy: { startDate: "desc" },
        },
        skills: {
          include: { skill: true },
        },
      },
    })

    return user
  } catch (error: any) {
    console.error("Error fetching profile data:", error)
    // If it's a database schema error, throw it so we can show helpful message
    if (error.message?.includes("column") || error.message?.includes("Unknown column") || error.code === "P2021" || error.code === "P2022") {
      throw error
    }
    // For other errors, return null
    return null
  }
}

export default async function ProfileEditPage() {
  try {
    const session = await auth()
    if (!session?.user) {
      redirect("/auth/signin")
    }

    const user = await getProfileData(session.user.id)

    if (!user) {
      redirect("/auth/signin")
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
        <div className="mb-6">
          <ResumeProfileUpload />
        </div>
        <ProfileEditForm user={user} />
      </div>
    </div>
    )
  } catch (error: any) {
    console.error("Profile edit page error:", error)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Database Migration Required</h2>
            <p className="text-yellow-800 mb-4">
              {error.message?.includes("column") || error.message?.includes("Unknown column") || error.code === "P2021" || error.code === "P2022"
                ? "The database schema needs to be updated to include the new profile fields. Please run the migration."
                : "An error occurred while loading the profile. Please try again."}
            </p>
            {(error.message?.includes("column") || error.code === "P2021" || error.code === "P2022") && (
              <div className="bg-white rounded p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">Run this command or use the admin migration button:</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  npx prisma db push
                </code>
              </div>
            )}
            <a
              href="/feed"
              className="text-blue-600 hover:underline"
            >
              ← Back to Feed
            </a>
          </div>
        </div>
      </div>
    )
  }
}


