"use client"

import Link from "next/link"

interface NotificationsContentProps {
  initialNotifications: any[]
}

export default function NotificationsContent({
  initialNotifications,
}: NotificationsContentProps) {
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
      default:
        return "🔔"
    }
  }

  return (
    <div className="space-y-2">
      {initialNotifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No notifications</p>
        </div>
      ) : (
        initialNotifications.map((notification) => (
          <Link
            key={notification.id}
            href={notification.link || "#"}
            className={`block p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 ${
              !notification.isRead ? "bg-blue-50" : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                <p className="text-gray-700 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

