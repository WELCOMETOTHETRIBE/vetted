import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  industry: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  website: z.string().url().optional().nullable(),
  about: z.string().max(2000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const industry = searchParams.get("industry") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { industry: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ]
    }

    if (industry) {
      where.industry = { contains: industry, mode: "insensitive" as const }
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              employees: true,
              jobs: true,
              posts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ])

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get companies error:", error)
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

    // Only admins can create companies
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validated = createCompanySchema.parse(body)

    // Generate slug from name if not provided
    let slug = validated.slug || validated.name
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if slug exists
    const existing = await prisma.company.findUnique({
      where: { slug },
    })

    const finalSlug = existing
      ? `${slug}-${Date.now().toString(36)}`
      : slug

    const company = await prisma.company.create({
      data: {
        name: validated.name,
        slug: finalSlug,
        industry: validated.industry,
        size: validated.size,
        location: validated.location,
        website: validated.website,
        about: validated.about,
        logo: validated.logo,
        banner: validated.banner,
      },
      include: {
        _count: {
          select: {
            employees: true,
            jobs: true,
            posts: true,
          },
        },
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Create company error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

