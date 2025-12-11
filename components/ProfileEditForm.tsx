"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProfileOptimization from "./ProfileOptimization"

interface ProfileEditFormProps {
  user: any
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [headline, setHeadline] = useState(user.profile?.headline || "")
  const [about, setAbout] = useState(user.profile?.about || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      headline: formData.get("headline"),
      location: formData.get("location"),
      about: formData.get("about"),
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ProfileOptimization
        onApplyHeadline={(h) => {
          setHeadline(h)
          const input = document.querySelector('input[name="headline"]') as HTMLInputElement
          if (input) input.value = h
        }}
        onApplyAbout={(a) => {
          setAbout(a)
          const textarea = document.querySelector('textarea[name="about"]') as HTMLTextAreaElement
          if (textarea) textarea.value = a
        }}
      />
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          defaultValue={user.name || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Headline
        </label>
        <input
          type="text"
          name="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g., Software Engineer at Tech Company"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          name="location"
          defaultValue={user.profile?.location || ""}
          placeholder="e.g., San Francisco, CA"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About
        </label>
        <textarea
          name="about"
          rows={6}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Tell us about yourself..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
    </div>
  )
}

