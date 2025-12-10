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

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadMessages(selectedThread.id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedThread])

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

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Thread List */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p>No messages yet</p>
          </div>
        ) : (
          threads.map((thread) => {
            const otherUser = getOtherUser(thread)
            const lastMessage = thread.messages[0]
            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 ${
                  selectedThread?.id === thread.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
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
                  </div>
                </div>
              </button>
            )
          })
        )}
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === currentUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUserId
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === currentUserId
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
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

