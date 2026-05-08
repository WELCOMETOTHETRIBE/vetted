"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProfileOptimization from "./ProfileOptimization"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ProfileEditFormUser {
  id: string
  name: string | null
  email: string
  profile?: {
    headline?: string | null
    location?: string | null
    about?: string | null
  } | null
}

interface ProfileEditFormProps {
  user: ProfileEditFormUser
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

      if (response.ok) router.refresh()
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
          const input = document.querySelector(
            'input[name="headline"]',
          ) as HTMLInputElement | null
          if (input) input.value = h
        }}
        onApplyAbout={(a) => {
          setAbout(a)
          const textarea = document.querySelector(
            'textarea[name="about"]',
          ) as HTMLTextAreaElement | null
          if (textarea) textarea.value = a
        }}
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                type="text"
                name="name"
                defaultValue={user.name || ""}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-headline">Mission Headline</Label>
              <Input
                id="profile-headline"
                type="text"
                name="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Cybersecurity Analyst | Active Secret | Transitioning"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-location">Location</Label>
              <Input
                id="profile-location"
                type="text"
                name="location"
                defaultValue={user.profile?.location || ""}
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-about">Mission Summary</Label>
              <Textarea
                id="profile-about"
                name="about"
                rows={6}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Describe mission areas, program experience, and validated capabilities. Avoid classified details."
                className="resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
