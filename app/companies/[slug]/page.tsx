import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import {
  Briefcase,
  MapPin,
  Users,
  Globe,
  Building2,
} from "lucide-react"
import { ClearDShell } from "@/components/layout/cleard-shell"
import { Card, CardContent } from "@/components/ui/card"

async function getCompany(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      jobs: {
        where: { isActive: true },
        include: { postedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      employees: {
        include: {
          user: {
            select: { id: true, name: true, image: true, handle: true },
          },
        },
        take: 20,
      },
      posts: {
        where: { isActive: true },
        include: {
          author: {
            select: { id: true, name: true, image: true, handle: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { employees: true, jobs: true, posts: true } },
    },
  })

  return company
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const viewer = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    accountType: session.user.accountType,
  }

  const company = await getCompany(slug)

  if (!company) {
    return (
      <ClearDShell viewer={viewer}>
        <div className="max-w-4xl mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Company not found.</p>
            </CardContent>
          </Card>
        </div>
      </ClearDShell>
    )
  }

  return (
    <ClearDShell viewer={viewer}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Company Header */}
        <Card className="overflow-hidden">
          {company.banner && (
            <div className="h-40 bg-secondary relative">
              <Image
                src={company.banner}
                alt={company.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex items-start gap-6 flex-wrap">
              {company.logo ? (
                <div className="w-20 h-20 bg-secondary rounded-md border border-border flex items-center justify-center relative p-1.5">
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-md bg-primary/15 text-primary flex items-center justify-center text-2xl font-semibold border border-border">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
                  {company.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  {company.industry && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" aria-hidden />
                      {company.industry}
                    </span>
                  )}
                  {company.size && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {company.size} employees
                    </span>
                  )}
                  {company.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {company.location}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      <Globe className="h-3.5 w-3.5" aria-hidden />
                      Website
                    </a>
                  )}
                </div>
                {company.about && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {company.about}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-semibold text-foreground">
                {company._count.employees}
              </div>
              <div className="text-sm text-muted-foreground">Employees</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-semibold text-foreground">
                {company._count.jobs}
              </div>
              <div className="text-sm text-muted-foreground">Open Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-semibold text-foreground">
                {company._count.posts}
              </div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-foreground mb-4 inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" aria-hidden />
                  Open Positions
                </h2>
                {company.jobs.length > 0 ? (
                  <div className="space-y-3">
                    {company.jobs.map(
                      (job: {
                        id: string
                        title: string
                        location: string | null
                        type: string | null
                      }) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block p-4 border border-border rounded-md hover:border-primary/40 hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <h3 className="font-semibold text-foreground mb-1">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {job.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" aria-hidden />
                                {job.location}
                              </span>
                            )}
                            {job.type && <span>• {job.type}</span>}
                          </div>
                        </Link>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No open positions at the moment.
                  </p>
                )}
              </CardContent>
            </Card>

            {company.posts.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-semibold text-foreground mb-4">
                    Recent Posts
                  </h2>
                  <div className="space-y-3">
                    {company.posts.map(
                      (post: {
                        id: string
                        content: string
                        createdAt: Date
                        author: {
                          id: string
                          name: string | null
                          image: string | null
                          handle: string | null
                        }
                      }) => (
                        <Link
                          key={post.id}
                          href="/feed"
                          className="block p-4 border border-border rounded-md hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {post.author.image ? (
                              <Image
                                src={post.author.image}
                                alt={post.author.name || "User"}
                                width={32}
                                height={32}
                                className="rounded-full border border-border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold border border-border">
                                {post.author.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {post.author.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {post.content}
                          </p>
                        </Link>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold text-foreground mb-4 inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden />
                Employees ({company._count.employees})
              </h2>
              {company.employees.length > 0 ? (
                <div className="space-y-2">
                  {company.employees.map(
                    (exp: {
                      id: string
                      title: string
                      user: {
                        id: string
                        name: string | null
                        image: string | null
                        handle: string | null
                      }
                    }) => (
                      <Link
                        key={exp.id}
                        href={`/profile/${exp.user.handle || exp.user.id}`}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {exp.user.image ? (
                          <Image
                            src={exp.user.image}
                            alt={exp.user.name || "User"}
                            width={36}
                            height={36}
                            className="rounded-full border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold border border-border">
                            {exp.user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">
                            {exp.user.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {exp.title}
                          </p>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No employees listed yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ClearDShell>
  )
}
