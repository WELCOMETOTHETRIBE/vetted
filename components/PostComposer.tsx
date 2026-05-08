"use client"

import { useState } from "react"
import { Sparkles, ShieldCheck, Paperclip, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PostComposerProps {
  onSubmit: (content: string, imageUrl?: string) => void
  placeholder?: string
}

interface Suggestion {
  content: string
}

const PostComposer = ({ onSubmit, placeholder = "Share a mission update…" }: PostComposerProps) => {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const loadSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch("/api/posts/suggestions?tone=professional")
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Error loading suggestions:", error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content, imageUrl || undefined)
      setContent("")
      setImageUrl("")
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit}>
          {showSuggestions && suggestions.length > 0 && (
            <div className="mb-4 p-4 bg-secondary border border-border rounded-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Decision support drafts (advisory)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setContent(suggestion.content)
                      setShowSuggestions(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm bg-card text-foreground rounded-md border border-border hover:border-primary/40 hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {suggestion.content}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="resize-none"
            aria-label="Post content"
          />

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                Safety checks active
              </span>
              <button
                type="button"
                onClick={loadSuggestions}
                disabled={loadingSuggestions}
                className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1.5 font-semibold disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Loading…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Get draft ideas
                  </>
                )}
              </button>
            </div>
            <div className="text-xs text-muted-foreground">
              {content.length.toLocaleString()} chars
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-border flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <Paperclip className="h-4 w-4" aria-hidden />
                Attach
              </span>
              <Input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (optional)"
                className="h-8 text-sm w-56"
                aria-label="Attach image URL"
              />
            </div>
            <Button type="submit" disabled={!content.trim()}>
              Publish
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default PostComposer
