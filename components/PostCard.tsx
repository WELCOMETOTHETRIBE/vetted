"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

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

interface PostCardProps {
  post: Post
  currentUserId: string
  onLike: (postId: string) => void
  onComment: (postId: string, content: string) => void
  onRepost: (postId: string) => void
}

export default function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onRepost,
}: PostCardProps) {
  const [commentText, setCommentText] = useState("")
  const [showComments, setShowComments] = useState(false)

  const hasLiked = post.reactions.some(
    (r) => r.userId === currentUserId && r.type === "LIKE"
  )
  const likeCount = post.reactions.filter((r) => r.type === "LIKE").length
  const commentCount = post.comments.length
  const repostCount = post.reposts.length

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentText.trim()) {
      onComment(post.id, commentText)
      setCommentText("")
    }
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  }

  // Render content with clickable mentions
  const renderContent = (content: string) => {
    const mentionRegex = /@(\w+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }
      // Add mention link
      const handle = match[1]
      parts.push(
        <Link
          key={match.index}
          href={`/profile/${handle}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          @{handle}
        </Link>
      )
      lastIndex = match.index + match[0].length
    }
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }
    return parts.length > 0 ? parts : content
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
      {/* Author Info */}
      <div className="flex items-start space-x-3 mb-4">
        <Link href={`/profile/${post.author.id}`}>
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name || "User"}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-lg">
                {post.author.name?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${post.author.id}`}>
            <h3 className="font-semibold text-gray-900 hover:text-blue-600">
              {post.author.name || "Anonymous"}
            </h3>
          </Link>
          <p className="text-sm text-gray-500">
            {post.author.handle && `@${post.author.handle}`} · {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <Image
            src={post.imageUrl}
            alt="Post image"
            width={600}
            height={400}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Link Preview */}
      {post.linkUrl && (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-gray-50"
          >
            {post.linkImage && (
              <div className="w-full h-48 bg-gray-200 relative">
                <Image
                  src={post.linkImage}
                  alt={post.linkTitle || "Link preview"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-1">
                {post.linkTitle || "Link"}
              </h4>
              {post.linkDescription && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {post.linkDescription}
                </p>
              )}
              <p className="text-xs text-gray-500 truncate">{post.linkUrl}</p>
            </div>
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center space-x-2 text-sm ${
            hasLiked ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <span>{hasLiked ? "❤️" : "🤍"}</span>
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <span>💬</span>
          <span>{commentCount}</span>
        </button>

        <button
          onClick={() => onRepost(post.id)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <span>🔄</span>
          <span>{repostCount}</span>
        </button>
      </div>

      {/* Comment Form */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <form onSubmit={handleCommentSubmit} className="flex space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Comment
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

