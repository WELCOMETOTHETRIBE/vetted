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
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <form onSubmit={handleSubmit}>
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                <span>💡</span>
                <span>AI Suggestions</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="text-xs text-purple-600 hover:text-purple-800"
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
                  className="w-full text-left px-3 py-2 text-sm bg-white text-gray-700 rounded border border-purple-200 hover:bg-purple-100 transition-colors"
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
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span>🛡️</span>
              <span>AI spam detection active</span>
            </span>
            <button
              type="button"
              onClick={loadSuggestions}
              disabled={loadingSuggestions}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50"
            >
              {loadingSuggestions ? (
                <>
                  <span className="animate-spin">⏳</span>
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
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer text-gray-600 hover:text-blue-600">
              <span className="text-sm">📷 Photo</span>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  )
}

export default PostComposer

