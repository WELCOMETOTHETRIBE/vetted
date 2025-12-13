#!/usr/bin/env python3
"""
LinkedIn Profile Scraper

Searches Google for LinkedIn profiles matching search criteria
using SerpAPI, then scrapes profile HTML using Playwright.
"""

import os
import json
import sys
import argparse
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

from serpapi import GoogleSearch
from playwright.async_api import async_playwright

# Configuration
MAX_RESULTS = 100
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
OUTPUT_FILE = os.getenv("LINKEDIN_OUTPUT_FILE", "linkedin_profiles.json")
SCRAPE_PROFILES = os.getenv("SCRAPE_PROFILES", "false").lower() == "true"

def fetch_linkedin_profile_urls(search_query: str, location: Optional[str] = None, 
                                company: Optional[str] = None, title: Optional[str] = None) -> list[str]:
    """Fetch LinkedIn profile URLs from Google search using SerpAPI."""
    if not SERPAPI_KEY:
        raise RuntimeError("SERPAPI_KEY environment variable is not set.")

    # Build search query
    query_parts = []
    
    # Base LinkedIn site filter
    query_parts.append("site:linkedin.com/in/")
    
    # Add search query
    if search_query:
        query_parts.append(f'"{search_query}"')
    
    # Add location filter
    if location:
        query_parts.append(f'"{location}"')
    
    # Add company filter
    if company:
        query_parts.append(f'"{company}"')
    
    # Add title filter
    if title:
        query_parts.append(f'"{title}"')
    
    query = " ".join(query_parts)
    
    print(f"[search] Fetching up to {MAX_RESULTS} LinkedIn profiles for: {query!r}")

    params = {
        "engine": "google",
        "q": query,
        "api_key": SERPAPI_KEY,
        "num": 100,
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    urls: list[str] = []
    
    for item in results.get("organic_results", []):
        link = item.get("link")
        if not link:
            continue
        
        # Filter for LinkedIn profile URLs
        if "linkedin.com/in/" not in link:
            continue
        
        # Clean URL (remove query params)
        base = link.split("?", 1)[0].split("#", 1)[0]
        
        # Validate it's a profile URL
        if "/in/" in base and base not in urls:
            urls.append(base)

    # Deduplicate
    deduped = list(dict.fromkeys(urls))  # Preserves order
    
    if len(deduped) > MAX_RESULTS:
        deduped = deduped[:MAX_RESULTS]

    print(f"[search] Collected {len(deduped)} LinkedIn profile URLs")
    return deduped


async def scrape_profile_html(page, url: str) -> Optional[dict]:
    """Scrape LinkedIn profile HTML."""
    print(f"[scrape] Visiting {url}")
    
    try:
        # Navigate to profile
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)  # Wait for content to load
        
        # Get HTML content
        html = await page.content()
        
        # Get raw text
        body_text = await page.evaluate("() => document.body ? document.body.innerText : ''")
        
        # Extract basic info from page title
        title = await page.title()
        
        profile_data = {
            "linkedin_url": url,
            "html": html,
            "raw_text": body_text,
            "title": title,
            "scraped_at": datetime.utcnow().isoformat() + "Z",
            "status": "scraped",
        }
        
        return profile_data
    except Exception as e:
        print(f"[scrape] Error scraping {url}: {e}")
        return {
            "linkedin_url": url,
            "error": str(e),
            "status": "error",
        }


async def scrape_profiles(urls: list[str]) -> list[dict]:
    """Scrape all LinkedIn profile URLs using Playwright."""
    profiles: list[dict] = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        for i, url in enumerate(urls, start=1):
            try:
                profile = await scrape_profile_html(page, url)
                if profile:
                    profiles.append(profile)
                print(f"[scrape] Done {i}/{len(urls)}")
                # Add delay to avoid rate limiting
                await page.wait_for_timeout(2000)
            except Exception as e:
                print(f"[scrape] ERROR on {url}: {e}")
                profiles.append({
                    "linkedin_url": url,
                    "error": str(e),
                    "status": "error",
                })

        await browser.close()

    return profiles


def create_profile_data(urls: list[str]) -> list[dict]:
    """Create profile data structure from URLs."""
    profiles = []
    
    for url in urls:
        profile_slug = url.split("/in/")[-1].split("/")[0] if "/in/" in url else None
        
        profile_data = {
            "linkedin_url": url,
            "profile_slug": profile_slug,
            "found_at": datetime.utcnow().isoformat() + "Z",
            "status": "pending_scrape",
        }
        
        profiles.append(profile_data)
    
    return profiles


async def run_linkedin_search_and_scrape(search_query: str, location: Optional[str] = None,
                                         company: Optional[str] = None, title: Optional[str] = None,
                                         scrape: bool = False) -> list[dict]:
    """
    Main function to search for LinkedIn profiles and optionally scrape them.
    
    Args:
        search_query: Search query (e.g., "software engineer", "machine learning engineer")
        location: Optional location filter (e.g., "San Francisco", "New York")
        company: Optional company filter (e.g., "Google", "Microsoft")
        title: Optional job title filter (e.g., "Senior Engineer", "Product Manager")
        scrape: Whether to scrape profile HTML (requires Playwright)
    
    Returns:
        List of profile dictionaries with LinkedIn URLs and optionally HTML.
    """
    urls = fetch_linkedin_profile_urls(search_query, location, company, title)
    
    if scrape:
        profiles = await scrape_profiles(urls)
    else:
        profiles = create_profile_data(urls)
    
    return profiles


def main():
    """CLI entry point."""
    try:
        parser = argparse.ArgumentParser(description="Search for LinkedIn profiles")
        parser.add_argument("query", nargs="?", help="Search query (e.g., 'software engineer')")
        parser.add_argument("--location", help="Location filter (e.g., 'San Francisco')")
        parser.add_argument("--company", help="Company filter (e.g., 'Google')")
        parser.add_argument("--title", help="Job title filter (e.g., 'Senior Engineer')")
        parser.add_argument("--scrape", action="store_true", help="Scrape profile HTML (requires Playwright)")
        
        args = parser.parse_args()
        
        # Get search query from command line or environment
        search_query = args.query or os.getenv("LINKEDIN_SEARCH_QUERY") or "software engineer"
        scrape = args.scrape or SCRAPE_PROFILES
        
        profiles = asyncio.run(run_linkedin_search_and_scrape(
            search_query=search_query,
            location=args.location or os.getenv("LINKEDIN_LOCATION"),
            company=args.company or os.getenv("LINKEDIN_COMPANY"),
            title=args.title or os.getenv("LINKEDIN_TITLE"),
            scrape=scrape,
        ))

        # Determine output path
        output_path = Path(OUTPUT_FILE)
        if not output_path.is_absolute():
            project_root = Path(__file__).parent.parent.parent
            output_path = project_root / OUTPUT_FILE
            
            try:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                # Test write permissions
                test_file = output_path.parent / ".test_write"
                try:
                    test_file.touch()
                    test_file.unlink()
                except PermissionError:
                    # Fallback to /tmp if current location is not writable
                    output_path = Path("/tmp") / OUTPUT_FILE
                    print(f"[output] Current location not writable, using {output_path}")
            except PermissionError:
                # Fallback to /tmp on any error
                output_path = Path("/tmp") / OUTPUT_FILE
                print(f"[output] Cannot write to project root, using {output_path}")
        else:
            # If absolute path, try /tmp if it fails
            try:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                test_file = output_path.parent / ".test_write"
                test_file.touch()
                test_file.unlink()
            except (PermissionError, OSError):
                output_path = Path("/tmp") / OUTPUT_FILE
                print(f"[output] Cannot write to specified path, using {output_path}")

        print(f"[output] Writing {len(profiles)} profile{'s' if len(profiles) != 1 else ''} to {output_path}")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(profiles, f, ensure_ascii=False, indent=2)

        print(f"[output] Successfully saved {len(profiles)} profile{'s' if len(profiles) != 1 else ''} to {output_path}")
        return 0

    except Exception as e:
        print(f"[error] {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
