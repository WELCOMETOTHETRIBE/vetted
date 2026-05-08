"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }
      const handle = match[1]
      parts.push(
        <Link
          key={match.index}
          href={`/profile/${handle}`}
          className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4"
        >
          @{handle}
        </Link>
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }
    return parts.length > 0 ? parts : content
  }

  return (
    <Card className="mb-4 transition-colors hover:border-border/80">
      <CardContent className="p-5 sm:p-6">
        {/* Author Info */}
        <div className="flex items-start space-x-3 mb-4">
          <Link
            href={`/profile/${post.author.handle || post.author.id}`}
            className="flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center overflow-hidden border border-border">
              {post.author.image ? (
                <Image
                  src={post.author.image}
                  alt={post.author.name || "User"}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">
                  {post.author.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${post.author.handle || post.author.id}`}
              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                {post.author.name || "Anonymous"}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground">
              {post.author.handle ? `@${post.author.handle}` : "Member"}
              <span aria-hidden="true"> · </span>
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base">
            {renderContent(post.content)}
          </p>
        </div>

        {/* Post Image */}
        {post.imageUrl && (
          <div className="mb-4 rounded-md overflow-hidden border border-border">
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
          <div className="mb-4 border border-border rounded-md overflow-hidden hover:border-primary/40 transition-colors">
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {post.linkImage && (
                <div className="w-full h-48 bg-secondary relative">
                  <Image
                    src={post.linkImage}
                    alt={post.linkTitle || "Link preview"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h4 className="font-semibold text-foreground mb-1">
                  {post.linkTitle || "Link"}
                </h4>
                {post.linkDescription && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {post.linkDescription}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/80 truncate">{post.linkUrl}</p>
              </div>
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={() => onLike(post.id)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors rounded-md px-3 py-2 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              hasLiked ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={`${hasLiked ? "Unlike" : "Like"} post`}
            aria-pressed={hasLiked}
          >
            <Heart
              className={cn("h-4 w-4", hasLiked && "fill-current")}
              aria-hidden
            />
            <span>{likeCount.toLocaleString()}</span>
            <span className="hidden sm:inline">Acknowledge</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Toggle comments"
            aria-expanded={showComments}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span>{commentCount.toLocaleString()}</span>
            <span className="hidden sm:inline">Comment</span>
          </button>

          <button
            onClick={() => onRepost(post.id)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Repost"
          >
            <Repeat2 className="h-4 w-4" aria-hidden />
            <span>{repostCount.toLocaleString()}</span>
            <span className="hidden sm:inline">Reshare</span>
          </button>
        </div>

        {/* Comment Form */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border">
            <form onSubmit={handleCommentSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a professional comment…"
                className="flex-1"
                aria-label="Comment text"
              />
              <Button type="submit" size="sm" className="gap-2">
                <Send className="h-3.5 w-3.5" aria-hidden />
                Send
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
