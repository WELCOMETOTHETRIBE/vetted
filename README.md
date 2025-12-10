# Vetted

A production-ready professional networking platform inspired by LinkedIn, built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Features

- **User Profiles**: Complete profiles with experience, education, skills, and customizable sections
- **Connections/Network**: Send and manage connection requests
- **Feed**: Social feed with posts, likes, comments, and reposts
- **Jobs**: Job listings with search, filters, and application system
- **Companies**: Company profiles with job listings and posts
- **Messaging**: Direct messaging between users
- **Notifications**: Real-time notifications for connections, messages, and interactions
- **Groups**: Community boards for discussions
- **Search**: Unified search across people, jobs, companies, and groups
- **Admin Dashboard**: Admin tools for user and content moderation
- **Candidates Pool**: Admin-only candidate management system with LinkedIn profile import via browser extension

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js (email/password + Google OAuth)
- **Testing**: Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/WELCOMETOTHETRIBE/vetted.git
cd vetted
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate a random secret (e.g., `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: For Google OAuth (optional)

4. Set up the database:

Using Docker:
```bash
docker-compose up -d
```

Or use your own PostgreSQL instance and update `DATABASE_URL` in `.env`.

5. Run Prisma migrations:
```bash
npm run db:push
```

6. Generate Prisma Client:
```bash
npm run db:generate
```

7. Seed the database (optional):
```bash
npm run db:seed
```

This creates test users, companies, jobs, posts, and more. Test accounts:
- Email: `alice@example.com`, Password: `password123`
- Email: `bob@example.com`, Password: `password123`
- Email: `charlie@example.com`, Password: `password123` (ADMIN)

8. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vetted/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── auth/               # Authentication pages
│   ├── feed/               # Main feed page
│   ├── profile/            # User profile pages
│   ├── jobs/               # Job listing and detail pages
│   ├── messages/           # Messaging interface
│   ├── notifications/      # Notifications page
│   ├── groups/             # Groups/community boards
│   ├── admin/              # Admin dashboard
│   ├── candidates/         # Candidate pool (admin only)
│   └── ...
├── components/            # React components
├── lib/                    # Utility functions
│   ├── auth.ts            # NextAuth configuration
│   └── prisma.ts          # Prisma client
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seed script
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## Key Routes

- `/` - Landing page
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/onboarding` - Profile completion wizard
- `/feed` - Main social feed
- `/profile/[id]` - User profile page
- `/profile/edit` - Edit profile
- `/jobs` - Job listings with filters
- `/jobs/[id]` - Job detail and application
- `/company/[slug]` - Company profile
- `/network` - Connections management
- `/messages` - Direct messages
- `/notifications` - Notifications
- `/groups` - Groups listing
- `/groups/[id]` - Group feed
- `/admin` - Admin dashboard
- `/candidates` - Candidate pool (admin only)

## Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- `User` - User accounts with authentication
- `UserProfile` - Extended profile information
- `Experience` - Work history
- `Education` - Educational background
- `Skill` & `UserSkill` - Skills system
- `Connection` - User connections/network
- `Post` - Social posts
- `PostReaction` - Likes/reactions
- `Comment` - Post comments
- `Job` - Job listings
- `JobApplication` - Job applications
- `Company` - Company profiles
- `Group` - Community groups
- `MessageThread` & `Message` - Messaging
- `Notification` - User notifications
- `Candidate` - LinkedIn profile candidates (scraped via extension)
- `Candidate` - LinkedIn profile candidates (scraped via extension)

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Push schema changes (dev)
npm run db:push
```

### Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

The project includes Docker configuration:

```bash
# Start PostgreSQL
docker-compose up -d

# Build and run the app
docker build -t vetted .
docker run -p 3000:3000 --env-file .env vetted
```

## Environment Variables

See `.env.example` for all required environment variables.

## Features Implementation Notes

- **Feed Algorithm**: Currently shows posts from connections in reverse chronological order. Can be extended with ranking algorithms.
- **File Uploads**: Resume uploads are stored locally in `public/resumes/`. In production, use cloud storage (S3, Cloudinary, etc.).
- **Real-time Updates**: Messages use polling (5s interval). Can be upgraded to WebSockets for true real-time.
- **Search**: Basic text search using Prisma. Can be enhanced with full-text search (PostgreSQL full-text, Algolia, etc.).
- **Notifications**: Created on various events. Can be extended with email notifications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.

## Extension Integration

Vetted supports importing candidate profiles from LinkedIn via browser extension. See `EXTENSION_INTEGRATION.md` for details.

**Key Features**:
- Admin-only candidate pool
- Search and filter candidates
- Status management (Active, Contacted, Hired, Rejected, Archived)
- Notes system
- API endpoint for extension integration

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
