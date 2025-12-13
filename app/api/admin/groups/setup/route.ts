import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/groups/setup
 * Creates skill/experience-based groups and assigns candidates/jobs to them
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Define groups based on skill/experience tiers
    const groupDefinitions = [
      {
        name: "Senior Engineers (10+ years)",
        slug: "senior-engineers-10-plus-years",
        description: "Experienced senior engineers with 10+ years of experience. Ideal for senior roles, tech leads, and principal positions.",
        experienceLevel: "senior",
        minYears: 10,
        skills: ["leadership", "architecture", "system design", "mentoring"],
      },
      {
        name: "Mid-Level Engineers (5-9 years)",
        slug: "mid-level-engineers-5-9-years",
        description: "Mid-level engineers with 5-9 years of experience. Perfect for senior developer and team lead roles.",
        experienceLevel: "mid",
        minYears: 5,
        maxYears: 9,
        skills: ["full-stack", "backend", "frontend", "api"],
      },
      {
        name: "Junior Engineers (2-4 years)",
        slug: "junior-engineers-2-4-years",
        description: "Junior to mid-level engineers with 2-4 years of experience. Great for growth opportunities and mentorship.",
        experienceLevel: "junior",
        minYears: 2,
        maxYears: 4,
        skills: ["development", "coding", "junior", "entry"],
      },
      {
        name: "Entry-Level Engineers (0-2 years)",
        slug: "entry-level-engineers-0-2-years",
        description: "Entry-level engineers and recent graduates. Perfect for internships, junior roles, and career starters.",
        experienceLevel: "entry",
        maxYears: 2,
        skills: ["entry", "junior", "graduate", "intern"],
      },
      {
        name: "Frontend Specialists",
        slug: "frontend-specialists",
        description: "Frontend developers specializing in React, Vue, Angular, and modern web technologies.",
        experienceLevel: "any",
        skills: ["react", "vue", "angular", "frontend", "javascript", "typescript", "css"],
      },
      {
        name: "Backend Specialists",
        slug: "backend-specialists",
        description: "Backend engineers focused on APIs, databases, microservices, and server-side technologies.",
        experienceLevel: "any",
        skills: ["backend", "api", "database", "microservices", "node", "python", "java", "go"],
      },
      {
        name: "Full-Stack Developers",
        slug: "full-stack-developers",
        description: "Full-stack developers comfortable with both frontend and backend technologies.",
        experienceLevel: "any",
        skills: ["full-stack", "fullstack", "mern", "mean", "stack"],
      },
      {
        name: "AI/ML Engineers",
        slug: "ai-ml-engineers",
        description: "Engineers specializing in artificial intelligence, machine learning, and data science.",
        experienceLevel: "any",
        skills: ["ai", "machine learning", "ml", "data science", "tensorflow", "pytorch", "nlp"],
      },
      {
        name: "DevOps & Infrastructure",
        slug: "devops-infrastructure",
        description: "DevOps engineers, SREs, and infrastructure specialists focused on deployment and operations.",
        experienceLevel: "any",
        skills: ["devops", "sre", "kubernetes", "docker", "aws", "infrastructure", "ci/cd"],
      },
      {
        name: "Product Managers",
        slug: "product-managers",
        description: "Product managers and product owners driving product strategy and development.",
        experienceLevel: "any",
        skills: ["product", "pm", "product management", "strategy"],
      },
      {
        name: "Data Engineers",
        slug: "data-engineers",
        description: "Data engineers building data pipelines, ETL processes, and data infrastructure.",
        experienceLevel: "any",
        skills: ["data engineering", "etl", "data pipeline", "spark", "hadoop", "data"],
      },
      {
        name: "Security Engineers",
        slug: "security-engineers",
        description: "Security engineers and cybersecurity specialists focused on application and infrastructure security.",
        experienceLevel: "any",
        skills: ["security", "cybersecurity", "infosec", "penetration testing", "security engineering"],
      },
    ]

    const results = {
      groupsCreated: 0,
      groupsUpdated: 0,
      candidatesAssigned: 0,
      jobsAssigned: 0,
      groups: [] as any[],
    }

    // Get all candidates and jobs
    const [allCandidates, allJobs, adminUser] = await Promise.all([
      prisma.candidate.findMany({
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          currentCompany: true,
          totalYearsExperience: true,
          rawData: true,
        },
      }),
      prisma.job.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          requirements: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      }),
    ])

    if (!adminUser) {
      return NextResponse.json({ error: "No admin user found" }, { status: 500 })
    }

    // Create or update groups
    for (const groupDef of groupDefinitions) {
      const slug = groupDef.slug

      // Check if group exists
      const existingGroup = await prisma.group.findUnique({
        where: { slug },
      })

      let group
      if (existingGroup) {
        // Update existing group
        group = await prisma.group.update({
          where: { id: existingGroup.id },
          data: {
            name: groupDef.name,
            description: groupDef.description,
            isPublic: true,
            isActive: true,
          },
        })
        results.groupsUpdated++
      } else {
        // Create new group
        group = await prisma.group.create({
          data: {
            name: groupDef.name,
            slug: slug,
            description: groupDef.description,
            ownerId: adminUser.id,
            isPublic: true,
            isActive: true,
          },
        })
        results.groupsCreated++

        // Add admin as member
        await prisma.groupMembership.create({
          data: {
            groupId: group.id,
            userId: adminUser.id,
            role: "ADMIN",
          },
        })
      }

      results.groups.push({
        id: group.id,
        name: group.name,
        slug: group.slug,
      })

      // Collect matching candidates and jobs
      const matchingCandidates: typeof allCandidates = []
      const matchingJobs: typeof allJobs = []

      // Find matching candidates
      for (const candidate of allCandidates) {
        let shouldAssign = false

        // Parse experience years
        let experienceYears = 0
        if (candidate.totalYearsExperience) {
          const match = candidate.totalYearsExperience.match(/(\d+\.?\d*)/)
          if (match) {
            experienceYears = parseFloat(match[1])
          }
        }

        // Check experience level match
        if (groupDef.experienceLevel === "senior" && experienceYears >= (groupDef.minYears || 10)) {
          shouldAssign = true
        } else if (groupDef.experienceLevel === "mid" && experienceYears >= (groupDef.minYears || 5) && experienceYears <= (groupDef.maxYears || 9)) {
          shouldAssign = true
        } else if (groupDef.experienceLevel === "junior" && experienceYears >= (groupDef.minYears || 2) && experienceYears <= (groupDef.maxYears || 4)) {
          shouldAssign = true
        } else if (groupDef.experienceLevel === "entry" && experienceYears <= (groupDef.maxYears || 2)) {
          shouldAssign = true
        } else if (groupDef.experienceLevel === "any") {
          // Check skill match for skill-based groups
          const candidateText = `${candidate.jobTitle || ""} ${candidate.currentCompany || ""} ${candidate.rawData || ""}`.toLowerCase()
          const hasMatchingSkill = groupDef.skills.some((skill) =>
            candidateText.includes(skill.toLowerCase())
          )
          if (hasMatchingSkill) {
            shouldAssign = true
          }
        }

        if (shouldAssign) {
          matchingCandidates.push(candidate)
        }
      }

      // Find matching jobs
      for (const job of allJobs) {
        const jobText = `${job.title} ${job.description || ""} ${job.requirements || ""}`.toLowerCase()

        let shouldAssign = false

        // Check if job matches group criteria
        if (groupDef.skills) {
          const hasMatchingSkill = groupDef.skills.some((skill) =>
            jobText.includes(skill.toLowerCase())
          )
          if (hasMatchingSkill) {
            shouldAssign = true
          }
        }

        // Check experience level keywords in job description
        if (groupDef.experienceLevel === "senior" && (jobText.includes("senior") || jobText.includes("lead") || jobText.includes("principal") || jobText.includes("10+") || jobText.includes("10 years"))) {
          shouldAssign = true
        } else if (groupDef.experienceLevel === "mid" && (jobText.includes("mid") || jobText.includes("5+") || jobText.includes("5 years"))) {
          shouldAssign = true
        } else if (groupDef.experienceLevel === "junior" && (jobText.includes("junior") || jobText.includes("2+") || jobText.includes("2 years"))) {
          shouldAssign = true
        } else if (groupDef.experienceLevel === "entry" && (jobText.includes("entry") || jobText.includes("intern") || jobText.includes("graduate") || jobText.includes("0-2"))) {
          shouldAssign = true
        }

        if (shouldAssign) {
          matchingJobs.push(job)
        }
      }

      // Create summary posts instead of individual posts
      // Delete existing summary posts for this group first
      await prisma.post.deleteMany({
        where: {
          groupId: group.id,
          authorId: adminUser.id,
          content: {
            startsWith: "📊 Group Summary",
          },
        },
      })

      // Create candidates summary post
      if (matchingCandidates.length > 0) {
        const candidatesList = matchingCandidates
          .slice(0, 20) // Limit to top 20 for readability
          .map((c: typeof allCandidates[0]) => `• ${c.fullName || "Unknown"} - ${c.jobTitle || "N/A"} at ${c.currentCompany || "N/A"} (${c.totalYearsExperience || "N/A"})`)
          .join("\n")

        const candidatesContent = `📊 Group Summary: Candidates

This group contains ${matchingCandidates.length} matching candidate${matchingCandidates.length !== 1 ? "s" : ""}:

${candidatesList}${matchingCandidates.length > 20 ? `\n\n...and ${matchingCandidates.length - 20} more candidates. View all candidates in the Candidates page.` : ""}

💡 **How to use this group:**
- Recruiters can join to discover candidates matching this skill/experience level
- Post job opportunities relevant to this group
- Connect with candidates and facilitate matches
- Collaborate with other recruiters in this space

View all candidates: /candidates`

        try {
          await prisma.post.create({
            data: {
              authorId: adminUser.id,
              groupId: group.id,
              content: candidatesContent,
              isActive: true,
            },
          })
          candidatesAssigned = matchingCandidates.length
        } catch (error) {
          console.warn(`Could not create candidates summary post for group ${group.id}`)
        }
      }

      // Create jobs summary post
      if (matchingJobs.length > 0) {
        const jobsList = matchingJobs
          .slice(0, 15) // Limit to top 15 for readability
          .map((j: typeof allJobs[0]) => `• ${j.title} at ${j.company.name}`)
          .join("\n")

        const jobsContent = `💼 Group Summary: Job Opportunities

This group contains ${matchingJobs.length} matching job${matchingJobs.length !== 1 ? "s" : ""}:

${jobsList}${matchingJobs.length > 15 ? `\n\n...and ${matchingJobs.length - 15} more jobs. View all jobs in the Jobs page.` : ""}

💡 **How to use this group:**
- Candidates can join to discover jobs matching their skill/experience level
- Recruiters can post new opportunities here
- Network with others at similar career stages
- Share insights and collaborate

View all jobs: /jobs`

        try {
          await prisma.post.create({
            data: {
              authorId: adminUser.id,
              groupId: group.id,
              content: jobsContent,
              isActive: true,
            },
          })
          jobsAssigned = matchingJobs.length
        } catch (error) {
          console.warn(`Could not create jobs summary post for group ${group.id}`)
        }
      }

      // Also create individual job posts for better discoverability (limit to 10 most recent)
      for (const job of matchingJobs.slice(0, 10)) {
        try {
          // Check if post already exists
          const existingPost = await prisma.post.findFirst({
            where: {
              groupId: group.id,
              linkUrl: `/jobs/${job.id}`,
            },
          })

          if (!existingPost) {
            await prisma.post.create({
              data: {
                authorId: adminUser.id,
                groupId: group.id,
                content: `💼 **${job.title}** at ${job.company.name}\n\n${job.description ? job.description.substring(0, 300) + "..." : "View job details to learn more."}\n\n[View Full Job Details →](/jobs/${job.id})`,
                linkUrl: `/jobs/${job.id}`,
                linkTitle: job.title,
                linkDescription: job.description?.substring(0, 150) || "",
                isActive: true,
              },
            })
          }
        } catch (error) {
          // Skip duplicates
        }
      }

      results.candidatesAssigned += candidatesAssigned
      results.jobsAssigned += jobsAssigned
    }

    return NextResponse.json({
      success: true,
      message: "Groups created and candidates/jobs assigned successfully",
      results,
    })
  } catch (error: any) {
    console.error("Setup groups error:", error)
    return NextResponse.json(
      {
        error: "Failed to setup groups",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

