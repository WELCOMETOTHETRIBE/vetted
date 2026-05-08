"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Check,
  Clock,
  UserPlus,
  Pencil,
  MapPin,
  AtSign,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProfileHeaderProps {
  profile: {
    user: {
      id: string
      name: string | null
      image: string | null
      handle: string | null
      email: string
    }
    headline?: string | null
    location?: string | null
    about?: string | null
    bannerImage?: string | null
  }
  isOwnProfile?: boolean
  connectionStatus?: "CONNECTED" | "PENDING" | "NONE"
  onConnect?: () => void
  userId?: string
}

const ProfileHeader = ({
  profile,
  isOwnProfile = false,
  connectionStatus,
  userId,
}: ProfileHeaderProps) => {
  const handleConnect = async () => {
    if (!userId) return
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      })
      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to send connection request")
      }
    } catch (error) {
      console.error("Error connecting:", error)
      alert("Failed to send connection request")
    }
  }

  return (
    <Card className="overflow-hidden mb-4">
      {/* Banner */}
      <div className="h-40 cleard-hero-bg relative">
        {profile.bannerImage && (
          <Image
            src={profile.bannerImage}
            alt="Banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 -mt-16 mb-4 flex-wrap">
          <div className="flex items-end space-x-4">
            <div className="w-32 h-32 rounded-full border-4 border-card bg-card shadow-lg flex items-center justify-center relative overflow-hidden">
              {profile.user.image ? (
                <Image
                  src={profile.user.image}
                  alt={profile.user.name || "Profile"}
                  width={128}
                  height={128}
                  className="rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-primary/15 text-primary rounded-full flex items-center justify-center text-3xl font-semibold">
                  {profile.user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>
          {!isOwnProfile && (
            <div className="mt-20 flex items-center gap-3 flex-wrap">
              {connectionStatus === "CONNECTED" ? (
                <>
                  <Button variant="secondary" className="gap-2">
                    <Check className="h-4 w-4" aria-hidden />
                    Trusted Connection
                  </Button>
                  <Button asChild>
                    <Link
                      href="/messages"
                      onClick={async (e) => {
                        e.preventDefault()
                        try {
                          await fetch("/api/messages/threads", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId }),
                          })
                        } finally {
                          window.location.href = "/messages"
                        }
                      }}
                    >
                      Message
                    </Link>
                  </Button>
                </>
              ) : connectionStatus === "PENDING" ? (
                <Button variant="outline" disabled className="gap-2">
                  <Clock className="h-4 w-4" aria-hidden />
                  Request Pending
                </Button>
              ) : (
                <Button onClick={handleConnect} className="gap-2">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Add to Trusted Network
                </Button>
              )}
            </div>
          )}
          {isOwnProfile && (
            <div className="mt-20">
              <Button asChild className="gap-2">
                <Link href="/profile/edit">
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit Mission Profile
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-1">
              {profile.user.name || "Anonymous"}
            </h1>
            {profile.headline && (
              <p className="text-base text-foreground/90 font-medium mb-2">
                {profile.headline}
              </p>
            )}
            {profile.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {profile.location}
              </div>
            )}
            {profile.user.handle && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <AtSign className="h-3.5 w-3.5" aria-hidden />
                {profile.user.handle}
              </div>
            )}
          </div>

          {profile.about && (
            <div className="pt-3 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Mission Summary
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {profile.about}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProfileHeader
