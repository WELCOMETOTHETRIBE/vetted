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
}

const ProfileHeader = ({
  profile,
  isOwnProfile = false,
  connectionStatus,
  onConnect,
}: ProfileHeaderProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600 relative">
        {profile.bannerImage && (
          <Image
            src={profile.bannerImage}
            alt="Banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        <div className="flex items-start justify-between -mt-16 mb-4">
          <div className="flex items-end space-x-4">
            <div className="w-32 h-32 bg-white rounded-full border-4 border-white flex items-center justify-center">
              {profile.user.image ? (
                <Image
                  src={profile.user.image}
                  alt={profile.user.name || "Profile"}
                  width={128}
                  height={128}
                  className="rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-semibold">
                  {profile.user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>
          {!isOwnProfile && (
            <div className="mt-20">
              {connectionStatus === "CONNECTED" ? (
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Connected
                </button>
              ) : connectionStatus === "PENDING" ? (
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  Pending
                </button>
              ) : (
                <button
                  onClick={onConnect}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Connect
                </button>
              )}
            </div>
          )}
          {isOwnProfile && (
            <div className="mt-20">
              <Link
                href="/profile/edit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </Link>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {profile.user.name || "Anonymous"}
          </h1>
          {profile.headline && (
            <p className="text-lg text-gray-700 mb-2">{profile.headline}</p>
          )}
          {profile.location && (
            <p className="text-sm text-gray-600 mb-4">{profile.location}</p>
          )}
          {profile.about && (
            <p className="text-gray-700 whitespace-pre-wrap">{profile.about}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader

