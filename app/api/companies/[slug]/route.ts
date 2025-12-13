import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  industry: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  website: z.string().url().optional().nullable(),
  about: z.string().max(2000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
})

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params

    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        jobs: {
          where: { isActive: true },
          include: {
            postedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        employees: {
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
        },
        _count: {
          select: {
            employees: true,
            jobs: true,
            posts: true,
          },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error("Get company error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update companies
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const company = await prisma.company.findUnique({
      where: { slug },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const body = await req.json()
    const validated = updateCompanySchema.parse(body)

    const updated = await prisma.company.update({
      where: { slug },
      data: validated,
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

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Update company error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete companies
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const company = await prisma.company.findUnique({
      where: { slug },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Soft delete
    await prisma.company.update({
      where: { slug },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete company error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

