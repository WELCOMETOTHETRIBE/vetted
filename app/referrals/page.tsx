import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ReferralSystem from "@/components/ReferralSystem"

interface LeaderboardEntry {
  userId: string
  userName: string
  userImage: string | null
  totalReferrals: number
  hiredReferrals: number
  hireRate: number
  totalRewards: number
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/referrals?type=leaderboard&limit=20`, {
      cache: "no-store",
    })
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.leaderboard || []
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return []
  }
}

export default async function ReferralsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const leaderboard = await getLeaderboard()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Referral Network</h1>
          <p className="text-gray-600 mt-2">
            Refer candidates from your network and earn rewards for successful hires
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Referral System */}
          <div className="lg:col-span-2">
            <ReferralSystem />
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Leaderboard</h2>
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No referrals yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`p-3 rounded-lg border ${
                        index === 0
                          ? "bg-yellow-50 border-yellow-200"
                          : index === 1
                            ? "bg-gray-50 border-gray-200"
                            : index === 2
                              ? "bg-orange-50 border-orange-200"
                              : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {index < 3 && (
                            <span className="text-2xl">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          )}
                          {index >= 3 && (
                            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {entry.userImage && (
                              <img
                                src={entry.userImage}
                                alt={entry.userName}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <p className="font-semibold text-gray-900 truncate">
                              {entry.userName}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>{entry.hiredReferrals} hired</span>
                            <span>{entry.totalReferrals} total</span>
                            {entry.totalRewards > 0 && (
                              <span className="text-green-600 font-semibold">
                                ${entry.totalRewards.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

