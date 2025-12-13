# Tech Trends Service - Quick Start Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file or set these in Railway:

```bash
# Required: Google Custom Search API
export GOOGLE_SEARCH_API_KEY="your-google-api-key"
export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"

# Required: OpenAI API
export OPENAI_API_KEY="your-openai-api-key"

# Optional
export GOOGLE_TRENDS_REGION="US"
export API_PORT="8000"
```

### 3. Get Google Custom Search API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable "Custom Search API"
4. Create API Key (Credentials → Create Credentials → API Key)
5. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
6. Click "Add" to create a new search engine
7. Choose "Search the entire web"
8. Copy the Search Engine ID

### 4. Run the Server

```bash
# Option 1: Using the run script
python backend/run.py

# Option 2: Using uvicorn directly
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Option 3: Using Python module
python -m backend.main
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8000/api/trends/health

# Get trends
curl http://localhost:8000/api/trends
```

## Integration with Next.js Frontend

The Next.js app already has a proxy route at `/app/api/trends/route.ts` that will automatically proxy to the FastAPI backend if `BACKEND_API_URL` is set.

### Option 1: Run Backend Separately (Recommended for Development)

1. Start FastAPI backend: `python backend/run.py` (runs on port 8000)
2. Set environment variable: `BACKEND_API_URL=http://localhost:8000`
3. Start Next.js: `npm run dev`
4. Frontend calls `/api/trends` → proxies to FastAPI → returns trends

### Option 2: Deploy Both to Railway

1. Deploy FastAPI backend as a separate Railway service
2. Set `BACKEND_API_URL` in Next.js Railway service to point to FastAPI service URL
3. Frontend automatically proxies requests

### Option 3: Use Direct API Calls from Frontend

```typescript
// In your React component
const fetchTrends = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
  const response = await fetch(`${backendUrl}/api/trends`);
  const data = await response.json();
  return data;
};
```

## Example Frontend Component

```typescript
// components/TechTrends.tsx
'use client';

import { useEffect, useState } from 'react';

interface TrendItem {
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  highlight: string;
  category: string;
}

export function TechTrends() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trends')
      .then(res => res.json())
      .then(data => {
        setTrends(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch trends:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading trends...</div>;
  if (trends.length === 0) return <div>No trends available</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tech Trends</h2>
      {trends.map((trend, idx) => (
        <div key={idx} className="border p-4 rounded-lg">
          <a 
            href={trend.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-lg font-semibold text-blue-600 hover:underline"
          >
            {trend.title}
          </a>
          <p className="text-sm text-gray-500 mt-1">
            {trend.source} • {trend.published_at ? new Date(trend.published_at).toLocaleDateString() : 'Recent'}
          </p>
          <p className="text-gray-700 mt-2">{trend.highlight}</p>
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            {trend.category}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### "Google Search API not configured"
- Make sure `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` are set
- Check that the API key has Custom Search API enabled

### "OpenAI not configured"
- Make sure `OPENAI_API_KEY` is set
- Trends will still be fetched but without AI highlights

### "Rate limit exceeded"
- Google Custom Search: 100 free queries/day
- Consider caching results or reducing query frequency
- OpenAI: Check your plan limits

### Empty results
- Check Google API quota
- Verify search engine ID is correct
- Check network connectivity

## Next Steps

- Add caching (Redis) to reduce API calls
- Add pagination for trends
- Add filtering by category
- Add user preferences for trend topics
- Schedule periodic updates via cron/background jobs

