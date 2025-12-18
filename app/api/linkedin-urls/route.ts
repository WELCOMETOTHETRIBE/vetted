import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/linkedin-urls
 * 
 * Fetches LinkedIn profile URLs from the database.
 * Requires authentication and admin role.
 * 
 * Query parameters:
 * - page: page number (default: 1)
 * - limit: items per page (default: 50)
 * - search: search term to filter URLs, queries, locations, etc.
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100) // Max 100
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Build where clause for search
    const where: any = {}
    if (search.trim()) {
      where.OR = [
        { url: { contains: search, mode: "insensitive" } },
        { searchQuery: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ]
    }

    const [urls, total] = await Promise.all([
      prisma.linkedInProfileUrl.findMany({
        where,
        include: {
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.linkedInProfileUrl.count({ where }),
    ])

    return NextResponse.json({
      urls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error("[linkedin-urls] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch LinkedIn URLs",
        message: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

