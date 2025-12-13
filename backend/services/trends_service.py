"""
Tech Trends Service

Fetches and enriches latest technology trends for Vetted dashboard.
Uses Google Custom Search API to fetch tech news and OpenAI to generate highlights.

APIs Used:
- Google Custom Search JSON API (Programmable Search)
- OpenAI Chat Completions API

Required Environment Variables:
- GOOGLE_SEARCH_API_KEY: Google Custom Search API key
- GOOGLE_SEARCH_ENGINE_ID: Custom Search Engine ID
- OPENAI_API_KEY: OpenAI API key
- GOOGLE_TRENDS_REGION: Region for search results (default: "US")
"""
import asyncio
import logging
import re
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

import httpx
from openai import OpenAI

from backend.core.config import Config
from backend.models.trends import TrendItem, TrendsResponse

logger = logging.getLogger(__name__)

# Predefined search queries for tech trends
TREND_QUERIES = [
    {
        "query": "latest technology trends startups 2025",
        "category": "startups",
        "num_results": 8
    },
    {
        "query": "software engineering emerging trends",
        "category": "software_engineering",
        "num_results": 8
    },
    {
        "query": "AI startup news artificial intelligence",
        "category": "ai",
        "num_results": 8
    },
    {
        "query": "engineering firm technology innovations",
        "category": "engineering",
        "num_results": 6
    }
]


class TrendsService:
    """Service for fetching and enriching tech trends."""
    
    def __init__(self):
        """Initialize the trends service."""
        self.google_api_key = Config.GOOGLE_SEARCH_API_KEY
        self.google_engine_id = Config.GOOGLE_SEARCH_ENGINE_ID
        self.region = Config.GOOGLE_TRENDS_REGION
        self.openai_client = None
        
        if Config.is_openai_configured():
            self.openai_client = OpenAI(api_key=Config.OPENAI_API_KEY)
    
    async def fetch_raw_trends(self) -> list[dict]:
        """
        Fetch raw trend data from Google Custom Search API.
        
        Returns:
            List of raw search result dictionaries
        """
        if not Config.is_google_configured():
            logger.warning("Google Search API not configured, returning empty results")
            return []
        
        all_results = []
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            tasks = []
            for query_config in TREND_QUERIES:
                task = self._fetch_query_results(client, query_config)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error fetching query results: {result}")
                    continue
                if isinstance(result, list):
                    all_results.extend(result)
        
        return all_results
    
    async def _fetch_query_results(
        self, 
        client: httpx.AsyncClient, 
        query_config: dict
    ) -> list[dict]:
        """Fetch results for a single query."""
        query = query_config["query"]
        category = query_config["category"]
        num_results = query_config.get("num_results", 10)
        
        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": self.google_api_key,
                "cx": self.google_engine_id,
                "q": query,
                "num": min(num_results, 10),  # Google API max is 10 per request
                "lr": f"lang_en",  # English results
                "cr": f"country{self.region.lower()}",  # Country restriction
            }
            
            logger.info(f"Fetching trends for query: {query}")
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            items = data.get("items", [])
            
            # Add category to each item
            enriched_items = []
            for item in items:
                enriched_items.append({
                    **item,
                    "category": category,
                    "query": query
                })
            
            logger.info(f"Fetched {len(enriched_items)} results for '{query}'")
            return enriched_items
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching query '{query}': {e.response.status_code}")
            if e.response.status_code == 429:
                logger.warning("Rate limit hit, consider adding backoff")
            return []
        except Exception as e:
            logger.error(f"Error fetching query '{query}': {e}")
            return []
    
    def _normalize_results(self, raw_items: list[dict]) -> list[TrendItem]:
        """
        Normalize raw Google API results into TrendItem models.
        Deduplicates by URL and title similarity.
        """
        seen_urls = set()
        normalized_items = []
        
        for item in raw_items:
            url = item.get("link", "")
            title = item.get("title", "")
            snippet = item.get("snippet", "")
            category = item.get("category", "general")
            
            # Parse published date if available
            published_at = None
            if "pagemap" in item and "metatags" in item["pagemap"]:
                metatags = item["pagemap"]["metatags"][0] if item["pagemap"]["metatags"] else {}
                date_str = metatags.get("article:published_time") or metatags.get("og:updated_time")
                if date_str:
                    try:
                        published_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except (ValueError, AttributeError):
                        pass
            
            # Extract source domain from URL
            try:
                parsed_url = urlparse(url)
                source = parsed_url.netloc.replace("www.", "")
            except Exception:
                source = "unknown"
            
            # Deduplicate by URL
            if url in seen_urls:
                continue
            seen_urls.add(url)
            
            # Skip if missing essential fields
            if not url or not title:
                continue
            
            trend_item = TrendItem(
                title=title,
                url=url,
                source=source,
                published_at=published_at,
                raw_excerpt=snippet,
                highlight="",  # Will be populated by AI
                category=category
            )
            
            normalized_items.append(trend_item)
        
        # Sort by published date (newest first), then by relevance
        normalized_items.sort(
            key=lambda x: (x.published_at or datetime.min, x.title),
            reverse=True
        )
        
        return normalized_items
    
    async def enrich_with_ai(self, items: list[TrendItem]) -> list[TrendItem]:
        """
        Enrich trend items with AI-generated highlights.
        
        Args:
            items: List of TrendItem objects to enrich
            
        Returns:
            List of TrendItem objects with highlights populated
        """
        if not self.openai_client:
            logger.warning("OpenAI not configured, skipping AI enrichment")
            return items
        
        if not items:
            return items
        
        # Process items in batches to avoid rate limits
        batch_size = 5
        enriched_items = []
        
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            batch_results = await self._enrich_batch(batch)
            enriched_items.extend(batch_results)
            
            # Small delay between batches to avoid rate limits
            if i + batch_size < len(items):
                await asyncio.sleep(0.5)
        
        return enriched_items
    
    async def _enrich_batch(self, items: list[TrendItem]) -> list[TrendItem]:
        """Enrich a batch of items with AI highlights."""
        if not items:
            return items
        
        try:
            # For single item, use direct completion
            if len(items) == 1:
                item = items[0]
                highlight = await self._generate_highlight(item)
                item.highlight = highlight
                return [item]
            
            # For multiple items, batch them in a single request
            messages = [
                {
                    "role": "system",
                    "content": """You are a concise tech analyst for a professional networking platform called Vetted. 
Summarize each article into one short highlight (max 40 words) for a feed of tech trends. 
Mention "AI", "startups", or "software" only if relevant. Avoid fluff.
Return JSON array with one highlight per article in the same order."""
                },
                {
                    "role": "user",
                    "content": "\n\n".join([
                        f"Article {i+1}:\nTitle: {item.title}\nExcerpt: {item.raw_excerpt}\nSource: {item.source}"
                        for i, item in enumerate(items)
                    ])
                }
            ]
            
            # Use asyncio.to_thread to run synchronous OpenAI call (Python 3.9+)
            def _call_openai():
                return self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=200 * len(items)
                )
            
            # Use to_thread if available, otherwise fallback to run_in_executor
            if hasattr(asyncio, 'to_thread'):
                response = await asyncio.to_thread(_call_openai)
            else:
                import concurrent.futures
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, _call_openai)
            
            content = response.choices[0].message.content
            if not content:
                # Fallback to individual calls
                return await self._enrich_individually(items)
            
            # Try to parse as JSON array
            import json
            try:
                highlights = json.loads(content)
                if isinstance(highlights, list) and len(highlights) == len(items):
                    for item, highlight in zip(items, highlights):
                        item.highlight = str(highlight) if highlight else ""
                    return items
            except json.JSONDecodeError:
                pass
            
            # Fallback: try to extract highlights from text
            lines = content.strip().split("\n")
            highlights = [line.strip() for line in lines if line.strip() and not line.strip().startswith("Article")]
            if len(highlights) >= len(items):
                for item, highlight in zip(items, highlights[:len(items)]):
                    item.highlight = highlight
                return items
            
            # Final fallback: individual calls
            return await self._enrich_individually(items)
            
        except Exception as e:
            logger.error(f"Error enriching batch with AI: {e}")
            # Return items without highlights on error
            return items
    
    async def _enrich_individually(self, items: list[TrendItem]) -> list[TrendItem]:
        """Enrich items one by one (fallback method)."""
        enriched = []
        for item in items:
            try:
                highlight = await self._generate_highlight(item)
                item.highlight = highlight
            except Exception as e:
                logger.error(f"Error generating highlight for item: {e}")
                item.highlight = ""
            enriched.append(item)
        return enriched
    
    async def _generate_highlight(self, item: TrendItem) -> str:
        """Generate a single highlight for an item."""
        def _call_openai():
            return self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a concise tech analyst for a professional networking platform called Vetted. 
Summarize this article into one short highlight (max 40 words) for a feed of tech trends. 
Mention "AI", "startups", or "software" only if relevant. Avoid fluff."""
                    },
                    {
                        "role": "user",
                        "content": f"Title: {item.title}\nExcerpt: {item.raw_excerpt}\nSource: {item.source}"
                    }
                ],
                temperature=0.7,
                max_tokens=100
            )
        
        # Use to_thread if available (Python 3.9+), otherwise fallback to run_in_executor
        if hasattr(asyncio, 'to_thread'):
            response = await asyncio.to_thread(_call_openai)
        else:
            import concurrent.futures
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, _call_openai)
        
        content = response.choices[0].message.content
        return content.strip() if content else ""
    
    async def get_trends(self) -> TrendsResponse:
        """
        Orchestrate end-to-end flow to fetch and enrich trends.
        
        Returns:
            TrendsResponse with enriched trend items
        """
        try:
            # Step 1: Fetch raw trends from Google
            logger.info("Fetching raw trends from Google Search API")
            raw_items = await self.fetch_raw_trends()
            
            if not raw_items:
                logger.warning("No raw trends fetched, returning empty response")
                return TrendsResponse(
                    items=[],
                    last_updated=datetime.utcnow()
                )
            
            # Step 2: Normalize and deduplicate
            logger.info(f"Normalizing {len(raw_items)} raw items")
            normalized_items = self._normalize_results(raw_items)
            
            # Step 3: Enrich with AI highlights
            logger.info(f"Enriching {len(normalized_items)} items with AI")
            enriched_items = await self.enrich_with_ai(normalized_items)
            
            # Step 4: Return response
            return TrendsResponse(
                items=enriched_items,
                last_updated=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error in get_trends: {e}", exc_info=True)
            # Return empty response on error rather than crashing
            return TrendsResponse(
                items=[],
                last_updated=datetime.utcnow()
            )

