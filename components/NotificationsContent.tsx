"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface NotificationsContentProps {
  initialNotifications: any[]
}

export default function NotificationsContent({
  initialNotifications,
}: NotificationsContentProps) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CONNECTION_REQUEST":
        return "👥"
      case "CONNECTION_ACCEPTED":
        return "✅"
      case "POST_LIKED":
        return "👍"
      case "POST_COMMENTED":
        return "💬"
      case "MESSAGE_RECEIVED":
        return "💌"
      case "JOB_APPLICATION_RECEIVED":
        return "📄"
      case "MENTION":
        return "@"
      default:
        return "🔔"
    }
  }

  const handleAcceptConnection = async (connectionId: string, notificationId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      })

      if (response.ok) {
        // Remove notification and refresh
        setNotifications(notifications.filter((n) => n.id !== notificationId))
        // Mark notification as read
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: "PATCH",
        })
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to accept connection")
      }
    } catch (error) {
      console.error("Error accepting connection:", error)
      alert("Failed to accept connection")
    }
  }

  const handleRejectConnection = async (connectionId: string, notificationId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      })

      if (response.ok) {
        // Remove notification
        setNotifications(notifications.filter((n) => n.id !== notificationId))
        // Mark notification as read
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: "PATCH",
        })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to reject connection")
      }
    } catch (error) {
      console.error("Error rejecting connection:", error)
      alert("Failed to reject connection")
    }
  }

  return (
    <div className="space-y-2">
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No notifications</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 bg-white rounded-lg border border-gray-200 ${
              !notification.isRead ? "bg-blue-50" : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              {notification.type === "CONNECTION_REQUEST" && notification.requester?.image && (
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={notification.requester.image}
                    alt={notification.requester.name || "User"}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
              )}
              {(!notification.requester || !notification.requester.image) && (
                <span className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                <p className="text-gray-700 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
                {notification.type === "CONNECTION_REQUEST" && notification.connectionId && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleAcceptConnection(notification.connectionId, notification.id)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleRejectConnection(notification.connectionId, notification.id)
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Reject
                    </button>
                    {notification.requester && (
                      <Link
                        href={`/profile/${notification.requester.handle || notification.requester.id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Profile
                      </Link>
                    )}
                  </div>
                )}
                {notification.type !== "CONNECTION_REQUEST" && notification.link && (
                  <Link
                    href={notification.link}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                  >
                    View →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

