# Railway Setup Guide

This guide will help you set up PostgreSQL and configure your Vetted application on Railway.

## Step 1: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"** or **"New Service"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database service
4. The database will be provisioned automatically

## Step 2: Connect Database to Your App

Railway automatically creates a `DATABASE_URL` environment variable when you add a PostgreSQL service. However, you need to link it to your `vetted` service:

1. Click on your **`vetted`** service (the Next.js app)
2. Go to the **"Variables"** tab
3. Railway should automatically show `DATABASE_URL` from the PostgreSQL service
   - If not, click **"Reference Variable"** and select `DATABASE_URL` from your PostgreSQL service
4. The `DATABASE_URL` should look like: `postgresql://postgres:password@hostname:port/railway`

## Step 3: Set Required Environment Variables

In your `vetted` service, add these environment variables in the **"Variables"** tab:

### Required Variables:

1. **`AUTH_SECRET`** (or `NEXTAUTH_SECRET`)
   - Generate with: `openssl rand -base64 32`
   - Or use: `5dMeJJwjI71E/56Kf91SRwscJQc7vall7VRZWhfmj9g=`
   - This is required for NextAuth authentication

2. **`AUTH_URL`** (or `NEXTAUTH_URL`)
   - Set this to your Railway domain: `https://vetted-production.up.railway.app`
   - This tells NextAuth what domain to trust
   - **Required** to fix "UntrustedHost" errors

2. **`DATABASE_URL`** 
   - Should be automatically set from the PostgreSQL service
   - Format: `postgresql://postgres:password@hostname:port/railway`

### Optional Variables:

3. **`GOOGLE_CLIENT_ID`** and **`GOOGLE_CLIENT_SECRET`**
   - Only needed if you want Google OAuth sign-in
   - Get these from [Google Cloud Console](https://console.cloud.google.com/)

4. **`VETTED_API_KEY`**
   - For browser extension API access (admin users only)
   - Generate a random string

## Step 4: Run Database Migrations

After the database is connected, you need to create the database tables. You have two options:

### Option A: Using Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   railway run npm run db:push
   ```

5. (Optional) Seed the database with test data:
   ```bash
   railway run npm run db:seed
   ```

### Option B: Using Railway's Deploy Script

You can add a deploy script that runs migrations automatically. Add this to your `package.json`:

```json
{
  "scripts": {
    "deploy": "prisma db push && npm run start"
  }
}
```

Then in Railway, set the **"Deploy Command"** to:
```bash
npm run deploy
```

**Note:** Railway's deploy command runs after the build, so you can also add migrations to the build process.

## Step 5: Verify Database Connection

After setting up, check your Railway logs to ensure:
1. The database connection is successful
2. Migrations ran without errors
3. The app starts correctly

## Database Schema

The application uses Prisma with PostgreSQL. The schema includes:

- **User accounts** (authentication via NextAuth)
- **User profiles** (experience, education, skills)
- **Connections/Network** (user connections)
- **Posts** (social feed with reactions and comments)
- **Jobs** (job listings and applications)
- **Companies** (company profiles)
- **Groups** (community boards)
- **Messages** (direct messaging)
- **Notifications** (user notifications)
- **Candidates** (LinkedIn profile candidates from browser extension)

## Troubleshooting

### Database Connection Errors

If you see connection errors:
1. Verify `DATABASE_URL` is set correctly in your `vetted` service
2. Check that the PostgreSQL service is running
3. Ensure the database is accessible from your app service

### Migration Errors

If migrations fail:
1. Check Railway logs for specific error messages
2. Ensure `DATABASE_URL` is correct
3. Try running `prisma db push` manually via Railway CLI

### Authentication Errors

If you see 500 errors on `/api/auth/*:
1. Ensure `AUTH_SECRET` is set
2. Check that the database tables were created (Account, Session, User, etc.)
3. Verify NextAuth configuration in `lib/auth.ts`

## Next Steps

After the database is set up:
1. Test user signup at `/auth/signup`
2. Test user signin at `/auth/signin`
3. (Optional) Run the seed script to create test data
4. Access the admin dashboard at `/admin` (requires admin user)

## Test Accounts (After Seeding)

If you run `npm run db:seed`, you'll have these test accounts:
- Email: `alice@example.com`, Password: `password123`
- Email: `bob@example.com`, Password: `password123`
- Email: `charlie@example.com`, Password: `password123` (ADMIN)

