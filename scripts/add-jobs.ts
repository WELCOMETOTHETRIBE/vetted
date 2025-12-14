// Load environment variables
require('dotenv').config()

// Initialize Prisma with adapter (same pattern as lib/prisma.ts)
let adapter = undefined;
try {
  const { PrismaPg } = require('@prisma/adapter-pg');
  const { Pool } = require('pg');
  const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/vetted';
  const pool = new Pool({ connectionString });
  adapter = new PrismaPg(pool);
} catch (e: any) {
  console.warn('Prisma adapter creation failed:', e?.message || String(e));
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient(adapter ? { adapter } : {})

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
    "title": "Senior Android Software Engineer @ Hiya",
    "url": "https://jobs.ashbyhq.com/hiya/89133d2b-abbd-470d-a16f-6675d95b0019"
  },
  {
    "title": "Software Engineer - Noho Labs @ 8VC",
    "url": "https://jobs.ashbyhq.com/8vc/34e85c7d-f763-4881-96f3-ebceedc1f3cb"
  },
  {
    "title": "Software Engineer I (entry) @ Jerry.ai",
    "url": "https://jobs.ashbyhq.com/Jerry.ai/8b017802-2854-42e8-bdf2-42e44bf148b1"
  },
  {
    "title": "Staff Software Engineer, Data @ Patreon",
    "url": "https://jobs.ashbyhq.com/patreon/e072a4cc-6f26-410f-a562-777f66179d03"
  },
  {
    "title": "Software Engineer - AI Frontend @ Omni Analytics",
    "url": "https://jobs.ashbyhq.com/omni/2c10b34f-3274-48e9-8ff4-a0d3a0682c9f"
  },
  {
    "title": "Full-Stack Software Engineer @ The Flex",
    "url": "https://jobs.ashbyhq.com/the-flex/8d82dcb9-edca-4a86-b6bf-0d1c2eeb246a"
  },
  {
    "title": "Forward Deployed Software Engineer @ Kaizen Labs",
    "url": "https://jobs.ashbyhq.com/kaizenlabs/5db85b3b-5db4-405c-af1f-c548f775f8be"
  },
  {
    "title": "Frontend Software Engineer - Mission Control UI @ LAT Aerospace Private",
    "url": "https://jobs.ashbyhq.com/lat/421ad324-1ae4-449e-b978-cfe473f0bc6b"
  },
  {
    "title": "Senior Software Engineer - Developer Tools, Poe (Remote) @ Quora",
    "url": "https://jobs.ashbyhq.com/quora/d7a6d23d-94cf-4bab-956c-72ca36c744ff"
  },
  {
    "title": "Software Engineer II @ Socure",
    "url": "https://jobs.ashbyhq.com/socure/d40ea2d5-8b9d-4168-aeee-e63387d25ba9"
  },
  {
    "title": "Software Engineer @ Rilla",
    "url": "https://jobs.ashbyhq.com/rilla/37228ca3-4e4a-4e3c-9414-d8a2046ff496"
  },
  {
    "title": "Software Engineer @ Suno",
    "url": "https://jobs.ashbyhq.com/suno/a002507d-e0e7-4cfd-83c0-d6f3cc5824a1"
  },
  {
    "title": "Software Engineer @ Freshpaint",
    "url": "https://jobs.ashbyhq.com/freshpaint/bfe56523-bff4-4ca3-936b-0ba15fb4e572"
  },
  {
    "title": "Software Engineer @ Cartesia",
    "url": "https://jobs.ashbyhq.com/cartesia/7628169d-3703-4b82-a1d0-ed3124790643"
  },
  {
    "title": "Software Engineer @ Tandem",
    "url": "https://jobs.ashbyhq.com/tandem/a7b0368a-97aa-4cd8-afbc-cae8e86dafb7"
  },
  {
    "title": "Software Engineer @ Pylon",
    "url": "https://jobs.ashbyhq.com/pylon-labs/edba2728-f620-49f8-b18c-7a4294fe08af"
  },
  {
    "title": "Software Engineer (All Levels) @ Abridge",
    "url": "https://jobs.ashbyhq.com/abridge/03699ed8-5cf5-4917-96a6-101f15a653e5"
  },
  {
    "title": "Software Engineer @ Sticker Mule",
    "url": "https://jobs.ashbyhq.com/stickermule/6db27241-e2d4-4f35-a2c4-b58d84621843"
  },
  {
    "title": "Fullstack Software Engineer @ Hadrian Automation",
    "url": "https://jobs.ashbyhq.com/hadrian-automation/68286f52-3ea7-412e-a85f-04ab21c91994"
  },
  {
    "title": "Software Engineer @ Comulate",
    "url": "https://jobs.ashbyhq.com/comulate/4d5a3632-2812-4ab0-b3ad-ca6cf6083348"
  }
]

async function main() {
  console.log('🌱 Adding jobs...')

  // Get or create a system user to post jobs
  let postedBy = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!postedBy) {
    // Create a system user if no admin exists
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('system123', 10)
    postedBy = await prisma.user.create({
      data: {
        email: 'system@vetted.com',
        name: 'System',
        password: hashedPassword,
        handle: 'system',
        role: 'ADMIN',
      },
    })
    console.log('Created system user for posting jobs')
  }

  const createdJobs = []

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
        let companyLocation = jobData.location || 'Costa Mesa, CA';
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
        console.log(`Created company: ${companyName}`)
      }

      // Check if job already exists (by URL or title+company)
      const existingJob = await prisma.job.findFirst({
        where: {
          OR: [
            { title: jobTitle, companyId: company.id },
            // You could also store the URL in a field if you add it to the schema
          ],
        },
      })

      if (existingJob) {
        console.log(`Job already exists: ${jobTitle} @ ${companyName}`)
        continue
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

      // Determine if remote from title or description
      const titleLower = jobData.title.toLowerCase()
      const descLower = (jobData.description || '').toLowerCase()
      const isRemote = titleLower.includes('remote') ||
                      titleLower.includes('(remote)') ||
                      descLower.includes('remote') ||
                      descLower.includes('fully-remote')

      // Use provided location or determine from description
      let location = jobData.location || (isRemote ? 'Remote' : 'Location TBD')
      if (!jobData.location && !isRemote) {
        if (descLower.includes('san francisco') || descLower.includes('sf')) {
          location = 'San Francisco, CA'
        } else if (descLower.includes('new york') || descLower.includes('ny')) {
          location = 'New York, NY'
        } else if (descLower.includes('boston')) {
          location = 'Boston, MA'
        } else if (descLower.includes('costa mesa')) {
          location = 'Costa Mesa, CA'
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
          employmentType: 'FULL_TIME',
          salaryMin: salaryMin,
          salaryMax: salaryMax,
          salaryCurrency: salaryCurrency,
          description: jobData.description
            ? `${jobData.description}\n\nApply at: ${jobData.url}`
            : `We are hiring a ${jobTitle} to join our team at ${companyName}.

Apply at: ${jobData.url}

This position is posted through our job board. Please visit the application URL for more details and to apply.`,
          requirements: jobData.requirements || `Requirements will be listed on the application page. Please visit ${jobData.url} for full details.`,
        },
      })

      createdJobs.push(job)
      console.log(`Created job: ${jobTitle} @ ${companyName}`)
    } catch (error) {
      console.error(`Error creating job "${jobData.title}":`, error)
    }
  }

  console.log(`\n✅ Successfully created ${createdJobs.length} jobs!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

