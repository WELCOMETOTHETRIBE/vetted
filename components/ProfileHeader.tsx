"use client"

import Link from "next/link"
import Image from "next/image"

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
  onConnect,
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
        // Reload page to show updated connection status
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Banner */}
      <div className="h-56 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative">
        {profile.bannerImage ? (
          <Image
            src={profile.bannerImage}
            alt="Banner"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        <div className="flex items-start justify-between -mt-20 mb-4">
          <div className="flex items-end space-x-4">
            <div className="w-40 h-40 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center relative">
              {profile.user.image ? (
                <Image
                  src={profile.user.image}
                  alt={profile.user.name || "Profile"}
                  width={160}
                  height={160}
                  className="rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-inner">
                  {profile.user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>
          {!isOwnProfile && (
            <div className="mt-24 flex items-center gap-3">
              {connectionStatus === "CONNECTED" ? (
                <>
                  <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2">
                    <span>✓</span>
                    <span>Connected</span>
                  </button>
                  <Link
                    href={`/messages`}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        const response = await fetch("/api/messages/threads", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId }),
                        })
                        window.location.href = "/messages"
                      } catch (error) {
                        window.location.href = "/messages"
                      }
                    }}
                  >
                    Message
                  </Link>
                </>
              ) : connectionStatus === "PENDING" ? (
                <button 
                  className="px-5 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg cursor-default font-medium flex items-center gap-2"
                  title="Connection request pending"
                >
                  <span>⏳</span>
                  <span>Pending</span>
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                  + Connect
                </button>
              )}
            </div>
          )}
          {isOwnProfile && (
            <div className="mt-24">
              <Link
                href="/profile/edit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>✏️</span>
                <span>Edit Profile</span>
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {profile.user.name || "Anonymous"}
            </h1>
            {profile.headline && (
              <p className="text-lg text-gray-700 font-medium mb-2">{profile.headline}</p>
            )}
            {profile.location && (
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <span>📍</span>
                <span>{profile.location}</span>
              </div>
            )}
            {profile.user.handle && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <span>@</span>
                <span>{profile.user.handle}</span>
              </div>
            )}
          </div>
          
          {profile.about && (
            <div className="pt-3 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.about}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader

