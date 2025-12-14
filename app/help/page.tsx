import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import NavbarAdvanced from "@/components/NavbarAdvanced"
import HelpContent from "@/components/HelpContent"

export default async function HelpPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdvanced />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Help Center</h1>
        <HelpContent />
      </div>
    </div>
  )
}

