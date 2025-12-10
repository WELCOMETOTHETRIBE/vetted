import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createConnectionSchema = z.object({
  receiverId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { receiverId } = createConnectionSchema.parse(body)

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot connect to yourself" },
        { status: 400 }
      )
    }

    // Check if connection already exists (check both directions)
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId },
          { requesterId: receiverId, receiverId: session.user.id },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      )
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId: session.user.id,
        receiverId,
        status: "PENDING",
      },
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "CONNECTION_REQUEST",
        title: "New Connection Request",
        message: `${session.user.name || "Someone"} wants to connect with you`,
        link: `/network`,
      },
    })

    return NextResponse.json(connection, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create connection error:", error)
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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where: any = {
      OR: [
        { requesterId: session.user.id },
        { receiverId: session.user.id },
      ],
    }

    if (status) {
      where.status = status
    }

    const connections = await prisma.connection.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(connections)
  } catch (error) {
    console.error("Get connections error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

