"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NetworkUser {
  id: string
  name: string | null
  image: string | null
  handle: string | null
  profile?: { headline?: string | null } | null
}

interface ConnectionEntity {
  id: string
  requesterId: string
  receiverId: string
  requester?: NetworkUser
  receiver?: NetworkUser
}

interface Recommendation {
  userId: string
  name: string | null
  handle: string | null
  image: string | null
  headline?: string | null
  relevanceScore: number
  communalities?: string[]
  reasoning?: string
}

interface NetworkContentProps {
  initialData: {
    connections: ConnectionEntity[]
    pendingReceived: ConnectionEntity[]
    pendingSent: ConnectionEntity[]
  }
  currentUserId: string
}

type Tab = "connections" | "pending" | "sent" | "recommendations"

export default function NetworkContent({
  initialData,
  currentUserId,
}: NetworkContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("connections")
  const [connections, setConnections] = useState(initialData.connections)
  const [pendingReceived, setPendingReceived] = useState(initialData.pendingReceived)
  const [pendingSent] = useState(initialData.pendingSent)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const handleAccept = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      })

      if (response.ok) {
        const updated = await response.json()
        const original = pendingReceived.find((c) => c.id === connectionId)
        setPendingReceived(pendingReceived.filter((c) => c.id !== connectionId))
        const next: ConnectionEntity = {
          ...updated,
          requester: original?.requester,
          receiver: original?.receiver || {
            id: updated.receiverId,
            name: null,
            image: null,
            handle: null,
            profile: null,
          },
        }
        setConnections([...connections, next])
        setTimeout(() => window.location.reload(), 500)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to accept connection")
      }
    } catch (error) {
      console.error("Error accepting connection:", error)
      alert("Failed to accept connection. Please try again.")
    }
  }

  const loadRecommendations = async () => {
    setLoadingRecommendations(true)
    try {
      const response = await fetch("/api/connections/recommend?limit=10")
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error("Error loading recommendations:", error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleConnect = async (userId: string) => {
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      })

      if (response.ok) {
        setRecommendations(recommendations.filter((r) => r.userId !== userId))
        alert("Connection request sent!")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to send connection request")
      }
    } catch (error) {
      console.error("Error sending connection request:", error)
      alert("Failed to send connection request")
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
        setTimeout(() => window.location.reload(), 500)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to reject connection")
      }
    } catch (error) {
      console.error("Error rejecting connection:", error)
      alert("Failed to reject connection. Please try again.")
    }
  }

  const renderUser = (user: NetworkUser) => (
    <div key={user.id} className="flex items-center gap-3 p-4">
      <Link
        href={`/profile/${user.handle || user.id}`}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center overflow-hidden border border-border">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <span className="font-semibold">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${user.handle || user.id}`}
          className="font-semibold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {user.name || "Anonymous"}
        </Link>
        {user.profile?.headline && (
          <p className="text-sm text-muted-foreground truncate">{user.profile.headline}</p>
        )}
      </div>
    </div>
  )

  const TabButton = ({
    value,
    children,
    onClick,
  }: {
    value: Tab
    children: React.ReactNode
    onClick?: () => void
  }) => (
    <button
      type="button"
      onClick={onClick || (() => setActiveTab(value))}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t",
        activeTab === value
          ? "text-primary border-primary"
          : "text-muted-foreground border-transparent hover:text-foreground",
      )}
      role="tab"
      aria-selected={activeTab === value}
    >
      {children}
    </button>
  )

  return (
    <div>
      <div role="tablist" className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        <TabButton value="connections">Connections ({connections.length})</TabButton>
        <TabButton value="pending">Received ({pendingReceived.length})</TabButton>
        <TabButton value="sent">Sent ({pendingSent.length})</TabButton>
        <TabButton
          value="recommendations"
          onClick={() => {
            setActiveTab("recommendations")
            if (recommendations.length === 0) {
              loadRecommendations()
            }
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI Recommendations
          </span>
        </TabButton>
      </div>

      {activeTab === "connections" ? (
        <div className="space-y-3">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No connections yet. Start connecting!
                </p>
              </CardContent>
            </Card>
          ) : (
            connections.map((conn) => {
              const otherUser =
                conn.requesterId === currentUserId ? conn.receiver : conn.requester
              if (!otherUser) return null
              return (
                <Card key={conn.id}>{renderUser(otherUser)}</Card>
              )
            })
          )}
        </div>
      ) : activeTab === "pending" ? (
        <div className="space-y-3">
          {pendingReceived.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No pending requests received</p>
              </CardContent>
            </Card>
          ) : (
            pendingReceived.map((conn) => {
              const requester = conn.requester
              if (!requester) return null
              return (
                <Card key={conn.id}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {renderUser(requester)}
                    <div className="flex gap-2 px-4 pb-4 sm:pb-0">
                      <Button size="sm" onClick={() => handleAccept(conn.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleReject(conn.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      ) : activeTab === "recommendations" ? (
        <div className="space-y-3">
          {loadingRecommendations ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Loading AI recommendations…</p>
              </CardContent>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-muted-foreground">No recommendations available</p>
                <Button onClick={loadRecommendations}>
                  <Sparkles className="h-4 w-4" aria-hidden /> Load Recommendations
                </Button>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.userId}>
                <div className="flex items-center justify-between gap-3 flex-wrap p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link
                      href={`/profile/${rec.handle || rec.userId}`}
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center overflow-hidden border border-border">
                        {rec.image ? (
                          <Image
                            src={rec.image}
                            alt={rec.name || "User"}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="font-semibold">
                            {rec.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${rec.handle || rec.userId}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {rec.name || "Anonymous"}
                      </Link>
                      {rec.headline && (
                        <p className="text-sm text-muted-foreground truncate">{rec.headline}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-primary border-primary/30">
                          {rec.relevanceScore}% match
                        </Badge>
                        {rec.communalities && rec.communalities.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {rec.communalities.slice(0, 2).join(", ")}
                            {rec.communalities.length > 2 && ` +${rec.communalities.length - 2}`}
                          </span>
                        )}
                      </div>
                      {rec.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{rec.reasoning}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleConnect(rec.userId)}>
                    <UserPlus className="h-4 w-4" aria-hidden /> Connect
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {pendingSent.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No pending requests sent</p>
              </CardContent>
            </Card>
          ) : (
            pendingSent.map((conn) => {
              const receiver = conn.receiver
              if (!receiver) return null
              return (
                <Card key={conn.id}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {renderUser(receiver)}
                    <Badge variant="outline" className="mr-4 mb-4 sm:mb-0">
                      Pending
                    </Badge>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
