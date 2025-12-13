# Quick Fix: Railway Can't Find Dockerfile

## The Error
```
couldn't locate the dockerfile at path backend/Dockerfile in code archive
```

## The Solution

Railway needs the Dockerfile at the **repo root**, not in the `backend/` folder.

### Step 1: Use the Root Dockerfile

I've created `Dockerfile.backend` at the repo root. Configure Railway to use it:

1. **Go to Railway → Your Backend Service → Settings → Build**
2. **Set Builder**: `DOCKERFILE`
3. **Set Dockerfile Path**: `Dockerfile.backend` ⬅️ **This is the key!**
4. **Root Directory**: `/` (repo root)

### Step 2: Verify Start Command

**Go to Settings → Deploy**:
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- (This will override the CMD in Dockerfile, which is fine)

### Step 3: Redeploy

Click **"Redeploy"** and watch the build logs. You should see:
- Python installation
- `pip install -r requirements.txt`
- FastAPI/uvicorn installation
- **NOT** npm/node commands

### Step 4: Test

After deployment:
```bash
curl https://vetted-backend-production-dce5.up.railway.app/
```

Should return FastAPI JSON:
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

## Alternative: Use Nixpacks Instead

If Dockerfile still doesn't work, use Nixpacks:

1. **Settings → Build**
   - **Builder**: `NIXPACKS`
   - Railway will auto-detect Python from `requirements.txt`

2. **Settings → Deploy**
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `/`

3. **Redeploy**

Nixpacks should automatically:
- Detect Python from `requirements.txt`
- Install dependencies
- Run your start command

## Summary

**The Fix**: Set Dockerfile Path to `Dockerfile.backend` (not `backend/Dockerfile`)

This tells Railway to use the backend-specific Dockerfile at the repo root, which Railway can find and use for the build.

