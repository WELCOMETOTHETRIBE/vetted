"use client"

import { useState } from "react"
import PostComposer from "./PostComposer"
import PostCard from "./PostCard"

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
        // Refresh posts to get updated reaction counts
        const response = await fetch("/api/posts")
        if (response.ok) {
          const updatedPosts = await response.json()
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
        // Refresh posts to get updated comment counts
        const response = await fetch("/api/posts")
        if (response.ok) {
          const updatedPosts = await response.json()
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
        // Refresh posts
        const response = await fetch("/api/posts")
        if (response.ok) {
          const updatedPosts = await response.json()
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

  return (
    <div className="space-y-4">
      {/* Feed Header */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-card px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
              Mission Updates
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Professional, mission-oriented updates from your trusted network.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center bg-neutral-100 border border-neutral-200 rounded-2xl p-1">
              <button
                onClick={loadChronologicalFeed}
                disabled={loadingPersonalized}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  !usePersonalized
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-700 hover:text-neutral-900"
                } disabled:opacity-50`}
                aria-pressed={!usePersonalized}
              >
                Latest
              </button>
              <button
                onClick={loadPersonalizedFeed}
                disabled={loadingPersonalized}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                  usePersonalized
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-700 hover:text-neutral-900"
                } disabled:opacity-50`}
                aria-pressed={usePersonalized}
              >
                <span aria-hidden="true">🧠</span>
                <span>Recommended</span>
              </button>
            </div>

            <div className="text-xs text-neutral-500 text-right">
              {loadingPersonalized ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                  Loading…
                </span>
              ) : usePersonalized ? (
                <span>
                  AI-assisted recommendations (advisory)
                </span>
              ) : (
                <span>Chronological view</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <PostComposer
        onSubmit={handlePostSubmit}
        placeholder="Share a mission update… (avoid sensitive or classified details)"
      />

      {error && (
        <div className="bg-white rounded-2xl border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
              <span aria-hidden="true">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">Feed error</p>
              <p className="text-sm text-neutral-700 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => (usePersonalized ? loadPersonalizedFeed() : loadChronologicalFeed())}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loadingPersonalized ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-neutral-200" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-neutral-200 rounded" />
                    <div className="h-3 w-24 bg-neutral-200 rounded mt-2" />
                  </div>
                </div>
                <div className="h-3 w-full bg-neutral-200 rounded mb-2" />
                <div className="h-3 w-[92%] bg-neutral-200 rounded mb-2" />
                <div className="h-3 w-[80%] bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-3">
              <span aria-hidden="true">🗒️</span>
            </div>
            <p className="text-neutral-900 font-semibold">No updates yet</p>
            <p className="text-sm text-neutral-600 mt-1">
              Start by posting a mission update or growing your trusted network.
            </p>
          </div>
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

