import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await context.params
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already a member
    const existing = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 })
    }

    const membership = await prisma.groupMembership.create({
      data: {
        groupId,
        userId: session.user.id,
        role: "MEMBER",
      },
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    console.error("Join group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

