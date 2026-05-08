import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PostComposer from "@/components/PostComposer"
import PostCard from "@/components/PostCard"

async function getGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: { select: { id: true, name: true } },
      memberships: { where: { userId } },
      groupPosts: {
        include: {
          author: { select: { id: true, name: true, image: true, handle: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      posts: {
        where: { isActive: true },
        include: {
          author: { select: { id: true, name: true, image: true, handle: true } },
          reactions: { select: { id: true, userId: true, type: true } },
          comments: { where: { isActive: true }, select: { id: true } },
          reposts: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: { memberships: true, posts: true, groupPosts: true },
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

  const viewer = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    accountType: session.user.accountType,
  }

  const group = await getGroup(id, session.user.id)

  if (!group) {
    return (
      <ClearDShell viewer={viewer}>
        <div className="max-w-4xl mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Group not found.</p>
            </CardContent>
          </Card>
        </div>
      </ClearDShell>
    )
  }

  const isMember = group.memberships.length > 0

  return (
    <ClearDShell viewer={viewer}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {group.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>Created by {group.owner.name}</span>
              {group._count && (
                <>
                  <span>•</span>
                  <span>
                    {group._count.memberships} member
                    {group._count.memberships !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span>
                    {group._count.posts + group._count.groupPosts} post
                    {group._count.posts + group._count.groupPosts !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

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

              {group.groupPosts && group.groupPosts.length > 0 && (
                <>
                  {group.groupPosts.map(
                    (post: {
                      id: string
                      content: string
                      createdAt: Date | string
                      author: {
                        id: string
                        name: string | null
                        image: string | null
                        handle: string | null
                      }
                    }) => (
                      <Card key={post.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold border border-border overflow-hidden">
                              {post.author.image ? (
                                <Image
                                  src={post.author.image}
                                  alt={post.author.name || "User"}
                                  width={40}
                                  height={40}
                                  className="w-full h-full rounded-full"
                                />
                              ) : (
                                post.author.name?.charAt(0).toUpperCase() || "U"
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {post.author.name || "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {post.content}
                          </p>
                        </CardContent>
                      </Card>
                    ),
                  )}
                </>
              )}

              {(!group.posts || group.posts.length === 0) &&
                (!group.groupPosts || group.groupPosts.length === 0) && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        No posts yet. Be the first to post!
                      </p>
                    </CardContent>
                  </Card>
                )}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-muted-foreground">
                You must be a member to view posts.
              </p>
              <Button asChild>
                <a href={`/api/groups/${group.id}/join`}>Join Group</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ClearDShell>
  )
}
