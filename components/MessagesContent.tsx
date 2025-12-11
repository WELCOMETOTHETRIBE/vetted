"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

interface MessagesContentProps {
  initialThreads: any[]
  currentUserId: string
}

export default function MessagesContent({
  initialThreads,
  currentUserId,
}: MessagesContentProps) {
  const [threads, setThreads] = useState(initialThreads)
  const [selectedThread, setSelectedThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox")
  const [messageSuggestions, setMessageSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [newMessageUserId, setNewMessageUserId] = useState("")
  const [newMessageText, setNewMessageText] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<any[]>([])
  const [showUserSearch, setShowUserSearch] = useState(false)

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadMessages(selectedThread.id)
      }, 5000)
      return () => clearInterval(interval)
    }
    setMessageSuggestions([])
  }, [selectedThread])

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

  const getOtherUser = (thread: any) => {
    return thread.user1Id === currentUserId ? thread.user2 : thread.user1
  }

  // Filter threads by inbox (received) or sent
  const inboxThreads = threads.filter((thread) => {
    const lastMessage = thread.messages?.[0]
    return lastMessage && lastMessage.senderId !== currentUserId
  })

  const sentThreads = threads.filter((thread) => {
    const lastMessage = thread.messages?.[0]
    return lastMessage && lastMessage.senderId === currentUserId
  })

  const displayedThreads = activeTab === "inbox" ? inboxThreads : sentThreads

  // Search for users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=people`)
      if (response.ok) {
        const data = await response.json()
        setUserSearchResults(data.people || [])
      }
    } catch (error) {
      console.error("Error searching users:", error)
    }
  }

  useEffect(() => {
    if (userSearchQuery) {
      const timeoutId = setTimeout(() => {
        searchUsers(userSearchQuery)
      }, 300) // Debounce search
      return () => clearTimeout(timeoutId)
    } else {
      setUserSearchResults([])
    }
  }, [userSearchQuery])

  const handleSelectUser = (user: any) => {
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
      // Create or get thread
      const threadResponse = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newMessageUserId }),
      })

      if (threadResponse.ok) {
        const thread = await threadResponse.json()
        
        // Send first message
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
          // Reload threads
          window.location.reload()
        }
      }
    } catch (error) {
      console.error("Error starting new message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Thread List */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 px-4 py-3 font-medium text-sm ${
              activeTab === "inbox"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Inbox ({inboxThreads.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 px-4 py-3 font-medium text-sm ${
              activeTab === "sent"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Sent ({sentThreads.length})
          </button>
        </div>

        {/* New Message Button */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={() => setShowNewMessage(!showNewMessage)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showNewMessage ? "Cancel" : "+ New Message"}
          </button>
        </div>

        {/* New Message Form */}
        {showNewMessage && (
          <div className="p-3 border-b border-gray-200 bg-gray-50 relative">
            <div className="relative mb-2">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value)
                  setShowUserSearch(true)
                  if (!e.target.value) {
                    setNewMessageUserId("")
                  }
                }}
                onFocus={() => setShowUserSearch(true)}
                placeholder="Search for a user by name, handle, or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              {showUserSearch && userSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
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
                        <p className="font-medium text-gray-900 truncate">
                          {user.name || "Anonymous"}
                        </p>
                        {(user.handle || user.email) && (
                          <p className="text-xs text-gray-500 truncate">
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
              <div className="mb-2 px-2 py-1 bg-blue-50 rounded text-sm text-blue-700">
                Selected: {userSearchQuery}
              </div>
            )}
            <textarea
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full px-3 py-2 mb-2 border border-gray-300 rounded text-sm resize-none"
            />
            <button
              onClick={handleStartNewMessage}
              disabled={!newMessageUserId || !newMessageText.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        )}

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {displayedThreads.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p>No {activeTab === "inbox" ? "received" : "sent"} messages yet</p>
            </div>
          ) : (
            displayedThreads.map((thread) => {
              const otherUser = getOtherUser(thread)
              const lastMessage = thread.messages?.[0]
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 ${
                    selectedThread?.id === thread.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {otherUser.image ? (
                        <Image
                          src={otherUser.image}
                          alt={otherUser.name || "User"}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        otherUser.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {otherUser.name || "Anonymous"}
                      </p>
                      {lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {lastMessage.content}
                        </p>
                      )}
                      {!lastMessage && (
                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Message Panel */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        {selectedThread ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {getOtherUser(selectedThread).name || "Anonymous"}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No messages in this conversation yet</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isSent = message.senderId === currentUserId
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isSent
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        {!isSent && message.sender && (
                          <p className="text-xs font-semibold mb-1 text-gray-700">
                            {message.sender.name || "Anonymous"}
                          </p>
                        )}
                        <p className={isSent ? "text-white" : "text-gray-900"}>
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isSent ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              {messageSuggestions.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span>🤖</span>
                      <span>AI Suggestions</span>
                    </span>
                    <button
                      onClick={() => setMessageSuggestions([])}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {messageSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMessageText(suggestion.text)
                          setMessageSuggestions([])
                        }}
                        className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                      >
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={loadSuggestions}
                  disabled={loadingSuggestions || !selectedThread}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-1"
                  title="Get AI suggestions"
                >
                  {loadingSuggestions ? "..." : "🤖"}
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}

