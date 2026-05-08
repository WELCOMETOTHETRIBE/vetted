"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Users,
  CheckCircle2,
  ThumbsUp,
  MessageCircle,
  Mail,
  FileText,
  AtSign,
  Bell,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string | Date
  link?: string | null
  connectionId?: string
  requester?: {
    id: string
    name: string | null
    image: string | null
    handle: string | null
  } | null
}

interface NotificationsContentProps {
  initialNotifications: Notification[]
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CONNECTION_REQUEST: Users,
  CONNECTION_ACCEPTED: CheckCircle2,
  POST_LIKED: ThumbsUp,
  POST_COMMENTED: MessageCircle,
  MESSAGE_RECEIVED: Mail,
  JOB_APPLICATION_RECEIVED: FileText,
  MENTION: AtSign,
}

export default function NotificationsContent({
  initialNotifications,
}: NotificationsContentProps) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleAcceptConnection = async (connectionId: string, notificationId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      })

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId))
        await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" })
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
        setNotifications(notifications.filter((n) => n.id !== notificationId))
        await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" })
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
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-md bg-secondary border border-border flex items-center justify-center mb-3 text-muted-foreground">
              <Bell className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-foreground font-semibold">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              You’re all caught up.
            </p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => {
          const Icon = ICON_MAP[notification.type] || Bell
          return (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors",
                !notification.isRead && "border-primary/30 bg-secondary/30",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {notification.type === "CONNECTION_REQUEST" && notification.requester?.image ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                      <Image
                        src={notification.requester.image}
                        alt={notification.requester.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-secondary border border-border flex items-center justify-center flex-shrink-0 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground/80 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    {notification.type === "CONNECTION_REQUEST" && notification.connectionId && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleAcceptConnection(notification.connectionId!, notification.id)
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault()
                            handleRejectConnection(notification.connectionId!, notification.id)
                          }}
                        >
                          Reject
                        </Button>
                        {notification.requester && (
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/profile/${notification.requester.handle || notification.requester.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Profile
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                    {notification.type !== "CONNECTION_REQUEST" && notification.link && (
                      <Link
                        href={notification.link}
                        className="text-primary hover:text-primary/80 text-sm mt-2 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        View
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
