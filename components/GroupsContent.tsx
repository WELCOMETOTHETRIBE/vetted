"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CreateGroupModal from "./CreateGroupModal"

interface GroupsContentProps {
  initialData: {
    allGroups: any[]
    myGroups: any[]
  }
  currentUserId: string
}

export default function GroupsContent({
  initialData,
  currentUserId,
}: GroupsContentProps) {
  const router = useRouter()
  const [allGroups, setAllGroups] = useState(initialData.allGroups)
  const [myGroups, setMyGroups] = useState(initialData.myGroups)
  const [activeTab, setActiveTab] = useState<"all" | "my">("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleJoin = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const handleLeave = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error leaving group:", error)
    }
  }

  const isMember = (group: any) => {
    return group.memberships && group.memberships.length > 0
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium ${
              activeTab === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            All Groups
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2 font-medium ${
              activeTab === "my"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            My Groups ({myGroups.length})
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Create Group
        </button>
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {activeTab === "all" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <Link href={`/groups/${group.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {group.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {group.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Created by {group.owner.name}
                </span>
                {isMember(group) ? (
                  <button
                    onClick={() => handleLeave(group.id)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(group.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGroups.map((membership) => (
            <div
              key={membership.group.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <Link href={`/groups/${membership.group.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {membership.group.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {membership.group.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

