import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NavbarAdvanced from "@/components/NavbarAdvanced"
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
      posts: {
        where: { isActive: true },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              handle: true,
            },
          },
          reactions: {
            select: {
              id: true,
              userId: true,
              type: true,
            },
          },
          comments: {
            where: { isActive: true },
            select: { id: true },
          },
          reposts: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: {
          memberships: true,
          posts: true,
          groupPosts: true,
        },
      },
    },
  })

  return group
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const group = await getGroup(id, session.user.id)

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarAdvanced />
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
      <NavbarAdvanced />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-gray-700 mb-4">{group.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Created by {group.owner.name}</span>
            {group._count && (
              <>
                <span>•</span>
                <span>{group._count.memberships} member{group._count.memberships !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>{group._count.posts + group._count.groupPosts} post{(group._count.posts + group._count.groupPosts) !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>
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
              {/* Show regular posts (includes candidate/job summaries) */}
              {group.posts && group.posts.length > 0 && (
                <>
                  {group.posts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={session.user.id}
                      onLike={async () => {}}
                      onComment={async () => {}}
                      onRepost={async () => {}}
                    />
                  ))}
                </>
              )}
              
              {/* Show group-specific posts */}
              {group.groupPosts && group.groupPosts.length > 0 && (
                <>
                  {group.groupPosts.map((post: any) => (
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
                      <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  ))}
                </>
              )}
              
              {(!group.posts || group.posts.length === 0) && (!group.groupPosts || group.groupPosts.length === 0) && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">No posts yet. Be the first to post!</p>
                </div>
              )}
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

