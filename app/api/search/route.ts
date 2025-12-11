import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enhanceSearchQuery } from "@/lib/ai/semantic-search"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"
    const useAI = searchParams.get("ai") !== "false" // Default to true

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    // Enhance query with semantic understanding if AI is enabled
    const searchTerms = useAI ? await enhanceSearchQuery(query) : [query]

    const results: any = {
      people: [],
      jobs: [],
      companies: [],
      groups: [],
    }

    if (type === "all" || type === "people") {
      // Build OR conditions for all search terms
      const peopleWhere = {
        OR: searchTerms.flatMap(term => [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { handle: { contains: term, mode: "insensitive" } },
          { profile: { headline: { contains: term, mode: "insensitive" } } },
          { profile: { location: { contains: term, mode: "insensitive" } } },
        ]),
        isActive: true,
      }

      results.people = await prisma.user.findMany({
        where: peopleWhere,
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
      const jobsWhere = {
        OR: searchTerms.flatMap(term => [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { company: { name: { contains: term, mode: "insensitive" } } },
        ]),
        isActive: true,
      }

      results.jobs = await prisma.job.findMany({
        where: jobsWhere,
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
      const companiesWhere = {
        OR: searchTerms.flatMap(term => [
          { name: { contains: term, mode: "insensitive" } },
          { industry: { contains: term, mode: "insensitive" } },
        ]),
        isActive: true,
      }

      results.companies = await prisma.company.findMany({
        where: companiesWhere,
        take: 10,
      })
    }

    if (type === "all" || type === "groups") {
      const groupsWhere = {
        OR: searchTerms.flatMap(term => [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ]),
        isActive: true,
      }

      results.groups = await prisma.group.findMany({
        where: groupsWhere,
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

