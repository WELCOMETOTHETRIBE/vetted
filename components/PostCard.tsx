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
          className="text-primary-600 hover:text-primary-700 font-semibold underline decoration-2 underline-offset-2"
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
    <article className="bg-white rounded-xl border border-neutral-200 shadow-card p-6 mb-4 hover:shadow-card-hover transition-all duration-200">
      {/* Author Info */}
      <div className="flex items-start space-x-3 mb-4">
        <Link href={`/profile/${post.author.id}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden border-2 border-primary-200 shadow-sm">
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name || "User"}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary-700 text-lg font-semibold">
                {post.author.name?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.author.handle || post.author.id}`}>
            <h3 className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors">
              {post.author.name || "Anonymous"}
            </h3>
          </Link>
          <p className="text-sm text-neutral-500">
            {post.author.handle && `@${post.author.handle}`} · {formatDate(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-neutral-900 whitespace-pre-wrap leading-relaxed">{renderContent(post.content)}</p>
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
        <div className="mb-4 border border-neutral-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors">
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-neutral-50 transition-colors"
          >
            {post.linkImage && (
              <div className="w-full h-48 bg-neutral-100 relative">
                <Image
                  src={post.linkImage}
                  alt={post.linkTitle || "Link preview"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h4 className="font-semibold text-neutral-900 mb-1">
                {post.linkTitle || "Link"}
              </h4>
              {post.linkDescription && (
                <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                  {post.linkDescription}
                </p>
              )}
              <p className="text-xs text-neutral-500 truncate">{post.linkUrl}</p>
            </div>
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-6 pt-4 border-t border-neutral-100">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center space-x-2 text-sm font-medium transition-colors rounded-lg px-2 py-1 ${
            hasLiked 
              ? "text-primary-600 bg-primary-50" 
              : "text-neutral-600 hover:text-primary-600 hover:bg-neutral-50"
          }`}
          aria-label={`${hasLiked ? 'Unlike' : 'Like'} post`}
        >
          <span className="text-base">{hasLiked ? "❤️" : "🤍"}</span>
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 rounded-lg px-2 py-1 transition-colors"
          aria-label="Toggle comments"
        >
          <span className="text-base">💬</span>
          <span>{commentCount}</span>
        </button>

        <button
          onClick={() => onRepost(post.id)}
          className="flex items-center space-x-2 text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 rounded-lg px-2 py-1 transition-colors"
          aria-label="Repost"
        >
          <span className="text-base">🔄</span>
          <span>{repostCount}</span>
        </button>
      </div>

      {/* Comment Form */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-neutral-100 animate-slide-down">
          <form onSubmit={handleCommentSubmit} className="flex space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-neutral-50 focus:bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Comment
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

