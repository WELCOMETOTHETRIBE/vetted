import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const jobsData = [
  {
    "title": "Senior Manager, Cyber Assurance @ Anduril Industries",
    "url": "https://job-boards.greenhouse.io/andurilindustries/jobs/4977542007?gh_jid=4977542007",
    "description": "Senior Manager, Cyber Assurance position at Anduril Industries. The Cyber Assurance Team comprises ISSM, ISSO, and ISSE personnel who collectively ensure security compliance, authorization success, and security engineering throughout the system lifecycle. CAT members support proposal development, design reviews, system authorization, and continuous monitoring across all protection levels.\n\nWe are looking for a Senior Manager, Cyber Assurance to provide strategic and operational leadership for the Cyber Assurance Team to ensure that all program systems achieve and maintain cybersecurity authorizations, comply with applicable security policies (JSIG, ICD 503, NIST 800-53, DoD RMF), and deliver secure engineering throughout the system lifecycle.\n\nKey responsibilities include:\n- Define the CAT vision, objectives, and performance metrics\n- Prioritize and allocate resources across ISSM, ISSO, and ISSE tasks\n- Direct the end-to-end RMF lifecycle\n- Ensure System Security Plans, Security Assessment Reports, and POA&Ms are authored\n- Supervise, mentor, and evaluate ISSM, ISSO, and ISSE personnel\n- Conduct regular CAT meetings and status briefings\n- Oversee continuous monitoring program\n- Manage GRC platforms and security artifacts\n- Lead risk-assessment workshops\n- Direct incident-response activities\n\nSalary Range: $191,000 - $253,000 USD\nLocation: Costa Mesa, California, United States",
    "location": "Costa Mesa, California, United States",
    "salaryRange": "$191,000 - $253,000 USD",
    "requirements": "Bachelor's degree in Computer Science, Information Security, or related field (Master's preferred). 8+ years of progressive cyber-security leadership experience in DoD or classified environments. Certifications: AM/IAT Level III (CISSP, CASP+, CISM, or equivalent). Deep knowledge of JSIG, ICD 503, NIST 800-53, DoD RMF (DoDI 8510.01). Active DoD Top Secret (TS/SCI-eligible) clearance required."
  },
  {
    "title": "Software Engineer @ Tandem",
    "url": "https://jobs.ashbyhq.com/tandem/a7b0368a-97aa-4cd8-afbc-cae8e86dafb7",
    "description": "Full-stack software engineer role working across the stack to solve business problems and help build the core foundation of Tandem's platform."
  },
  {
    "title": "Software Engineer, Fullstack, Early Career @ Notion",
    "url": "https://jobs.ashbyhq.com/notion/f7399542-9122-481a-bf64-43bf8093748b",
    "description": "Early-career fullstack role focused on shaping core user experiences in Notion and helping users quickly discover value in the product."
  },
  {
    "title": "Staff Software Engineer @ I/ONX HPC",
    "url": "https://jobs.ashbyhq.com/i-onx/c934acae-c209-494e-b1b2-3c4235fbb5c0",
    "description": "Senior-level role owning architecture decisions, mentoring other engineers, and building production-grade systems for high-performance computing workloads."
  },
  {
    "title": "Software Engineer (New Grad) @ Pylon",
    "url": "https://jobs.ashbyhq.com/pylon-labs/ecf0d509-cfb9-43c6-b628-1e685d6f5f42",
    "description": "New-grad full-time software engineering position at Pylon, contributing to the product as part of the core engineering team in an on-site environment."
  },
  {
    "title": "Software Engineer @ Suno",
    "url": "https://jobs.ashbyhq.com/suno/a002507d-e0e7-4cfd-83c0-d6f3cc5824a1",
    "description": "Software engineer role focused on building and scaling Suno's applications, handling significant traffic, and designing robust, scalable systems."
  },
  {
    "title": "Sr. Software Engineer (USA) @ Finalis",
    "url": "https://jobs.ashbyhq.com/finalis/37571630-1c4a-447c-af80-0ce8c5cedd2b",
    "description": "Senior software engineer collaborating with product, design, and leadership to design and build high-impact features and products for Finalis."
  },
  {
    "title": "Software Engineer @ Doppel",
    "url": "https://jobs.ashbyhq.com/doppel/07905bfc-1c21-465d-a6bb-39ef71744c3d",
    "description": "Full-time, hybrid software engineering role at Doppel working on core engineering initiatives in San Francisco or New York."
  },
  {
    "title": "Software Engineer, Early Career @ Suno",
    "url": "https://jobs.ashbyhq.com/suno/991c9785-9bd5-499a-98aa-146e8c947752",
    "description": "Early-career software engineering role at Suno for on-site work in Boston or New York, contributing to the engineering team's core projects."
  },
  {
    "title": "Software Engineer, 2026 New Grad @ Whatnot",
    "url": "https://jobs.ashbyhq.com/whatnot/bc8f8c7f-2c4c-4f43-a238-953568c101b8",
    "description": "Full-time role for 2026 graduates at Whatnot, joining the engineering team in a hybrid setup across several US locations."
  },
  {
    "title": "Software Engineer (All Levels) @ Abridge",
    "url": "https://jobs.ashbyhq.com/abridge/03699ed8-5cf5-4917-96a6-101f15a653e5",
    "description": "Software engineering role open to multiple seniority levels at Abridge, working on site or hybrid in New York or San Francisco."
  },
  {
    "title": "Software Engineer @ Halliday",
    "url": "https://jobs.ashbyhq.com/halliday/fcb6293c-76b6-4bcc-b75b-ebdb0ae7ec6a",
    "description": "Engineer responsible for designing and building core infrastructure powering Halliday's commerce-focused platform."
  },
  {
    "title": "Software Engineer, Product @ Render",
    "url": "https://jobs.ashbyhq.com/render/c7d896f2-20a9-4b44-9f7d-13929a0fe453",
    "description": "Product-focused software engineering role at Render, building features for customers in a fully-remote engineering team across the US and Canada."
  },
  {
    "title": "Software Engineer @ Numeric",
    "url": "https://jobs.ashbyhq.com/numeric/78fb5afa-b70f-44c2-b778-eaa1d1cc3a89",
    "description": "On-site software engineer position at Numeric in San Francisco, contributing to the engineering team building the company's core products."
  },
  {
    "title": "Software Engineer @ Mach Industries",
    "url": "https://jobs.ashbyhq.com/mach/d1cc601d-0cf4-4be2-81b3-a99dbd2c598c",
    "description": "On-site software engineer role in Huntington Beach at Mach Industries, working on software for engineering and defense-related applications."
  },
  {
    "title": "Software Engineer @ Oso",
    "url": "https://jobs.ashbyhq.com/Oso/1778e946-7138-4ab7-8ad2-8d664d11dd8f",
    "description": "Mid- to senior-level software engineer role at Oso, in a startup-like environment, focused on developer experience and core product engineering."
  },
  {
    "title": "Software Engineer @ Freshpaint",
    "url": "https://jobs.ashbyhq.com/freshpaint/bfe56523-bff4-4ca3-936b-0ba15fb4e572",
    "description": "Remote US software engineer position at Freshpaint, working on engineering projects with a strong compensation package and equity."
  },
  {
    "title": "Software Engineer @ Loancrate",
    "url": "https://jobs.ashbyhq.com/loancrate/673ae41d-b7c7-4ec7-90bd-0e4b9b44063d",
    "description": "US-based remote software engineer role at Loancrate, contributing to the engineering team with significant equity upside."
  }
]

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
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Get or create a system user to post jobs
    let postedBy = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    if (!postedBy) {
      // Use current user if no admin exists
      postedBy = await prisma.user.findUnique({
        where: { id: session.user.id },
      })
      if (!postedBy) {
        return NextResponse.json({ error: "No user found" }, { status: 404 })
      }
    }

    const createdJobs = []
    const errors = []

    for (const jobData of jobsData) {
      try {
        // Extract company name from title (format: "Title @ Company")
        const titleParts = jobData.title.split(' @ ')
        const jobTitle = titleParts[0].trim()
        const companyName = titleParts[1]?.trim() || 'Unknown Company'

        // Check if company exists, create if not
        let company = await prisma.company.findFirst({
          where: {
            name: { equals: companyName, mode: 'insensitive' },
          },
        })

        if (!company) {
          // Create slug from company name
          const slug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

          // Set specific data for known companies
          let industry = 'Technology';
          let size = '11-50';
          let companyLocation = 'Remote'; // Default
          let website = jobData.url.split('/').slice(0, 3).join('/');
          let about = `Technology company offering ${jobTitle} position.`;

          if (companyName === 'Anduril Industries') {
            industry = 'Defense Technology';
            size = '1001-5000';
            companyLocation = 'Costa Mesa, CA';
            website = 'https://anduril.com';
            about = 'Anduril Industries is a defense technology company with a mission to transform U.S. and allied military capabilities with advanced technology. By bringing the expertise, technology, and business model of the 21st century\'s most innovative companies to the defense industry, Anduril is changing how military systems are designed, built and sold. Anduril\'s family of systems is powered by Lattice OS, an AI-powered operating system that turns thousands of data streams into a realtime, 3D command and control center.';
          }

          company = await prisma.company.create({
            data: {
              name: companyName,
              slug: slug,
              industry: industry,
              location: companyLocation,
              size: size,
              website: website,
              about: about,
            },
          })
        }

        // Check if job already exists (by title+company)
        const existingJob = await prisma.job.findFirst({
          where: {
            title: jobTitle,
            companyId: company.id,
          },
        })

        if (existingJob) {
          errors.push({ job: jobTitle, error: "Already exists" })
          continue
        }

        // Determine if remote from title or description
        const titleLower = jobData.title.toLowerCase()
        const descLower = (jobData.description || '').toLowerCase()
        const isRemote = titleLower.includes('remote') || 
                        titleLower.includes('(remote)') ||
                        descLower.includes('remote') ||
                        descLower.includes('fully-remote')
        
        // Determine if hybrid
        const isHybrid = titleLower.includes('hybrid') || descLower.includes('hybrid')

        // Use provided description or create default
        const jobDescription = jobData.description
          ? `${jobData.description}\n\nApply at: ${jobData.url}`
          : `We are hiring a ${jobTitle} to join our team at ${companyName}.\n\nApply at: ${jobData.url}\n\nThis position is posted through our job board. Please visit the application URL for more details and to apply.`

        // Use provided location or determine from description
        let location = jobData.location || 'Location TBD'
        if (!jobData.location) {
          if (isRemote) {
            location = 'Remote'
          } else if (descLower.includes('san francisco') || descLower.includes('sf')) {
            location = 'San Francisco, CA'
          } else if (descLower.includes('new york') || descLower.includes('ny')) {
            location = 'New York, NY'
          } else if (descLower.includes('boston')) {
            location = 'Boston, MA'
          } else if (descLower.includes('huntington beach')) {
            location = 'Huntington Beach, CA'
          } else if (descLower.includes('costa mesa')) {
            location = 'Costa Mesa, CA'
          }
        }

        // Parse salary range if provided
        let salaryMin: number | null = null;
        let salaryMax: number | null = null;
        let salaryCurrency = 'USD';

        if (jobData.salaryRange) {
          // Parse salary range like "$191,000 - $253,000 USD"
          const salaryMatch = jobData.salaryRange.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)\s*([A-Z]{3})?/);
          if (salaryMatch) {
            salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''));
            salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''));
            if (salaryMatch[3]) {
              salaryCurrency = salaryMatch[3];
            }
          }
        }

        // Create job
        const job = await prisma.job.create({
          data: {
            title: jobTitle,
            companyId: company.id,
            postedById: postedBy.id,
            location: location,
            isRemote: isRemote,
            isHybrid: isHybrid,
            employmentType: 'FULL_TIME',
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            salaryCurrency: salaryCurrency,
            description: jobDescription,
            requirements: jobData.requirements || `Requirements will be listed on the application page. Please visit ${jobData.url} for full details.`,
          },
        })

        createdJobs.push(job)
      } catch (error: any) {
        console.error(`Error creating job "${jobData.title}":`, error)
        errors.push({ job: jobData.title, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      created: createdJobs.length,
      errors: errors.length,
      jobs: createdJobs,
      errorDetails: errors,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Bulk add jobs error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

