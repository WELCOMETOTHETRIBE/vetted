# Quick Fix: Backend Service 404 Errors

## The Problem

Your backend URL `vetted-backend-production-dce5.up.railway.app` is returning Next.js 404 pages instead of FastAPI responses. This means Railway is routing to your Next.js app instead of the Python backend.

## The Solution

### Step 1: Check Backend Service Configuration

1. **Go to Railway Dashboard**
   - Open your `vetted-backend` service (or whatever you named it)

2. **Go to Settings → Deploy**
   - **Start Command** MUST be:
     ```
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Root Directory**: `/` (or leave empty - means repo root)

3. **Go to Settings → Build**
   - **Builder**: Should be `NIXPACKS` or `DOCKERFILE`
   - If it says `NIXPACKS` but Railway detected Next.js, we need to force Python detection

### Step 2: Force Python Detection

Railway might have auto-detected Next.js. To force Python:

**Option A: Use Dockerfile (Recommended)**
1. Go to Settings → Build
2. Set **Builder** to `DOCKERFILE`
3. Set **Dockerfile Path** to `Dockerfile.backend` (the backend-specific Dockerfile at repo root)
4. Redeploy

**Option B: Use Nixpacks with Python Detection**
1. Ensure `requirements.txt` is in repo root (it is ✅)
2. Railway should detect Python automatically
3. If not, create a `Procfile` in repo root:
   ```
   web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```

### Step 3: Verify Configuration

**In Railway Backend Service:**

✅ **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
✅ **Root Directory**: `/` (repo root)
✅ **Builder**: `DOCKERFILE` (using `backend/Dockerfile`)
✅ **Environment Variables**: All set (GOOGLE_SEARCH_API_KEY, etc.)

### Step 4: Redeploy

1. Click **"Redeploy"** in Railway
2. OR push a commit to trigger rebuild
3. Watch the **Build Logs** - should see:
   - Python installation
   - `pip install -r requirements.txt`
   - FastAPI/uvicorn installation
   - NOT npm/node commands

### Step 5: Check Logs After Deployment

After deployment completes, check **Logs** tab. You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX (Press CTRL+C to quit)
```

If you see Next.js logs instead, Railway is still routing to Next.js.

## Alternative: Create Fresh Backend Service

If fixing doesn't work, create a new service:

1. **Delete/Rename** the broken backend service
2. **Create New Service** → "Empty Service"
3. **Name**: `vetted-backend-api`
4. **Connect GitHub** → Select `vetted` repo
5. **Settings → Build**:
   - Builder: `DOCKERFILE`
   - Dockerfile Path: `backend/Dockerfile`
6. **Settings → Deploy**:
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Root Directory: `/`
7. **Set Environment Variables**:
   - `GOOGLE_SEARCH_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`
   - `OPENAI_API_KEY`
   - `GOOGLE_TRENDS_REGION=US`
8. **Generate Domain** → Update `BACKEND_API_URL` in main service

## Test After Fix

```bash
# Should return FastAPI JSON, not HTML
curl https://your-backend-url.up.railway.app/

# Should return health status
curl https://your-backend-url.up.railway.app/api/trends/health

# Should return trends (or empty if no API keys)
curl https://your-backend-url.up.railway.app/api/trends
```

## Most Common Issue

**Railway auto-detected Next.js instead of Python**

**Fix**: Set Builder to `DOCKERFILE` and use `backend/Dockerfile` which explicitly uses Python.

