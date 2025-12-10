"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface PostCardProps {
  post: {
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
  currentUserId?: string
  onLike?: (postId: string) => void
  onComment?: (postId: string, content: string) => void
  onRepost?: (postId: string) => void
}

const PostCard = ({ post, currentUserId, onLike, onComment, onRepost }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const isLiked = post.reactions.some(r => r.userId === currentUserId)

  const handleLike = () => {
    if (onLike) {
      onLike(post.id)
    }
  }

  const handleComment = () => {
    if (onComment && commentText.trim()) {
      onComment(post.id, commentText)
      setCommentText("")
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      {/* Author Header */}
      <div className="flex items-start space-x-3 mb-3">
        <Link href={`/profile/${post.author.handle || post.author.id}`}>
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name || "User"}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              post.author.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${post.author.handle || post.author.id}`}>
            <h3 className="font-semibold text-gray-900 hover:text-blue-600">
              {post.author.name || "Anonymous"}
            </h3>
          </Link>
          <p className="text-sm text-gray-500">
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <Image
            src={post.imageUrl}
            alt="Post image"
            width={600}
            height={400}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Link Preview */}
      {post.linkUrl && (
        <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
          {post.linkImage && (
            <Image
              src={post.linkImage}
              alt={post.linkTitle || "Link preview"}
              width={600}
              height={300}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-3">
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold"
            >
              {post.linkTitle || post.linkUrl}
            </a>
            {post.linkDescription && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {post.linkDescription}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-6 pt-3 border-t border-gray-200">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 text-sm transition-colors ${
            isLiked ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <span>👍</span>
          <span>
            {post.reactions.length > 0 && post.reactions.length}
          </span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <span>💬</span>
          <span>{post.comments.length > 0 && post.comments.length}</span>
        </button>
        <button
          onClick={() => onRepost && onRepost(post.id)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <span>🔄</span>
          <span>{post.reposts.length > 0 && post.reposts.length}</span>
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleComment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCard

