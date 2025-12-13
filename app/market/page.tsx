import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import MarketIntelligence from "@/components/MarketIntelligence"
import SkillsGapAnalysis from "@/components/SkillsGapAnalysis"

export default async function MarketPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-gray-600 mt-2">
            Real-time insights into salary trends, skill demand, competitor analysis, supply/demand
            ratios, and skills gap analysis
          </p>
        </div>
        <div className="space-y-6">
          <MarketIntelligence />
          <SkillsGapAnalysis />
        </div>
      </div>
    </div>
  )
}

