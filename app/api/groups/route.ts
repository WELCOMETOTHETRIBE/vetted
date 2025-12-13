import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  coverImage: z.string().url().optional().nullable(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          memberships: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              memberships: true,
              posts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.group.count({ where }),
    ])

    return NextResponse.json({
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get groups error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validated = createGroupSchema.parse(body)

    // Generate slug from name
    const slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if slug exists
    const existing = await prisma.group.findUnique({
      where: { slug },
    })

    const finalSlug = existing
      ? `${slug}-${Date.now().toString(36)}`
      : slug

    const group = await prisma.group.create({
      data: {
        name: validated.name,
        slug: finalSlug,
        description: validated.description,
        isPublic: validated.isPublic,
        coverImage: validated.coverImage,
        ownerId: session.user.id,
      },
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

    // Auto-join creator as admin
    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: "ADMIN",
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Create group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

