import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import TipsContent from "@/components/TipsContent"

export default async function TipsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tips & Tricks</h1>
        <TipsContent />
      </div>
    </div>
  )
}

