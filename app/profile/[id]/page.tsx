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
    })

    if (connection) {
      connectionStatus =
        connection.status === "ACCEPTED"
          ? "CONNECTED"
          : connection.status === "PENDING"
          ? "PENDING"
          : "NONE"
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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
        {user.experiences.length > 0 && (
          <ProfileSectionCard title="Experience">
            <div className="space-y-4">
              {user.experiences.map((exp: any) => (
                <div key={exp.id} className="border-l-2 border-blue-600 pl-4">
                  <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                  <p className="text-blue-600">
                    {exp.company?.name || exp.companyName}
                  </p>
                  <p className="text-sm text-gray-600">
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
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </ProfileSectionCard>
        )}

        {/* Education Section */}
        {user.educations.length > 0 && (
          <ProfileSectionCard title="Education">
            <div className="space-y-4">
              {user.educations.map((edu: any) => (
                <div key={edu.id} className="border-l-2 border-green-600 pl-4">
                  <h4 className="font-semibold text-gray-900">{edu.school}</h4>
                  {edu.degree && (
                    <p className="text-gray-700">
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
              ))}
            </div>
          </ProfileSectionCard>
        )}

        {/* Skills Section */}
        {user.skills.length > 0 && (
          <ProfileSectionCard title="Skills">
            <div className="flex flex-wrap gap-2">
              {user.skills.map((userSkill: any) => (
                <span
                  key={userSkill.id}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {userSkill.skill.name}
                </span>
              ))}
            </div>
          </ProfileSectionCard>
        )}

        {/* Recent Activity */}
        {user.posts.length > 0 && (
          <ProfileSectionCard title="Recent Activity">
            <div className="space-y-4">
              {user.posts.map((post: any) => (
                <div key={post.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <p className="text-gray-700">{post.content}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>
                      {post.reactions.length} likes
                    </span>
                    <span>{post.comments.length} comments</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ProfileSectionCard>
        )}
      </div>
    </div>
  )
}

