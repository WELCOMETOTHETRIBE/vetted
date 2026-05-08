import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import CandidatesContent from "@/components/CandidatesContent"

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic"
export const revalidate = 0

async function getCandidates(searchParams: { [key: string]: string | undefined }) {
  const search = searchParams.search
  const status = searchParams.status
  const page = parseInt(searchParams.page || "1")
  const limit = parseInt(searchParams.limit || "50")
  const skip = (page - 1) * limit

  const where: any = {}

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { currentCompany: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { linkedinUrl: { contains: search, mode: "insensitive" } },
    ]
  }

  if (status) {
    where.status = status
  }

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: {
        addedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.candidate.count({ where }),
  ])

  return { candidates, total, page, limit }
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  try {
    const params = await searchParams
    const session = await auth()
    if (!session?.user) {
      redirect("/auth/signin")
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, accountType: true },
    })

    const canAccess = user?.role === "ADMIN" || user?.accountType === "EMPLOYER"
    if (!canAccess) {
      redirect("/feed")
    }

    const data = await getCandidates(params)

    return (
      <ClearDShell
        viewer={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          accountType: session.user.accountType,
        }}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="Talent Pool"
            description="Cleared candidates surfaced from your sources, with mission-fit context."
          />
          <Suspense
            fallback={
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            }
          >
            <CandidatesContent
              initialCandidates={data.candidates}
              initialTotal={data.total}
              initialPage={data.page}
              initialLimit={data.limit}
            />
          </Suspense>
        </div>
      </ClearDShell>
    )
  } catch (error) {
    const e = error as { message?: string; code?: string }
    console.error("Candidates page error:", e)
    if (
      e.message?.includes("Unknown column") ||
      e.message?.includes("column") ||
      e.code === "P2021"
    ) {
      return (
        <ClearDShell
          viewer={{
            name: null,
            email: "",
            role: "USER",
            accountType: "CANDIDATE",
          }}
        >
          <div className="max-w-7xl mx-auto py-8">
            <Alert variant="warning">
              <AlertTitle>Database Migration Required</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  The database schema needs to be updated to include the new AI fields.
                  Please run the migration:
                </p>
                <code className="block bg-secondary px-2 py-1 rounded text-xs font-mono border border-border">
                  railway run npm run db:push
                </code>
                <p className="text-xs">
                  Or use the migration endpoint:{" "}
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono border border-border">
                    POST /api/admin/migrate
                  </code>
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </ClearDShell>
      )
    }
    throw error
  }
}
