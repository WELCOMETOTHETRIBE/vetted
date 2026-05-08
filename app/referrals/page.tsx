import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Trophy } from "lucide-react"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import ReferralSystem from "@/components/ReferralSystem"
import { getReferralLeaderboard } from "@/lib/referrals/referral-system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

async function getLeaderboard() {
  try {
    return await getReferralLeaderboard(20)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Error fetching leaderboard:", msg)
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
          title="Referral Network"
          description="Refer candidates from your network and earn rewards for successful hires."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReferralSystem />
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="pb-3">
                <CardTitle className="inline-flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-primary" aria-hidden />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    No referrals yet. Be the first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.userId}
                        className={cn(
                          "p-3 rounded-md border",
                          index === 0
                            ? "border-primary/40 bg-primary/5"
                            : "border-border",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-7 text-center">
                            <span
                              className={cn(
                                "text-sm font-mono font-semibold",
                                index === 0 && "text-primary",
                                index === 1 && "text-foreground",
                                index === 2 && "text-warning",
                                index >= 3 && "text-muted-foreground",
                              )}
                            >
                              #{index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {entry.userImage && (
                                <img
                                  src={entry.userImage}
                                  alt={entry.userName}
                                  className="w-7 h-7 rounded-full border border-border"
                                />
                              )}
                              <p className="font-medium text-foreground truncate text-sm">
                                {entry.userName}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span>{entry.hiredReferrals} hired</span>
                              <span>{entry.totalReferrals} total</span>
                              {entry.totalRewards > 0 && (
                                <Badge variant="outline" className="text-success border-success/40">
                                  ${entry.totalRewards.toFixed(0)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClearDShell>
  )
}
