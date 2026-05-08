import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Briefcase, GraduationCap, MapPin, Heart, MessageCircle } from "lucide-react"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ProfileHeader from "@/components/ProfileHeader"
import ProfileSectionCard from "@/components/ProfileSectionCard"
import CareerInsights from "@/components/CareerInsights"

async function getProfile(userIdOrHandle: string, currentUserId?: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: userIdOrHandle }, { handle: userIdOrHandle }] },
      include: {
        profile: true,
        experiences: { include: { company: true }, orderBy: { startDate: "desc" } },
        educations: { orderBy: { startDate: "desc" } },
        skills: { include: { skill: true } },
        posts: {
          where: { isActive: true, groupId: null },
          include: {
            reactions: { select: { id: true } },
            comments: { select: { id: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!user) return null

    let connectionStatus: "CONNECTED" | "PENDING" | "NONE" = "NONE"
    if (currentUserId && currentUserId !== user.id) {
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { requesterId: currentUserId, receiverId: user.id },
            { requesterId: user.id, receiverId: currentUserId },
          ],
        },
        orderBy: { updatedAt: "desc" },
      })

      if (connection) {
        if (connection.status === "ACCEPTED") connectionStatus = "CONNECTED"
        else if (connection.status === "PENDING") connectionStatus = "PENDING"
        else connectionStatus = "NONE"
      }
    }

    return { user, connectionStatus }
  } catch (error) {
    const e = error as { message?: string; code?: string }
    console.error("Error fetching profile:", e)
    if (
      e.message?.includes("column") ||
      e.message?.includes("Unknown column") ||
      e.code === "P2021"
    ) {
      throw error
    }
    return null
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
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

    const profileData = await getProfile(id, session.user.id)

    if (!profileData) {
      return (
        <ClearDShell viewer={viewer}>
          <div className="max-w-4xl mx-auto py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Profile not found.</p>
              </CardContent>
            </Card>
          </div>
        </ClearDShell>
      )
    }

    const { user, connectionStatus } = profileData
    const isOwnProfile = user.id === session.user.id

    return (
      <ClearDShell viewer={viewer}>
        <div className="max-w-5xl mx-auto">
          <ProfileHeader
            profile={{
              user: {
                id: user.id,
                name: user.name,
                image: user.image,
                handle: user.handle,
                email: user.email,
              },
              headline: user.profile?.headline || null,
              location: user.profile?.location || null,
              about: user.profile?.about || null,
              bannerImage: user.profile?.bannerImage || null,
            }}
            isOwnProfile={isOwnProfile}
            connectionStatus={isOwnProfile ? undefined : connectionStatus}
            onConnect={undefined}
            userId={user.id}
          />

          <ProfileSectionCard title="Mission & Program Experience">
            {user.experiences.length > 0 ? (
              <div className="space-y-6">
                {user.experiences.map(
                  (exp: {
                    id: string
                    title: string
                    companyName?: string | null
                    description?: string | null
                    location?: string | null
                    startDate: Date | string
                    endDate?: Date | string | null
                    isCurrent?: boolean
                    company?: { name?: string | null } | null
                  }) => (
                    <div
                      key={exp.id}
                      className="flex gap-4 pb-6 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 w-11 h-11 rounded-md bg-primary/15 text-primary flex items-center justify-center font-semibold border border-border">
                        {exp.company?.name?.charAt(0) ||
                          exp.companyName?.charAt(0) || (
                            <Briefcase className="h-5 w-5" aria-hidden />
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">
                          {exp.title}
                        </h4>
                        <p className="text-primary text-sm font-medium mb-1">
                          {exp.company?.name || exp.companyName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
                          <span>
                            {new Date(exp.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            –{" "}
                            {exp.isCurrent
                              ? "Present"
                              : exp.endDate
                              ? new Date(exp.endDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Present"}
                          </span>
                          {exp.location && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" aria-hidden />
                                {exp.location}
                              </span>
                            </>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No mission &amp; program experience added yet.
              </div>
            )}
          </ProfileSectionCard>

          <ProfileSectionCard title="Education">
            {user.educations.length > 0 ? (
              <div className="space-y-6">
                {user.educations.map(
                  (edu: {
                    id: string
                    school: string
                    degree?: string | null
                    fieldOfStudy?: string | null
                    startDate?: Date | string | null
                    endDate?: Date | string | null
                  }) => (
                    <div
                      key={edu.id}
                      className="flex gap-4 pb-6 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 w-11 h-11 rounded-md bg-secondary text-primary flex items-center justify-center border border-border">
                        <GraduationCap className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">
                          {edu.school}
                        </h4>
                        {edu.degree && (
                          <p className="text-foreground/90 text-sm font-medium mb-1">
                            {edu.degree}
                            {edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}
                          </p>
                        )}
                        {edu.startDate && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(edu.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            –{" "}
                            {edu.endDate
                              ? new Date(edu.endDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Present"}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No education added yet.
              </div>
            )}
          </ProfileSectionCard>

          <ProfileSectionCard title="Validated Capabilities">
            {user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map(
                  (userSkill: { id: string; skill: { name: string } }) => (
                    <Badge
                      key={userSkill.id}
                      variant="outline"
                      className="text-primary border-primary/30"
                    >
                      {userSkill.skill.name}
                    </Badge>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No validated capabilities added yet.
              </div>
            )}
          </ProfileSectionCard>

          {isOwnProfile && (
            <div className="mb-4">
              <CareerInsights />
            </div>
          )}

          <ProfileSectionCard title="Recent Activity">
            {user.posts.length > 0 ? (
              <div className="space-y-5">
                {user.posts.map(
                  (post: {
                    id: string
                    content: string
                    createdAt: Date | string
                    reactions: { id: string }[]
                    comments: { id: string }[]
                  }) => (
                    <div
                      key={post.id}
                      className="pb-5 border-b border-border last:border-0"
                    >
                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" aria-hidden />
                          {post.reactions.length}{" "}
                          {post.reactions.length === 1 ? "like" : "likes"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" aria-hidden />
                          {post.comments.length}{" "}
                          {post.comments.length === 1 ? "comment" : "comments"}
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year:
                              new Date(post.createdAt).getFullYear() !==
                              new Date().getFullYear()
                                ? "numeric"
                                : undefined,
                          })}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No recent activity.
              </div>
            )}
          </ProfileSectionCard>
        </div>
      </ClearDShell>
    )
  } catch (error) {
    const e = error as { message?: string; code?: string }
    console.error("Profile page error:", e)
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
            <AlertTitle>Error Loading Profile</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                {e.message?.includes("column") ||
                e.message?.includes("Unknown column") ||
                e.code === "P2021"
                  ? "Database schema needs to be updated. Please run the migration."
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
