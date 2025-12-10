import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    const results: any = {
      people: [],
      jobs: [],
      companies: [],
      groups: [],
    }

    if (type === "all" || type === "people") {
      results.people = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { handle: { contains: query, mode: "insensitive" } },
            { profile: { headline: { contains: query, mode: "insensitive" } } },
            { profile: { location: { contains: query, mode: "insensitive" } } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          image: true,
          handle: true,
          email: true,
          profile: {
            select: {
              headline: true,
              location: true,
            },
          },
        },
        take: 20,
      })
    }

    if (type === "all" || type === "jobs") {
      results.jobs = await prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { company: { name: { contains: query, mode: "insensitive" } } },
          ],
          isActive: true,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        take: 10,
      })
    }

    if (type === "all" || type === "companies") {
      results.companies = await prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { industry: { contains: query, mode: "insensitive" } },
          ],
          isActive: true,
        },
        take: 10,
      })
    }

    if (type === "all" || type === "groups") {
      results.groups = await prisma.group.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          isActive: true,
        },
        take: 10,
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

