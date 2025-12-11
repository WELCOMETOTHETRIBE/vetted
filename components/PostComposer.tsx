"use client"

import { useState } from "react"

interface PostComposerProps {
  onSubmit: (content: string, imageUrl?: string) => void
  placeholder?: string
}

const PostComposer = ({ onSubmit, placeholder = "What's on your mind?" }: PostComposerProps) => {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content, imageUrl || undefined)
      setContent("")
      setImageUrl("")
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span>🛡️</span>
            <span>AI spam detection active</span>
          </span>
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

