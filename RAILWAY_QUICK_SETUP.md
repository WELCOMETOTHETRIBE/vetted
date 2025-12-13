# Quick Setup: Deploy FastAPI Backend to Railway

## TL;DR - Quick Steps

1. **Create New Railway Service**:
   - Go to Railway dashboard → Your project → "+ New" → "Empty Service"
   - Name it: `vetted-backend` (or similar)

2. **Connect to GitHub**:
   - Click "Connect GitHub Repo"
   - Select your `vetted` repository
   - Railway will auto-detect it

3. **Configure Service**:
   - **Root Directory**: `/` (leave empty, uses repo root)
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Railway will auto-detect Python from `requirements.txt`

4. **Set Environment Variables** (in backend service):
   ```
   GOOGLE_SEARCH_API_KEY=your-key-here
   GOOGLE_SEARCH_ENGINE_ID=your-engine-id-here
   OPENAI_API_KEY=your-openai-key (or reference from main service)
   GOOGLE_TRENDS_REGION=US
   ```

5. **Get Backend URL**:
   - Go to backend service → Settings → Networking
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://vetted-backend-production.up.railway.app`)

6. **Set BACKEND_API_URL in Main Service**:
   - Go to your main `vetted` service → Variables
   - Add: `BACKEND_API_URL=https://vetted-backend-production.up.railway.app`
   - **No trailing slash!**

7. **Deploy**:
   - Railway will auto-deploy when you push to GitHub
   - Or click "Deploy" in Railway dashboard

## Your BACKEND_API_URL

After step 5, your `BACKEND_API_URL` will be:
```
https://vetted-backend-production.up.railway.app
```

Or whatever domain Railway generates for your backend service.

**Format**: `https://[service-name]-[environment].up.railway.app`

## Testing

Once deployed, test:

1. **Backend Health**:
   ```bash
   curl https://your-backend-url.up.railway.app/api/trends/health
   ```

2. **Backend Trends**:
   ```bash
   curl https://your-backend-url.up.railway.app/api/trends
   ```

3. **Next.js Proxy**:
   ```bash
   curl https://your-main-app.up.railway.app/api/trends
   ```

## Common Issues

**Problem**: Backend service shows "Build failed"
- **Fix**: Make sure `requirements.txt` is in repo root (it is ✅)

**Problem**: "Module not found: backend"
- **Fix**: Start command should be `uvicorn backend.main:app` (not `python backend/main.py`)

**Problem**: Backend returns empty results
- **Fix**: Check environment variables are set correctly in backend service

**Problem**: Next.js can't connect
- **Fix**: Verify `BACKEND_API_URL` is set correctly (with `https://`, no trailing slash)

## Need More Help?

See `RAILWAY_BACKEND_SETUP.md` for detailed instructions.

