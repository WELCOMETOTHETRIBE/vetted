"use client"

import { useState } from "react"

interface PostComposerProps {
  onSubmit: (content: string, imageUrl?: string) => void
  placeholder?: string
}

const PostComposer = ({ onSubmit, placeholder = "What's on your mind?" }: PostComposerProps) => {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
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
    <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5 mb-4">
      <form onSubmit={handleSubmit}>
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-4 p-4 bg-primary-50 rounded-xl border border-primary-200 animate-slide-down">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-primary-700 flex items-center gap-1.5">
                <span>💡</span>
                <span>AI Suggestions</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
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
                  className="w-full text-left px-4 py-2.5 text-sm bg-white text-neutral-700 rounded-lg border border-primary-200 hover:bg-primary-100 hover:border-primary-300 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {suggestion.content}
                </button>
              ))}
            </div>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-neutral-50 focus:bg-white transition-colors placeholder:text-neutral-400"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-600 flex items-center gap-1.5 font-medium">
              <span>🛡️</span>
              <span>AI spam detection active</span>
            </span>
            <button
              type="button"
              onClick={loadSuggestions}
              disabled={loadingSuggestions}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1.5 font-semibold disabled:opacity-50 transition-colors"
            >
              {loadingSuggestions ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>💡</span>
                  <span>Get AI Suggestions</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center space-x-3">
            <label className="cursor-pointer text-neutral-600 hover:text-primary-600 transition-colors">
              <span className="text-sm font-medium">📷 Photo</span>
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-neutral-50 focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!content.trim()}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  )
}

export default PostComposer

