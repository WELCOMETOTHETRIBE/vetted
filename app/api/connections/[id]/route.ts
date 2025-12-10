import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateConnectionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connectionId = params.id
    const body = await req.json()
    const { status } = updateConnectionSchema.parse(body)

    // Verify user is the receiver
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    })

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    if (connection.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status },
    })

    // Create notification for requester if accepted
    if (status === "ACCEPTED") {
      await prisma.notification.create({
        data: {
          userId: connection.requesterId,
          type: "CONNECTION_ACCEPTED",
          title: "Connection Accepted",
          message: `${session.user.name || "Someone"} accepted your connection request`,
          link: `/profile/${session.user.handle || session.user.id}`,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Update connection error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

