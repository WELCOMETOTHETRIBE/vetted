"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface NetworkContentProps {
  initialData: {
    connections: any[]
    pendingReceived: any[]
    pendingSent: any[]
  }
  currentUserId: string
}

export default function NetworkContent({
  initialData,
  currentUserId,
}: NetworkContentProps) {
  const [activeTab, setActiveTab] = useState<"connections" | "pending">("connections")
  const [connections, setConnections] = useState(initialData.connections)
  const [pendingReceived, setPendingReceived] = useState(initialData.pendingReceived)

  const handleAccept = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      })

      if (response.ok) {
        const updated = await response.json()
        // Remove from pending received
        setPendingReceived(pendingReceived.filter((c) => c.id !== connectionId))
        // Add to connections with full user data
        const connectionWithUsers = {
          ...updated,
          requester: pendingReceived.find(c => c.id === connectionId)?.requester,
          receiver: pendingReceived.find(c => c.id === connectionId)?.receiver || {
            id: updated.receiverId,
            name: null,
            image: null,
            handle: null,
            profile: null
          }
        }
        setConnections([...connections, connectionWithUsers])
        // Refresh the page after a short delay to ensure UI updates
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to accept connection")
      }
    } catch (error) {
      console.error("Error accepting connection:", error)
      alert("Failed to accept connection. Please try again.")
    }
  }

  const handleReject = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      })

      if (response.ok) {
        setPendingReceived(pendingReceived.filter((c) => c.id !== connectionId))
        // Refresh after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to reject connection")
      }
    } catch (error) {
      console.error("Error rejecting connection:", error)
      alert("Failed to reject connection. Please try again.")
    }
  }

  const renderUser = (user: any) => (
    <div key={user.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
      <Link href={`/profile/${user.handle || user.id}`}>
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            user.name?.charAt(0).toUpperCase() || "U"
          )}
        </div>
      </Link>
      <div className="flex-1">
        <Link
          href={`/profile/${user.handle || user.id}`}
          className="font-semibold text-gray-900 hover:text-blue-600"
        >
          {user.name || "Anonymous"}
        </Link>
        {user.profile?.headline && (
          <p className="text-sm text-gray-600">{user.profile.headline}</p>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("connections")}
          className={`px-4 py-2 font-medium ${
            activeTab === "connections"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium ${
            activeTab === "pending"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          Received ({pendingReceived.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 font-medium ${
            activeTab === "sent"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          Sent ({pendingSent.length})
        </button>
      </div>

      {activeTab === "connections" ? (
        <div className="space-y-4">
          {connections.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No connections yet. Start connecting!</p>
            </div>
          ) : (
            connections.map((conn) => {
              const otherUser =
                conn.requesterId === currentUserId ? conn.receiver : conn.requester
              return renderUser(otherUser)
            })
          )}
        </div>
      ) : activeTab === "pending" ? (
        <div className="space-y-4">
          {pendingReceived.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No pending requests received</p>
            </div>
          ) : (
            pendingReceived.map((conn) => {
              const requester = conn.requester
              return (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  {renderUser(requester)}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAccept(conn.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(conn.id)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSent.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No pending requests sent</p>
            </div>
          ) : (
            pendingSent.map((conn) => {
              const receiver = conn.receiver
              return (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  {renderUser(receiver)}
                  <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                    Pending
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

