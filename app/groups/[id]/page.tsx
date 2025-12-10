import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import PostComposer from "@/components/PostComposer"
import PostCard from "@/components/PostCard"

async function getGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      memberships: {
        where: { userId },
      },
      groupPosts: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              handle: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return group
}

export default async function GroupPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const group = await getGroup(params.id, session.user.id)

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Group not found</p>
          </div>
        </div>
      </div>
    )
  }

  const isMember = group.memberships.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-gray-700 mb-4">{group.description}</p>
          )}
          <p className="text-sm text-gray-600">
            Created by {group.owner.name}
          </p>
        </div>

        {isMember ? (
          <>
            <PostComposer
              onSubmit={async (content, imageUrl) => {
                "use server"
                if (!session?.user) return

                await prisma.groupPost.create({
                  data: {
                    groupId: group.id,
                    authorId: session.user.id,
                    content,
                    imageUrl,
                  },
                })
              }}
            />
            <div className="space-y-4">
              {group.groupPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                      {post.author.image ? (
                        <img
                          src={post.author.image}
                          alt={post.author.name || "User"}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        post.author.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {post.author.name || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{post.content}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">You must be a member to view posts.</p>
            <a
              href={`/api/groups/${group.id}/join`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Join Group
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

