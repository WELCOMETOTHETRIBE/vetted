import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createThreadSchema = z.object({
  userId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { userId } = createThreadSchema.parse(body)

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      )
    }

    // Check if thread already exists
    const existing = await prisma.messageThread.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: userId },
          { user1Id: userId, user2Id: session.user.id },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    // Create new thread
    const thread = await prisma.messageThread.create({
      data: {
        user1Id: session.user.id,
        user2Id: userId,
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
      },
    })

    return NextResponse.json(thread, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create thread error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all threads for the current user
    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(threads)
  } catch (error) {
    console.error("Get threads error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

