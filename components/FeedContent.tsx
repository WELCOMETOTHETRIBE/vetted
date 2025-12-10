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

  return (
    <>
      <PostComposer onSubmit={handlePostSubmit} />
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

