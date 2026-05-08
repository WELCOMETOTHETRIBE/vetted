"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Sparkles, Send, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MessageUser {
  id: string
  name: string | null
  image: string | null
  handle: string | null
  email?: string | null
}

interface MessageEntity {
  id: string
  content: string
  senderId: string
  createdAt: string | Date
  sender?: MessageUser
}

interface ThreadEntity {
  id: string
  user1Id: string
  user2Id: string
  user1: MessageUser
  user2: MessageUser
  messages?: MessageEntity[]
}

interface MessagesContentProps {
  initialThreads: ThreadEntity[]
  currentUserId: string
}

export default function MessagesContent({
  initialThreads,
  currentUserId,
}: MessagesContentProps) {
  const [threads] = useState(initialThreads)
  const [selectedThread, setSelectedThread] = useState<ThreadEntity | null>(null)
  const [messages, setMessages] = useState<MessageEntity[]>([])
  const [messageText, setMessageText] = useState("")
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox")
  const [messageSuggestions, setMessageSuggestions] = useState<{ text: string }[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [newMessageUserId, setNewMessageUserId] = useState("")
  const [newMessageText, setNewMessageText] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<MessageUser[]>([])
  const [showUserSearch, setShowUserSearch] = useState(false)

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
      const interval = setInterval(() => loadMessages(selectedThread.id), 5000)
      return () => clearInterval(interval)
    }
    setMessageSuggestions([])
  }, [selectedThread])

  useEffect(() => {
    if (userSearchQuery) {
      const id = setTimeout(() => searchUsers(userSearchQuery), 300)
      return () => clearTimeout(id)
    }
    setUserSearchResults([])
  }, [userSearchQuery])

  const loadSuggestions = async () => {
    if (!selectedThread) return
    setLoadingSuggestions(true)
    try {
      const response = await fetch("/api/messages/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: selectedThread.id, tone: "friendly" }),
      })
      if (response.ok) {
        const data = await response.json()
        setMessageSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Error loading suggestions:", error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/messages/threads/${threadId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedThread || !messageText.trim()) return
    try {
      const response = await fetch(`/api/messages/threads/${selectedThread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      })
      if (response.ok) {
        setMessageText("")
        loadMessages(selectedThread.id)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const getOtherUser = (thread: ThreadEntity) =>
    thread.user1Id === currentUserId ? thread.user2 : thread.user1

  const inboxThreads = threads.filter((thread) => {
    const lastMessage = thread.messages?.[0]
    return lastMessage && lastMessage.senderId !== currentUserId
  })

  const sentThreads = threads.filter((thread) => {
    const lastMessage = thread.messages?.[0]
    return lastMessage && lastMessage.senderId === currentUserId
  })

  const displayedThreads = activeTab === "inbox" ? inboxThreads : sentThreads

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([])
      return
    }
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=people`,
      )
      if (response.ok) {
        const data = await response.json()
        setUserSearchResults(data.people || [])
      }
    } catch (error) {
      console.error("Error searching users:", error)
    }
  }

  const handleSelectUser = (user: MessageUser) => {
    setNewMessageUserId(user.id)
    setUserSearchQuery(user.name || user.handle || user.email || "")
    setUserSearchResults([])
    setShowUserSearch(false)
  }

  const handleStartNewMessage = async () => {
    if (!newMessageUserId.trim() || !newMessageText.trim()) {
      alert("Please select a user and enter a message")
      return
    }
    try {
      const threadResponse = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newMessageUserId }),
      })

      if (threadResponse.ok) {
        const thread = await threadResponse.json()
        const messageResponse = await fetch(`/api/messages/threads/${thread.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessageText }),
        })

        if (messageResponse.ok) {
          setNewMessageUserId("")
          setNewMessageText("")
          setUserSearchQuery("")
          setShowNewMessage(false)
          window.location.reload()
        }
      }
    } catch (error) {
      console.error("Error starting new message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Thread List */}
      <Card className="w-80 flex flex-col overflow-hidden p-0">
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={cn(
              "flex-1 px-4 py-3 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === "inbox"
                ? "text-primary border-b-2 border-primary -mb-px bg-secondary/30"
                : "text-muted-foreground hover:bg-secondary/30",
            )}
          >
            Inbox ({inboxThreads.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={cn(
              "flex-1 px-4 py-3 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === "sent"
                ? "text-primary border-b-2 border-primary -mb-px bg-secondary/30"
                : "text-muted-foreground hover:bg-secondary/30",
            )}
          >
            Sent ({sentThreads.length})
          </button>
        </div>

        <div className="p-3 border-b border-border">
          <Button
            type="button"
            onClick={() => setShowNewMessage(!showNewMessage)}
            size="sm"
            className="w-full gap-1.5"
          >
            {showNewMessage ? (
              "Cancel"
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden /> New Message
              </>
            )}
          </Button>
        </div>

        {showNewMessage && (
          <div className="p-3 border-b border-border bg-secondary/30 relative space-y-2">
            <div className="relative">
              <Input
                type="text"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value)
                  setShowUserSearch(true)
                  if (!e.target.value) setNewMessageUserId("")
                }}
                onFocus={() => setShowUserSearch(true)}
                placeholder="Search users by name, handle, or email…"
                aria-label="Search users"
              />
              {showUserSearch && userSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-3 py-2 text-left hover:bg-secondary/40 flex items-center space-x-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs flex-shrink-0 border border-border overflow-hidden">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || "User"}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          user.name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {user.name || "Anonymous"}
                        </p>
                        {(user.handle || user.email) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.handle ? `@${user.handle}` : user.email}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {newMessageUserId && (
              <div className="px-2 py-1 bg-primary/10 rounded text-xs text-primary border border-primary/30">
                Selected: {userSearchQuery}
              </div>
            )}
            <Textarea
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type your message…"
              rows={3}
              className="resize-none text-sm"
            />
            <Button
              type="button"
              onClick={handleStartNewMessage}
              disabled={!newMessageUserId || !newMessageText.trim()}
              className="w-full gap-1.5"
              size="sm"
            >
              <Send className="h-3.5 w-3.5" aria-hidden /> Send
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {displayedThreads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p>No {activeTab === "inbox" ? "received" : "sent"} messages yet</p>
            </div>
          ) : (
            displayedThreads.map((thread) => {
              const otherUser = getOtherUser(thread)
              const lastMessage = thread.messages?.[0]
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThread(thread)}
                  className={cn(
                    "w-full p-3 text-left border-b border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedThread?.id === thread.id
                      ? "bg-secondary"
                      : "hover:bg-secondary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold flex-shrink-0 border border-border overflow-hidden">
                      {otherUser.image ? (
                        <Image
                          src={otherUser.image}
                          alt={otherUser.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        otherUser.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">
                        {otherUser.name || "Anonymous"}
                      </p>
                      {lastMessage ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </Card>

      {/* Message Panel */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        {selectedThread ? (
          <>
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {getOtherUser(selectedThread).name || "Anonymous"}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <p>No messages in this conversation yet.</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isSent = message.senderId === currentUserId
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isSent ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-xs lg:max-w-md px-3 py-2 rounded-md text-sm",
                          isSent
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground border border-border",
                        )}
                      >
                        {!isSent && message.sender && (
                          <p className="text-xs font-semibold mb-1 opacity-80">
                            {message.sender.name || "Anonymous"}
                          </p>
                        )}
                        <p>{message.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            isSent
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground",
                          )}
                        >
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-3 border-t border-border space-y-2">
              {messageSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                      AI Suggestions
                    </span>
                    <button
                      type="button"
                      onClick={() => setMessageSuggestions([])}
                      className="text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {messageSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMessageText(suggestion.text)
                          setMessageSuggestions([])
                        }}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        <Badge
                          variant="outline"
                          className="text-primary border-primary/30 cursor-pointer"
                        >
                          {suggestion.text}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message…"
                  aria-label="Message text"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={loadSuggestions}
                  disabled={loadingSuggestions || !selectedThread}
                  title="Get AI suggestions"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                </Button>
                <Button type="button" onClick={handleSendMessage} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" aria-hidden /> Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            <p>Select a conversation to start messaging.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
