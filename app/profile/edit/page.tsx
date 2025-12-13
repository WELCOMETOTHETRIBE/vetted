import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import ProfileEditForm from "@/components/ProfileEditForm"

async function getProfileData(userId: string) {
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
}

export default async function ProfileEditPage() {
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
        <ProfileEditForm user={user} />
      </div>
    </div>
  )
}


