# Running Database Migrations on Railway

## Option 1: Using Railway CLI (Recommended)

Since `railway run` doesn't have access to Railway's internal network, you need to run migrations inside the service container.

### Step 1: Make sure you're logged in and linked

```bash
railway login
railway link
```

### Step 2: Run migrations through the service

```bash
railway run --service vetted npx prisma db push
```

Or if you want to use the npm script:

```bash
railway run --service vetted npm run db:push
```

## Option 2: Add a Migration Endpoint (Alternative)

You can create an API endpoint that runs migrations (admin-only for security):

```typescript
// app/api/admin/migrate/route.ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
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

  try {
    // Run migrations
    const { execSync } = require('child_process')
    const output = execSync('npx prisma db push', { encoding: 'utf-8' })
    return NextResponse.json({ success: true, output })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Migration failed", 
      details: error.message 
    }, { status: 500 })
  }
}
```

Then call it from your admin dashboard or via curl:

```bash
curl -X POST https://vetted-production.up.railway.app/api/admin/migrate \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Option 3: Railway Shell (If Available)

Some Railway plans offer a shell/console feature. Check your Railway dashboard for a "Shell" or "Console" option where you can run commands directly in the container.

## Option 4: One-Time Migration Script

Create a script that runs migrations and then exits:

```bash
# scripts/run-migrations.sh
#!/bin/bash
npx prisma db push
exit 0
```

Then run it:

```bash
railway run --service vetted bash scripts/run-migrations.sh
```

## Verifying Migrations

After running migrations, verify they worked:

```bash
railway run --service vetted npm run db:check
```

Or check the database directly:

```bash
railway run --service vetted npx prisma studio
```

## Troubleshooting

### Error: Can't reach database server

This means you're running migrations outside the Railway network. Use `--service vetted` flag:

```bash
railway run --service vetted npx prisma db push
```

### Error: Schema not found

Make sure the `prisma` folder is copied to the container (it should be in the Dockerfile).

### Error: Permission denied

Make sure you're logged in and have access to the project:

```bash
railway login
railway link
```


