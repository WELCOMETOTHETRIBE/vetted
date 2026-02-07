import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Audience = "CANDIDATE" | "EMPLOYER" | "ADMIN"

const STOPWORDS = new Set(
  [
    "the","and","for","with","from","into","that","this","are","was","were","will","have","has","had","you","your",
    "our","their","they","them","his","her","she","him","its","it","a","an","to","of","in","on","at","by","as",
    "or","not","be","is","we","i","me","my","us","but","if","then","than","so","can","could","should","would",
    "about","over","under","within","across","per","etc","using","use","used","via","role","roles","job","jobs",
  ]
)

function normalizeToken(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9+#.-]/g, "")
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/g)
    .map(normalizeToken)
    .filter(Boolean)
}

function extractKeywords(text: string, limit = 20): string[] {
  const counts = new Map<string, number>()
  for (const token of tokenize(text)) {
    if (token.length < 4) continue
    if (STOPWORDS.has(token)) continue
    counts.set(token, (counts.get(token) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k)
}

function scoreJob(jobText: string, skills: string[], keywords: string[]) {
  const haystack = new Set(tokenize(jobText))
  const matchedSkills: string[] = []
  const matchedKeywords: string[] = []

  for (const s of skills) {
    const tok = normalizeToken(s)
    if (!tok) continue
    if (haystack.has(tok)) matchedSkills.push(s)
  }
  for (const k of keywords) {
    if (haystack.has(k)) matchedKeywords.push(k)
  }

  // Skills matter more than keywords from resume/profile text.
  const score = matchedSkills.length * 3 + matchedKeywords.length
  return { score, matchedSkills, matchedKeywords }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, accountType: true },
    })

    const audience: Audience =
      dbUser?.role === "ADMIN" ? "ADMIN" : (dbUser?.accountType || "CANDIDATE")

    if (audience === "ADMIN") {
      const tickets = await prisma.opsTicket.findMany({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        take: 20,
      })
      return NextResponse.json({
        audience,
        updates: tickets.map((t) => ({
          type: "opsTicket",
          id: t.id,
          ticketType: t.type,
          status: t.status,
          priority: t.priority,
          title: t.title,
          description: t.description,
          updatedAt: t.updatedAt,
          createdAt: t.createdAt,
        })),
      })
    }

    if (audience === "EMPLOYER") {
      const [recentCandidates, newUsers] = await Promise.all([
        prisma.candidate.findMany({
          orderBy: { createdAt: "desc" },
          take: 15,
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            currentCompany: true,
            location: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.user.findMany({
          where: { accountType: "CANDIDATE", isActive: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, name: true, handle: true, createdAt: true },
        }),
      ])

      const updates = [
        ...recentCandidates.map((c) => ({
          type: "candidate",
          id: c.id,
          fullName: c.fullName,
          jobTitle: c.jobTitle,
          currentCompany: c.currentCompany,
          location: c.location,
          status: c.status,
          createdAt: c.createdAt,
        })),
        ...newUsers.map((u) => ({
          type: "newUser",
          id: u.id,
          name: u.name,
          handle: u.handle,
          createdAt: u.createdAt,
        })),
      ]

      return NextResponse.json({ audience, updates })
    }

    // Candidate audience
    const [profile, userSkills] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId: session.user.id },
        select: { headline: true, about: true, resumeText: true },
      }),
      prisma.userSkill.findMany({
        where: { userId: session.user.id },
        include: { skill: { select: { name: true } } },
        take: 25,
      }),
    ])

    const skills = userSkills
      .map((us) => us.skill?.name)
      .filter((s): s is string => !!s)

    const keywordSource = [
      profile?.headline || "",
      profile?.about || "",
      profile?.resumeText || "",
    ].join("\n")

    const keywords = extractKeywords(keywordSource, 25)

    // Fetch a window of recent jobs to rank
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        company: { select: { name: true, slug: true } },
      },
    })

    const scored = jobs
      .map((j) => {
        const jobText = `${j.title}\n${j.description || ""}\n${j.requirements || ""}`
        const { score, matchedSkills, matchedKeywords } = scoreJob(jobText, skills, keywords)
        return {
          job: j,
          score,
          matchedSkills,
          matchedKeywords,
        }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)

    return NextResponse.json({
      audience,
      updates: scored.map((s) => ({
        type: "job",
        id: s.job.id,
        title: s.job.title,
        company: s.job.company?.name,
        companySlug: s.job.company?.slug,
        location: s.job.location,
        isRemote: s.job.isRemote,
        isHybrid: s.job.isHybrid,
        createdAt: s.job.createdAt,
        score: s.score,
        matchedSkills: s.matchedSkills.slice(0, 8),
        matchedKeywords: s.matchedKeywords.slice(0, 8),
      })),
      inputs: {
        skillsCount: skills.length,
        keywordsCount: keywords.length,
        hasResumeText: !!profile?.resumeText,
      },
    })
  } catch (error: any) {
    console.error("Mission updates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

