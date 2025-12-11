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
    try {
      const response = await fetch("/api/posts/recommend")
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setUsePersonalized(true)
      }
    } catch (error) {
      console.error("Error loading personalized feed:", error)
    } finally {
      setLoadingPersonalized(false)
    }
  }

  const loadChronologicalFeed = async () => {
    setLoadingPersonalized(true)
    try {
      const response = await fetch("/api/posts")
      if (response.ok) {
        const updatedPosts = await response.json()
        setPosts(updatedPosts)
        setUsePersonalized(false)
      }
    } catch (error) {
      console.error("Error loading feed:", error)
    } finally {
      setLoadingPersonalized(false)
    }
  }

  return (
    <>
      <PostComposer onSubmit={handlePostSubmit} />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={loadChronologicalFeed}
            disabled={loadingPersonalized}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !usePersonalized
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } disabled:opacity-50`}
          >
            Latest
          </button>
          <button
            onClick={loadPersonalizedFeed}
            disabled={loadingPersonalized}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              usePersonalized
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } disabled:opacity-50`}
          >
            {loadingPersonalized ? (
              "Loading..."
            ) : (
              <>
                <span>🤖</span>
                <span>For You</span>
              </>
            )}
          </button>
        </div>
        {usePersonalized && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span>🤖</span>
            <span>AI-powered recommendations</span>
          </span>
        )}
      </div>
      <div>
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No posts yet. Start connecting with others!</p>
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
    </>
  )
}

