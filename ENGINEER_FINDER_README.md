# Engineer Finder Feature

## Overview

The Engineer Finder is a new recruiting tool integrated into the Admin Dashboard that allows you to search for high-signal engineering candidates using curated boolean query templates and SerpApi (no scraping).

## Features

- **Query Templates**: Pre-built search templates for LinkedIn, GitHub, Scholar, YouTube, Patents, and more
- **Variable Substitution**: Customize queries with location, company, role, seniority, and domain focus
- **Signal Extraction**: Automatically detects and scores candidates based on:
  - Seniority signals (Staff, Principal, Distinguished)
  - Builder signals (maintainer, core contributor, creator)
  - Systems expertise (distributed systems, performance, ML systems)
- **GitHub Enrichment**: Automatically enriches GitHub results with stars, forks, language, and user stats
- **Saved Runs**: All searches are saved to the database for future reference
- **Rate Limiting**: 10 requests per minute per user
- **Caching**: Results cached for 15 minutes

## Access

Navigate to **Admin Dashboard** → **Recruiting Tools** tab

## Usage

### 1. Select a Template

Choose from pre-built templates:
- LinkedIn Staff/Principal Infrastructure Engineers
- LinkedIn Maintainers & Core Contributors
- GitHub K8s Ecosystem Maintainers
- GitHub Project Authors
- Scholar ML Systems & Inference
- Conference Speakers
- Patent Inventors
- Stack Overflow Top Contributors
- YouTube Technical Talk Presenters
- LinkedIn AI/ML Systems Engineers

### 2. Customize Variables

- **Location**: Default "San Francisco"
- **Company**: Optional company filter
- **Role Keywords**: Default "AI Engineer"
- **Seniority**: Multi-select (Staff, Principal, Distinguished, Tech Lead)
- **Domain Focus**: Multi-select (distributed systems, performance, ml systems, security, compilers, databases)
- **Include Keywords**: Add specific keywords to include
- **Exclude Keywords**: Add keywords to exclude
- **Keyword Packs**: Quick-add predefined keyword sets

### 3. Preview & Run Query

- View the final query string
- Copy query to clipboard
- Click "Run Search" to execute via SerpApi

### 4. Review Results

Results are displayed with:
- Title (clickable link)
- Source badge (LinkedIn, GitHub, etc.)
- Snippet
- Detected signals (chips)
- Score (0-100)
- GitHub enrichment (if applicable)

### 5. View History

Switch to the "History" tab to:
- View all saved search runs
- Reload previous results
- See query, result count, and timestamp

## Database Schema

Two new tables:

### EngineerFinderRun
- Stores each search execution
- Links to user who ran the search
- Stores query and filters as JSON

### EngineerFinderResult
- Stores individual search results
- Includes signals, scores, and enrichment data
- Links back to the run

## API Endpoints

### POST /api/engineer-finder/search
Search for engineers via SerpApi

**Request:**
```json
{
  "query": "site:linkedin.com/in Staff Engineer...",
  "maxResults": 10,
  "page": 0,
  "gl": "us",
  "hl": "en"
}
```

**Response:**
```json
{
  "results": [...],
  "runId": "...",
  "nextPage": 1,
  "totalResults": 50
}
```

### GET /api/engineer-finder/runs
Get saved runs

**Query Params:**
- `limit`: Number of runs to return (default: 20)
- `offset`: Pagination offset (default: 0)
- `runId`: Get specific run with results

## Environment Variables

Add to `.env`:

```bash
# Required
SERPAPI_KEY=your_serpapi_key_here

# Optional
SERPAPI_ENGINE=google
SERPAPI_GL=us
SERPAPI_HL=en
SERPAPI_LOCATION=United States

# Optional - for GitHub enrichment
GITHUB_TOKEN=your_github_token_here
```

## Migration

Run Prisma migration to create new tables:

```bash
npx prisma migrate dev --name add_engineer_finder
```

Or if using Prisma 7+:

```bash
npx prisma db push
```

## Signal Scoring

Signals are extracted from title and snippet text:

- **Seniority**: +3 points per hit (Staff, Principal, Distinguished, etc.)
- **Builder**: +4 points per hit (maintainer, core contributor, creator)
- **Systems**: +2 points per hit (distributed systems, performance, etc.)
- **ML Systems**: +2 points per hit (inference, serving, training pipeline)
- **Deep Systems**: +2 points per hit (internals, deep dive, architecture)
- **Diversity Bonus**: +5 points if 3+ signal types detected

Scores are normalized to 0-100 range.

## LinkedIn Profile Search

The Recruiting Tools tab also includes the LinkedIn Profile Search component (refactored from the button). This allows you to search LinkedIn profiles via SerpApi and save URLs to the database.

## Notes

- **No Scraping**: All searches use SerpApi - no direct scraping of Google or LinkedIn
- **Rate Limits**: 10 requests per minute per user (in-memory)
- **Caching**: Results cached for 15 minutes (in-memory)
- **GitHub Enrichment**: Only works for public GitHub repos/users with valid GITHUB_TOKEN
- **ToS Safe**: Uses SerpApi which is compliant with search engine ToS

## Future Enhancements

- Export results to CSV
- Bulk save candidates from results
- Advanced filtering on saved runs
- Email notifications for high-score results
- Integration with candidate pipeline

