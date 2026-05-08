"use client"

import { useState } from "react"
import { Sparkles, Loader2, AlertTriangle, Inbox, RefreshCw } from "lucide-react"
import PostComposer from "./PostComposer"
import PostCard from "./PostCard"
import MissionUpdatesPanel from "./MissionUpdatesPanel"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface Post {
  id: string
  content: string
  imageUrl?: string | null
  linkUrl?: string | null
  linkTitle?: string | null
  linkDescription?: string | null
  linkImage?: string | null
  createdAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
    handle: string | null
  }
  reactions: Array<{ id: string; userId: string; type: string }>
  comments: Array<{ id: string }>
  reposts: Array<{ id: string }>
}

interface FeedContentProps {
  initialPosts: Post[]
  userId: string
}

export default function FeedContent({ initialPosts, userId }: FeedContentProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [usePersonalized, setUsePersonalized] = useState(false)
  const [loadingPersonalized, setLoadingPersonalized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePostSubmit = async (content: string, imageUrl?: string) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl }),
      })

      if (response.ok) {
        const newPost = await response.json()
        setPosts([newPost, ...posts])
      }
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LIKE" }),
      })

      if (response.ok) {
        const refresh = await fetch("/api/posts")
        if (refresh.ok) {
          const updatedPosts = await refresh.json()
          setPosts(updatedPosts)
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const refresh = await fetch("/api/posts")
        if (refresh.ok) {
          const updatedPosts = await refresh.json()
          setPosts(updatedPosts)
        }
      }
    } catch (error) {
      console.error("Error creating comment:", error)
    }
  }

  const handleRepost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
      })

      if (response.ok) {
        const refresh = await fetch("/api/posts")
        if (refresh.ok) {
          const updatedPosts = await refresh.json()
          setPosts(updatedPosts)
        }
      }
    } catch (error) {
      console.error("Error reposting:", error)
    }
  }

  const loadPersonalizedFeed = async () => {
    setLoadingPersonalized(true)
    setError(null)
    try {
      const response = await fetch("/api/posts/recommend")
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setUsePersonalized(true)
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to load recommendations")
      }
    } catch (error) {
      console.error("Error loading personalized feed:", error)
      setError("Couldn’t load recommendations. Please try again.")
    } finally {
      setLoadingPersonalized(false)
    }
  }

  const loadChronologicalFeed = async () => {
    setLoadingPersonalized(true)
    setError(null)
    try {
      const response = await fetch("/api/posts")
      if (response.ok) {
        const updatedPosts = await response.json()
        setPosts(updatedPosts)
        setUsePersonalized(false)
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to load feed")
      }
    } catch (error) {
      console.error("Error loading feed:", error)
      setError("Couldn’t load the feed. Please try again.")
    } finally {
      setLoadingPersonalized(false)
    }
  }

  const toggleAction = (
    <div className="flex flex-col items-end gap-2">
      <div
        role="tablist"
        aria-label="Feed sort"
        className="inline-flex items-center rounded-md border border-border bg-secondary/40 p-1"
      >
        <button
          role="tab"
          onClick={loadChronologicalFeed}
          disabled={loadingPersonalized}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !usePersonalized
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={!usePersonalized}
          aria-selected={!usePersonalized}
        >
          Latest
        </button>
        <button
          role="tab"
          onClick={loadPersonalizedFeed}
          disabled={loadingPersonalized}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            usePersonalized
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={usePersonalized}
          aria-selected={usePersonalized}
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          Recommended
        </button>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {loadingPersonalized ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Loading…
          </span>
        ) : usePersonalized ? (
          <span>AI-assisted recommendations (advisory)</span>
        ) : (
          <span>Chronological view</span>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mission Updates"
        description="Role-tailored mission signals and professional network updates."
        actions={toggleAction}
      />

      <MissionUpdatesPanel />

      <div className="px-1 pt-2">
        <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          Network updates
        </div>
      </div>

      <PostComposer
        onSubmit={handlePostSubmit}
        placeholder="Share a mission update… (avoid sensitive or classified details)"
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertTitle>Feed error</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
            <span>{error}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => (usePersonalized ? loadPersonalizedFeed() : loadChronologicalFeed())}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {loadingPersonalized ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-secondary" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-secondary rounded" />
                      <div className="h-3 w-24 bg-secondary rounded mt-2" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded mb-2" />
                  <div className="h-3 w-[92%] bg-secondary rounded mb-2" />
                  <div className="h-3 w-[80%] bg-secondary rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-md bg-secondary border border-border flex items-center justify-center mb-3 text-muted-foreground">
                <Inbox className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-foreground font-semibold">No updates yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start by posting a mission update or growing your trusted network.
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onLike={handleLike}
              onComment={handleComment}
              onRepost={handleRepost}
            />
          ))
        )}
      </div>
    </div>
  )
}
