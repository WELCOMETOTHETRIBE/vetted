# Vetted Backend API

Python FastAPI backend service for Vetted platform, providing tech trends and other backend services.

## Features

- **Tech Trends Service**: Fetches latest technology trends from Google Search and enriches them with AI-generated highlights
- **RESTful API**: Clean FastAPI endpoints for frontend integration
- **AI Integration**: Uses OpenAI to generate concise highlights for trend articles

## Setup

### Prerequisites

- Python 3.9+
- Google Custom Search API key and Engine ID
- OpenAI API key

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export GOOGLE_SEARCH_API_KEY="your-google-api-key"
export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"
export OPENAI_API_KEY="your-openai-api-key"
export GOOGLE_TRENDS_REGION="US"  # Optional, defaults to US
export API_HOST="0.0.0.0"  # Optional, defaults to 0.0.0.0
export API_PORT="8000"  # Optional, defaults to 8000
```

### Google Custom Search Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Custom Search API"
4. Create credentials (API Key)
5. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
6. Create a new search engine
7. Copy the Search Engine ID

### Running the Server

```bash
# Development mode with auto-reload
python -m backend.main

# Or using uvicorn directly
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### GET `/api/trends`

Fetch current tech trends with AI-generated highlights.

**Response:**
```json
{
  "last_updated": "2025-12-12T10:15:00Z",
  "items": [
    {
      "title": "AI-powered code review tools are transforming software engineering teams",
      "url": "https://example.com/ai-code-review",
      "source": "example.com",
      "published_at": "2025-12-11T08:00:00Z",
      "raw_excerpt": "A new wave of AI-powered tools is automating code reviews...",
      "highlight": "AI-driven review tools are speeding up PR cycles and reducing bugs for fast-growing SaaS and startup teams.",
      "category": "software_engineering"
    }
  ]
}
```

### GET `/api/trends/health`

Health check endpoint showing configuration status.

**Response:**
```json
{
  "status": "ok",
  "google_configured": true,
  "openai_configured": true
}
```

## Testing

Run unit tests:

```bash
pytest backend/tests/
```

Run with coverage:

```bash
pytest backend/tests/ --cov=backend
```

## Example Usage

### Using curl

```bash
# Get trends
curl http://localhost:8000/api/trends

# Health check
curl http://localhost:8000/api/trends/health
```

### Using Python

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get("http://localhost:8000/api/trends")
    trends = response.json()
    print(trends)
```

## Architecture

```
backend/
├── main.py                 # FastAPI app entry point
├── core/
│   └── config.py          # Configuration management
├── models/
│   └── trends.py         # Pydantic models
├── services/
│   └── trends_service.py # Business logic
├── api/
│   └── routes/
│       └── trends.py     # API routes
└── tests/
    └── test_trends_service.py  # Unit tests
```

## Integration with Next.js Frontend

The backend can run alongside the Next.js app. In production, you can:

1. **Separate services**: Run FastAPI on a different port (e.g., 8000) and proxy from Next.js
2. **API Gateway**: Use Railway/nginx to route `/api/trends` to the FastAPI service
3. **Direct integration**: Call the FastAPI service from Next.js API routes

Example Next.js API route proxy:

```typescript
// app/api/trends/route.ts
export async function GET() {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const response = await fetch(`${backendUrl}/api/trends`);
  return Response.json(await response.json());
}
```

## Error Handling

The service gracefully handles:
- Missing API keys (returns empty results with warnings)
- Rate limits (logs warning, returns partial data)
- API errors (logs error, returns empty response)
- Network timeouts (30s timeout configured)

## Rate Limits

- Google Custom Search API: 100 free queries per day
- OpenAI API: Depends on your plan (typically 3,500 RPM for GPT-4o-mini)

The service includes:
- Batch processing for OpenAI calls
- Small delays between batches
- Error handling for rate limit responses

## Deployment

### Railway

The backend can be deployed to Railway alongside the Next.js app:

1. Add Python buildpack
2. Set environment variables
3. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## License

Part of the Vetted platform.

