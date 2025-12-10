import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import Image from "next/image"
import JobCard from "@/components/JobCard"

async function getCompany(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      jobs: {
        where: { isActive: true },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          applications: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
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
        take: 5,
      },
    },
  })

  return company
}

export default async function CompanyPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const company = await getCompany(params.slug)

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start space-x-6">
            {company.logo && (
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🏢</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
              {company.industry && (
                <p className="text-gray-600 mb-2">{company.industry}</p>
              )}
              {company.location && (
                <p className="text-gray-600 mb-2">📍 {company.location}</p>
              )}
              {company.size && (
                <p className="text-gray-600 mb-2">👥 {company.size} employees</p>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {company.website}
                </a>
              )}
            </div>
          </div>
          {company.about && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{company.about}</p>
            </div>
          )}
        </div>

        {/* Jobs */}
        {company.jobs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <div className="space-y-4">
              {company.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts */}
        {company.posts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Posts</h2>
            <div className="space-y-4">
              {company.posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Link href={`/profile/${post.author.handle || post.author.id}`}>
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        {post.author.image ? (
                          <Image
                            src={post.author.image}
                            alt={post.author.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          post.author.name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                    </Link>
                    <div>
                      <Link
                        href={`/profile/${post.author.handle || post.author.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {post.author.name || "Anonymous"}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

