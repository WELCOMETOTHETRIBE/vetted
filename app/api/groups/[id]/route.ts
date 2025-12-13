import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
  coverImage: z.string().url().optional().nullable(),
})

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            handle: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                handle: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        _count: {
          select: {
            memberships: true,
            posts: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if user is member
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({
      ...group,
      isMember: !!membership,
      userRole: membership?.role || null,
    })
  } catch (error) {
    console.error("Get group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: session.user.id,
        },
      },
    })

    const group = await prisma.group.findUnique({
      where: { id },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    if (group.ownerId !== session.user.id && membership?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validated = updateGroupSchema.parse(body)

    const updateData: any = { ...validated }

    // If name changed, update slug
    if (validated.name && validated.name !== group.name) {
      const slug = validated.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const existing = await prisma.group.findUnique({
        where: { slug },
      })

      updateData.slug = existing ? `${slug}-${Date.now().toString(36)}` : slug
    }

    const updated = await prisma.group.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            posts: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Update group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Only owner can delete
    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Soft delete
    await prisma.group.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

