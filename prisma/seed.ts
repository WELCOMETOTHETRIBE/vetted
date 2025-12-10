import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create skills
  const skills = await Promise.all([
    prisma.skill.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript' },
    }),
    prisma.skill.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React' },
    }),
    prisma.skill.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js' },
    }),
    prisma.skill.upsert({
      where: { name: 'Python' },
      update: {},
      create: { name: 'Python' },
    }),
    prisma.skill.upsert({
      where: { name: 'AWS' },
      update: {},
      create: { name: 'AWS' },
    }),
    prisma.skill.upsert({
      where: { name: 'Docker' },
      update: {},
      create: { name: 'Docker' },
    }),
  ])

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { slug: 'techcorp' },
      update: {},
      create: {
        name: 'TechCorp',
        slug: 'techcorp',
        industry: 'Technology',
        location: 'San Francisco, CA',
        size: '51-200',
        website: 'https://techcorp.example.com',
        about: 'Leading technology company focused on innovation.',
      },
    }),
    prisma.company.upsert({
      where: { slug: 'startup-xyz' },
      update: {},
      create: {
        name: 'StartupXYZ',
        slug: 'startup-xyz',
        industry: 'Software',
        location: 'New York, NY',
        size: '11-50',
        website: 'https://startupxyz.example.com',
        about: 'Fast-growing startup building the future.',
      },
    }),
    prisma.company.upsert({
      where: { slug: 'bigtech-inc' },
      update: {},
      create: {
        name: 'BigTech Inc',
        slug: 'bigtech-inc',
        industry: 'Enterprise Software',
        location: 'Seattle, WA',
        size: '1000+',
        website: 'https://bigtech.example.com',
        about: 'Enterprise software solutions for large organizations.',
      },
    }),
  ])

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        password: hashedPassword,
        handle: 'alice-johnson',
        role: 'USER',
        profile: {
          create: {
            headline: 'Senior Software Engineer at TechCorp',
            location: 'San Francisco, CA',
            about: 'Passionate about building scalable applications and mentoring junior developers.',
          },
        },
        experiences: {
          create: [
            {
              title: 'Senior Software Engineer',
              companyId: companies[0].id,
              startDate: new Date('2020-01-01'),
              isCurrent: true,
              description: 'Leading development of core platform features.',
            },
            {
              title: 'Software Engineer',
              companyId: companies[0].id,
              startDate: new Date('2018-06-01'),
              endDate: new Date('2019-12-31'),
              description: 'Developed and maintained web applications.',
            },
          ],
        },
        educations: {
          create: [
            {
              school: 'Stanford University',
              degree: 'Bachelor of Science',
              fieldOfStudy: 'Computer Science',
              startDate: new Date('2014-09-01'),
              endDate: new Date('2018-05-31'),
            },
          ],
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        name: 'Bob Smith',
        password: hashedPassword,
        handle: 'bob-smith',
        role: 'USER',
        profile: {
          create: {
            headline: 'Full Stack Developer',
            location: 'New York, NY',
            about: 'Love building products that make a difference.',
          },
        },
        experiences: {
          create: [
            {
              title: 'Full Stack Developer',
              companyId: companies[1].id,
              startDate: new Date('2021-03-01'),
              isCurrent: true,
            },
          ],
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@example.com' },
      update: {},
      create: {
        email: 'charlie@example.com',
        name: 'Charlie Brown',
        password: hashedPassword,
        handle: 'charlie-brown',
        role: 'ADMIN',
        profile: {
          create: {
            headline: 'Engineering Manager',
            location: 'Seattle, WA',
            about: 'Managing teams and building great products.',
          },
        },
        experiences: {
          create: [
            {
              title: 'Engineering Manager',
              companyId: companies[2].id,
              startDate: new Date('2019-01-01'),
              isCurrent: true,
            },
          ],
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'diana@example.com' },
      update: {},
      create: {
        email: 'diana@example.com',
        name: 'Diana Prince',
        password: hashedPassword,
        handle: 'diana-prince',
        role: 'USER',
        profile: {
          create: {
            headline: 'Product Designer',
            location: 'San Francisco, CA',
            about: 'Designing user experiences that delight.',
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'eve@example.com' },
      update: {},
      create: {
        email: 'eve@example.com',
        name: 'Eve Wilson',
        password: hashedPassword,
        handle: 'eve-wilson',
        role: 'USER',
        profile: {
          create: {
            headline: 'Recruiter at TechCorp',
            location: 'San Francisco, CA',
            about: 'Helping talented people find their dream jobs.',
          },
        },
      },
    }),
  ])

  // Add skills to users
  await Promise.all([
    prisma.userSkill.createMany({
      data: [
        { userId: users[0].id, skillId: skills[0].id },
        { userId: users[0].id, skillId: skills[1].id },
        { userId: users[0].id, skillId: skills[2].id },
        { userId: users[1].id, skillId: skills[0].id },
        { userId: users[1].id, skillId: skills[1].id },
        { userId: users[2].id, skillId: skills[3].id },
        { userId: users[2].id, skillId: skills[4].id },
      ],
      skipDuplicates: true,
    }),
  ])

  // Create connections
  await Promise.all([
    prisma.connection.create({
      data: {
        requesterId: users[0].id,
        receiverId: users[1].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.connection.create({
      data: {
        requesterId: users[0].id,
        receiverId: users[2].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.connection.create({
      data: {
        requesterId: users[1].id,
        receiverId: users[3].id,
        status: 'PENDING',
      },
    }),
  ])

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        authorId: users[0].id,
        content: 'Just shipped a major feature! Excited to see how users respond. 🚀',
      },
    }),
    prisma.post.create({
      data: {
        authorId: users[1].id,
        content: 'Great article about React Server Components. Highly recommend reading it!',
      },
    }),
    prisma.post.create({
      data: {
        authorId: users[2].id,
        content: 'Looking for talented engineers to join our team. Check out our open positions!',
        companyId: companies[2].id,
      },
    }),
  ])

  // Create reactions
  await Promise.all([
    prisma.postReaction.create({
      data: {
        postId: posts[0].id,
        userId: users[1].id,
        type: 'LIKE',
      },
    }),
    prisma.postReaction.create({
      data: {
        postId: posts[0].id,
        userId: users[2].id,
        type: 'CELEBRATE',
      },
    }),
  ])

  // Create comments
  await Promise.all([
    prisma.comment.create({
      data: {
        postId: posts[0].id,
        authorId: users[1].id,
        content: 'Congratulations! That\'s awesome! 🎉',
      },
    }),
  ])

  // Create jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Full Stack Engineer',
        companyId: companies[0].id,
        postedById: users[4].id,
        location: 'San Francisco, CA',
        isRemote: false,
        employmentType: 'FULL_TIME',
        salaryMin: 150000,
        salaryMax: 200000,
        salaryCurrency: 'USD',
        description: 'We are looking for an experienced full stack engineer to join our team. You will work on building scalable web applications using modern technologies.',
        requirements: '5+ years of experience with React and Node.js. Experience with TypeScript preferred.',
      },
    }),
    prisma.job.create({
      data: {
        title: 'Remote Software Engineer',
        companyId: companies[1].id,
        postedById: users[4].id,
        location: 'Remote',
        isRemote: true,
        employmentType: 'FULL_TIME',
        salaryMin: 120000,
        salaryMax: 160000,
        salaryCurrency: 'USD',
        description: 'Join our remote team and help build the future of software.',
        requirements: '3+ years of experience. Strong problem-solving skills.',
      },
    }),
    prisma.job.create({
      data: {
        title: 'Engineering Manager',
        companyId: companies[2].id,
        postedById: users[2].id,
        location: 'Seattle, WA',
        isRemote: false,
        employmentType: 'FULL_TIME',
        salaryMin: 180000,
        salaryMax: 250000,
        salaryCurrency: 'USD',
        description: 'Lead a team of talented engineers and drive technical excellence.',
        requirements: '7+ years of experience, 3+ years in management.',
      },
    }),
  ])

  // Create groups
  const groups = await Promise.all([
    prisma.group.create({
      data: {
        name: 'React Developers',
        slug: 'react-developers',
        description: 'A community for React developers to share knowledge and experiences.',
        ownerId: users[0].id,
        isPublic: true,
        memberships: {
          create: [
            { userId: users[0].id, role: 'ADMIN' },
            { userId: users[1].id, role: 'MEMBER' },
          ],
        },
      },
    }),
    prisma.group.create({
      data: {
        name: 'Tech Leaders',
        slug: 'tech-leaders',
        description: 'For engineering managers and tech leaders.',
        ownerId: users[2].id,
        isPublic: true,
        memberships: {
          create: [
            { userId: users[2].id, role: 'ADMIN' },
          ],
        },
      },
    }),
  ])

  // Create group posts
  await Promise.all([
    prisma.groupPost.create({
      data: {
        groupId: groups[0].id,
        authorId: users[0].id,
        content: 'Welcome to the React Developers group! Feel free to share your experiences and ask questions.',
      },
    }),
  ])

  // Create message thread
  const thread = await prisma.messageThread.create({
    data: {
      user1Id: users[0].id,
      user2Id: users[1].id,
    },
  })

  // Create messages
  await Promise.all([
    prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: users[0].id,
        content: 'Hey! How are you doing?',
      },
    }),
    prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: users[1].id,
        content: 'Great! Thanks for asking. How about you?',
      },
    }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`Created:`)
  console.log(`- ${users.length} users`)
  console.log(`- ${companies.length} companies`)
  console.log(`- ${jobs.length} jobs`)
  console.log(`- ${posts.length} posts`)
  console.log(`- ${groups.length} groups`)
  console.log('\nTest accounts:')
  console.log('Email: alice@example.com, Password: password123')
  console.log('Email: bob@example.com, Password: password123')
  console.log('Email: charlie@example.com, Password: password123 (ADMIN)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

