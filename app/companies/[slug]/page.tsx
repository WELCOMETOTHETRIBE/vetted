import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import Image from "next/image"

async function getCompany(slug: string) {
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
        take: 10,
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
        take: 20,
      },
      posts: {
        where: { isActive: true },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              handle: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
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

  const company = await getCompany(slug)

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Company not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          {company.banner && (
            <div className="h-48 bg-gray-200 relative">
              <Image
                src={company.banner}
                alt={company.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start gap-6">
              {company.logo && (
                <div className="w-24 h-24 bg-white rounded-lg border border-gray-200 flex items-center justify-center relative">
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {company.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  {company.industry && (
                    <span className="flex items-center gap-1">
                      <span>🏭</span>
                      {company.industry}
                    </span>
                  )}
                  {company.size && (
                    <span className="flex items-center gap-1">
                      <span>👥</span>
                      {company.size} employees
                    </span>
                  )}
                  {company.location && (
                    <span className="flex items-center gap-1">
                      <span>📍</span>
                      {company.location}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <span>🌐</span>
                      Website
                    </a>
                  )}
                </div>
                {company.about && (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {company.about}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">
              {company._count.employees}
            </div>
            <div className="text-sm text-gray-600">Employees</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">
              {company._count.jobs}
            </div>
            <div className="text-sm text-gray-600">Open Jobs</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">
              {company._count.posts}
            </div>
            <div className="text-sm text-gray-600">Posts</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Open Positions
              </h2>
              {company.jobs.length > 0 ? (
                <div className="space-y-4">
                  {company.jobs.map((job: { id: string; title: string; location: string | null; type: string | null }) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.type && <span>• {job.type}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No open positions at the moment.</p>
              )}
            </div>

            {/* Recent Posts */}
            {company.posts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Posts
                </h2>
                <div className="space-y-4">
                  {company.posts.map((post: { id: string; content: string; createdAt: Date; author: { id: string; name: string | null; image: string | null; handle: string | null } }) => (
                    <Link
                      key={post.id}
                      href={`/feed`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {post.author.image && (
                          <Image
                            src={post.author.image}
                            alt={post.author.name || "User"}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {post.author.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 line-clamp-2">
                        {post.content}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Employees Sidebar */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Employees ({company._count.employees})
            </h2>
            {company.employees.length > 0 ? (
              <div className="space-y-3">
                {company.employees.map((exp: { id: string; title: string; user: { id: string; name: string | null; image: string | null; handle: string | null } }) => (
                  <Link
                    key={exp.id}
                    href={`/profile/${exp.user.handle || exp.user.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {exp.user.image ? (
                      <Image
                        src={exp.user.image}
                        alt={exp.user.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        {exp.user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {exp.user.name || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {exp.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No employees listed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

