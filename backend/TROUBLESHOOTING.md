# Backend Service Troubleshooting

## Issue: 404 Errors on Backend Endpoints

If you're getting 404 errors when accessing backend endpoints, the FastAPI service isn't running correctly.

## Quick Diagnosis

### Test 1: Check if Backend Root Returns JSON
```bash
curl https://vetted-backend-production-dce5.up.railway.app/
```

**Expected (FastAPI running):**
```json
{
  "message": "Vetted Backend API",
  "version": "1.0.0",
  "endpoints": {
    "trends": "/api/trends",
    "health": "/api/trends/health"
  }
}
```

**Actual (Next.js routing):**
HTML page with "404: This page could not be found"

### Test 2: Check Health Endpoint
```bash
curl https://vetted-backend-production-dce5.up.railway.app/api/trends/health
```

**Expected (FastAPI running):**
```json
{
  "status": "ok",
  "google_configured": true,
  "openai_configured": true
}
```

**Actual (Next.js routing):**
404 HTML page

## Common Issues & Fixes

### Issue 1: Backend Service Not Deployed

**Symptoms:**
- All endpoints return 404
- Root endpoint returns Next.js HTML

**Fix:**
1. Go to Railway → Your Backend Service
2. Check **Deployments** tab
3. If no deployments, click **"Deploy"** or push a commit
4. Wait for deployment to complete

### Issue 2: Wrong Start Command

**Symptoms:**
- Service shows as "running" but endpoints don't work
- Logs show errors about missing modules

**Fix:**
1. Go to Backend Service → **Settings** → **Deploy**
2. Set **Start Command** to:
   ```
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
3. Redeploy the service

### Issue 3: Railway Detected Wrong Project Type

**Symptoms:**
- Railway auto-detected Next.js instead of Python
- Build logs show npm/node commands instead of pip

**Fix:**
1. Go to Backend Service → **Settings** → **Build**
2. Set **Builder** to `NIXPACKS` (or `DOCKERFILE` if using Dockerfile)
3. Ensure `requirements.txt` is in repo root (it is ✅)
4. Railway should auto-detect Python from `requirements.txt`

### Issue 4: Root Directory Wrong

**Symptoms:**
- Build succeeds but service can't find modules
- Errors like "ModuleNotFoundError: No module named 'backend'"

**Fix:**
1. Go to Backend Service → **Settings** → **Deploy**
2. Set **Root Directory** to `/` (repo root)
3. The `backend/` folder should be accessible from root

### Issue 5: Python Not Installed

**Symptoms:**
- Build fails with "python: command not found"
- Logs show Python-related errors

**Fix:**
1. Ensure `requirements.txt` is in repo root (it is ✅)
2. Railway should auto-install Python 3.11+ from `requirements.txt`
3. If using Dockerfile, ensure base image is `python:3.11-slim`

## Step-by-Step Fix

### Option A: Fix Existing Service

1. **Go to Railway Dashboard**
   - Open your `vetted-backend` service

2. **Check Settings → Deploy**
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `/` (or empty)
   
3. **Check Settings → Build**
   - **Builder**: `NIXPACKS` (or `DOCKERFILE`)
   - Should auto-detect Python

4. **Redeploy**
   - Click **"Redeploy"** or push a commit
   - Watch the build logs

5. **Check Logs**
   - After deployment, check **Logs** tab
   - Look for: `"Starting Vetted Backend API..."`
   - Look for: `"Application startup complete"`

### Option B: Create New Service (If Fix Doesn't Work)

1. **Delete the broken backend service** (or rename it)

2. **Create New Service**
   - Railway → Your Project → "+ New" → "Empty Service"
   - Name: `vetted-backend-api`

3. **Connect GitHub Repo**
   - Select your `vetted` repository

4. **Configure Service**
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `/`
   - **Builder**: `NIXPACKS`

5. **Set Environment Variables**
   - `GOOGLE_SEARCH_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`
   - `OPENAI_API_KEY`
   - `GOOGLE_TRENDS_REGION=US`

6. **Generate Domain**
   - Settings → Networking → "Generate Domain"
   - Update `BACKEND_API_URL` in main service

## Verification Checklist

After fixing, verify:

- [ ] Backend root (`/`) returns FastAPI JSON, not HTML
- [ ] `/api/trends/health` returns JSON with status
- [ ] `/api/trends` returns trends (or empty array if no API keys)
- [ ] Logs show "Starting Vetted Backend API..."
- [ ] No errors in Railway logs

## Still Not Working?

Check Railway logs for:
1. **Build errors** - Python/pip installation issues
2. **Runtime errors** - Module import errors
3. **Port binding errors** - Port already in use
4. **Environment variable errors** - Missing required vars

Share the error messages from Railway logs for further help!

