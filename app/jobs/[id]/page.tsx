import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import JobApplicationForm from "@/components/JobApplicationForm"

async function getJob(jobId: string, userId?: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: true,
      postedBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      applications: userId
        ? {
            where: { applicantId: userId },
            select: { id: true, status: true },
          }
        : false,
    },
  })

  if (job && userId) {
    // Increment view count
    await prisma.job.update({
      where: { id: jobId },
      data: { views: { increment: 1 } },
    })
  }

  return job
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const job = await getJob(id, session.user.id)

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Job not found</p>
          </div>
        </div>
      </div>
    )
  }

  const hasApplied = job.applications && job.applications.length > 0
  const application = hasApplied ? job.applications[0] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="mb-6">
            <Link
              href={`/company/${job.company.slug}`}
              className="text-blue-600 hover:underline text-sm"
            >
              {job.company.name}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-600">
              <span>
                {job.isRemote
                  ? "Remote"
                  : job.isHybrid
                  ? `Hybrid • ${job.location || "Location TBD"}`
                  : job.location || "Location TBD"}
              </span>
              <span>•</span>
              <span>{job.employmentType.replace("_", " ")}</span>
              {job.salaryMin && job.salaryMax && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-gray-900">
                    {job.salaryCurrency || "$"}
                    {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="text-gray-700 whitespace-pre-wrap">{job.description}</div>
            {job.requirements && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">
                  Requirements
                </h2>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {job.requirements}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            {hasApplied ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  You have already applied for this position. Status:{" "}
                  <span className="font-semibold">
                    {application?.status.replace("_", " ")}
                  </span>
                </p>
              </div>
            ) : (
              <JobApplicationForm jobId={job.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

