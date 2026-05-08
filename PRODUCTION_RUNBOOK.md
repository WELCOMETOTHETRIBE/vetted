# clearD Production Runbook

This runbook covers deploy and rollback operations for clearD by MacTech Solutions using GitHub CLI, Railway CLI, and Clerk production.

## 1) Required Access

- GitHub CLI authenticated to `WELCOMETOTHETRIBE`
- Railway CLI authenticated to the `clearD` production project
- Clerk production dashboard access for the clearD app

## 2) Required Environment Variables (Railway Production)

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VETTED_API_KEY` (optional extension ingestion key)
- `SERPAPI_KEY` (only if Ashby scraper is required)

## 3) Release Workflow

```bash
# Confirm repo state
git fetch origin
git checkout main
git pull --ff-only

# Capture release sha
git rev-parse HEAD

# Validate build before deploy
npm ci
npm run build

# Trigger Railway deploy from linked service
railway up

# Verify service and logs
railway status
railway logs
```

## 4) Post-Deploy Smoke Tests

- Open `/auth/signin` and complete Clerk sign-in.
- Confirm authenticated redirect lands in `/feed`.
- Validate `/api/profile` returns authenticated user data.
- Validate admin-only candidate upload path still enforces role checks.

## 5) Rollback Workflow

```bash
# Identify previous known-good sha
git log --oneline -n 10

# Checkout rollback candidate and redeploy
git checkout <known_good_sha>
npm ci
npm run build
railway up

# Return to main after rollback deployment
git checkout main
```

## 6) Clerk Production Checklist

- Redirect URLs include:
  - `https://<clearD-domain>/auth/signin`
  - `https://<clearD-domain>/auth/signup`
- Allowed origins include `NEXT_PUBLIC_APP_URL`.
- Desired social providers configured in Clerk (Google, etc).
- Production keys copied into Railway variables.

## 7) GitHub Traceability

For each production deploy, record:

- Git commit SHA (`git rev-parse HEAD`)
- Railway deploy timestamp
- Operator
- Smoke test pass/fail result
