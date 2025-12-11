import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { detectSpam } from "@/lib/ai/content-ai"

const sendMessageSchema = z.object({
  content: z.string().min(1),
})

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: threadId } = await context.params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is part of thread
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    if (thread.user1Id !== session.user.id && thread.user2Id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({ thread, messages })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: threadId } = await context.params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const { content } = sendMessageSchema.parse(body)

    // Check for spam (non-blocking)
    detectSpam(content)
      .then((spamResult) => {
        if (spamResult.isSpam && spamResult.confidence > 70) {
          console.warn("Potential spam in message:", {
            userId: session.user.id,
            threadId,
            confidence: spamResult.confidence,
            reason: spamResult.reason,
          })
        }
      })
      .catch((error) => {
        console.error("Error checking spam (non-blocking):", error)
      })

    // Verify user is part of thread
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    if (thread.user1Id !== session.user.id && thread.user2Id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: session.user.id,
        content,
      },
    })

    // Update thread timestamp
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    })

    // Create notification for recipient
    const recipientId =
      thread.user1Id === session.user.id ? thread.user2Id : thread.user1Id
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "MESSAGE_RECEIVED",
        title: "New Message",
        message: `${session.user.name || "Someone"} sent you a message`,
        link: `/messages`,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Send message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

