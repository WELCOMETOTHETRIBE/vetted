import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import ProfileHeader from "@/components/ProfileHeader"
import ProfileSectionCard from "@/components/ProfileSectionCard"

async function getProfile(userIdOrHandle: string, currentUserId?: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: userIdOrHandle }, { handle: userIdOrHandle }],
    },
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

  if (!user) {
    return null
  }

  let connectionStatus: "CONNECTED" | "PENDING" | "NONE" = "NONE"
  if (currentUserId && currentUserId !== user.id) {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: user.id },
          { requesterId: user.id, receiverId: currentUserId },
        ],
      },
      orderBy: { updatedAt: "desc" }, // Get the most recent connection if multiple exist
    })

    if (connection) {
      if (connection.status === "ACCEPTED") {
        connectionStatus = "CONNECTED"
      } else if (connection.status === "PENDING") {
        // Check if current user is the requester (sent) or receiver (received)
        const isRequester = connection.requesterId === currentUserId
        connectionStatus = "PENDING" // Show pending for both sent and received
      } else {
        connectionStatus = "NONE"
      }
    }
  }

  return { user, connectionStatus }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const profileData = await getProfile(id, session.user.id)

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Profile not found</p>
          </div>
        </div>
      </div>
    )
  }

  const { user, connectionStatus } = profileData
  const isOwnProfile = user.id === session.user.id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Experience Section */}
        <ProfileSectionCard title="Experience">
          {user.experiences.length > 0 ? (
            <div className="space-y-6">
              {user.experiences.map((exp: any) => (
                <div key={exp.id} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {exp.company?.name?.charAt(0) || exp.companyName?.charAt(0) || "💼"}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{exp.title}</h4>
                    <p className="text-blue-600 font-medium mb-1">
                      {exp.company?.name || exp.companyName}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <span>
                        {new Date(exp.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        -{" "}
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
                          <span>📍 {exp.location}</span>
                        </>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No experience added yet</p>
            </div>
          )}
        </ProfileSectionCard>

        {/* Education Section */}
        <ProfileSectionCard title="Education">
          {user.educations.length > 0 ? (
            <div className="space-y-6">
              {user.educations.map((edu: any) => (
                <div key={edu.id} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      🎓
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{edu.school}</h4>
                    {edu.degree && (
                      <p className="text-gray-700 font-medium mb-1">
                        {edu.degree}
                        {edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}
                      </p>
                    )}
                    {edu.startDate && (
                      <p className="text-sm text-gray-600">
                        {new Date(edu.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        -{" "}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No education added yet</p>
            </div>
          )}
        </ProfileSectionCard>

        {/* Skills Section */}
        <ProfileSectionCard title="Skills & Endorsements">
          {user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {user.skills.map((userSkill: any) => (
                <span
                  key={userSkill.id}
                  className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:border-blue-300 transition-colors shadow-sm"
                >
                  {userSkill.skill.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No skills added yet</p>
            </div>
          )}
        </ProfileSectionCard>

        {/* Recent Activity */}
        <ProfileSectionCard title="Recent Activity">
          {user.posts.length > 0 ? (
            <div className="space-y-5">
              {user.posts.map((post: any) => (
                <div key={post.id} className="pb-5 border-b border-gray-100 last:border-0">
                  <p className="text-gray-700 leading-relaxed mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>👍</span>
                      <span>{post.reactions.length} {post.reactions.length === 1 ? 'like' : 'likes'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>💬</span>
                      <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
                    </span>
                    <span className="text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: new Date(post.createdAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </ProfileSectionCard>
      </div>
    </div>
  )
}

