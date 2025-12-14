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
import sqlite3
import json
import os
from pathlib import Path
import glob

# Configuration
MAX_RESULTS = 100
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
OUTPUT_FILE = os.getenv("LINKEDIN_OUTPUT_FILE", "linkedin_profiles.json")
SCRAPE_PROFILES = os.getenv("SCRAPE_PROFILES", "false").lower() == "true"

def extract_chrome_cookies(domain: str = "linkedin.com") -> list[dict]:
    """Extract LinkedIn cookies from Chrome browser."""
    possible_paths = [
        "~/Library/Application Support/Google/Chrome/Default/Cookies",  # macOS
        "~/.config/google-chrome/Default/Cookies",  # Linux
        "~/AppData/Local/Google/Chrome/User Data/Default/Cookies",  # Windows
    ]

    for path_pattern in possible_paths:
        expanded_path = os.path.expanduser(path_pattern)
        if os.path.exists(expanded_path):
            try:
                conn = sqlite3.connect(expanded_path)
                cursor = conn.cursor()

                # Query for LinkedIn cookies
                cursor.execute("""
                    SELECT name, value, domain, path, expires_utc, is_secure, is_httponly
                    FROM cookies
                    WHERE host_key LIKE ?
                    ORDER BY name
                """, (f"%.{domain}",))

                cookies = []
                for row in cursor.fetchall():
                    name, value, domain, path, expires, secure, httponly = row

                    # Convert Chrome timestamp to unix timestamp
                    expires_unix = (expires / 1000000) - 11644473600 if expires > 0 else None

                    cookies.append({
                        "name": name,
                        "value": value,
                        "domain": domain,
                        "path": path,
                        "httpOnly": bool(httponly),
                        "secure": bool(secure),
                        "expires": expires_unix
                    })

                conn.close()

                if cookies:
                    print(f"[cookies] Found {len(cookies)} LinkedIn cookies in Chrome")
                    return cookies

            except Exception as e:
                print(f"[cookies] Error reading Chrome cookies: {e}")
                continue

    print("[cookies] No LinkedIn cookies found in Chrome")
    return []

def extract_firefox_cookies(domain: str = "linkedin.com") -> list[dict]:
    """Extract LinkedIn cookies from Firefox browser."""
    possible_paths = [
        "~/Library/Application Support/Firefox/Profiles/*/cookies.sqlite",  # macOS
        "~/.mozilla/firefox/*/cookies.sqlite",  # Linux
        "~/AppData/Roaming/Mozilla/Firefox/Profiles/*/cookies.sqlite",  # Windows
    ]

    for path_pattern in possible_paths:
        matching_files = glob.glob(os.path.expanduser(path_pattern))
        for cookie_file in matching_files:
            try:
                conn = sqlite3.connect(cookie_file)
                cursor = conn.cursor()

                # Query for LinkedIn cookies (Firefox schema)
                cursor.execute("""
                    SELECT name, value, host, path, expiry, isSecure, isHttpOnly
                    FROM moz_cookies
                    WHERE host LIKE ?
                    ORDER BY name
                """, (f"%.{domain}",))

                cookies = []
                for row in cursor.fetchall():
                    name, value, host, path, expiry, secure, httponly = row

                    cookies.append({
                        "name": name,
                        "value": value,
                        "domain": host,
                        "path": path,
                        "httpOnly": bool(httponly),
                        "secure": bool(secure),
                        "expires": expiry if expiry > 0 else None
                    })

                conn.close()

                if cookies:
                    print(f"[cookies] Found {len(cookies)} LinkedIn cookies in Firefox")
                    return cookies

            except Exception as e:
                print(f"[cookies] Error reading Firefox cookies: {e}")
                continue

    print("[cookies] No LinkedIn cookies found in Firefox")
    return []

def load_linkedin_cookies() -> list[dict]:
    """Load LinkedIn cookies from available browsers or JSON file."""
    print("[cookies] Loading LinkedIn cookies...")

    # First, try to load from JSON file (manual extraction)
    cookie_file = "linkedin_cookies.json"
    if os.path.exists(cookie_file):
        try:
            with open(cookie_file, 'r') as f:
                cookies = json.load(f)
            print(f"[cookies] Loaded {len(cookies)} cookies from {cookie_file}")
            return cookies
        except Exception as e:
            print(f"[cookies] Error loading {cookie_file}: {e}")

    # Try automatic browser extraction
    print("[cookies] Attempting automatic browser cookie extraction...")

    # Try Chrome first, then Firefox
    cookies = extract_chrome_cookies()
    if not cookies:
        cookies = extract_firefox_cookies()

    if cookies:
        print(f"[cookies] Successfully loaded {len(cookies)} LinkedIn cookies from browser")
        # Filter to essential LinkedIn cookies
        essential_cookies = ['li_at', 'JSESSIONID', 'liap', 'bcookie', 'bscookie', 'lang']
        filtered_cookies = [c for c in cookies if c['name'] in essential_cookies]
        print(f"[cookies] Using {len(filtered_cookies)} essential LinkedIn cookies")
        return filtered_cookies
    else:
        print("[cookies] No LinkedIn cookies found.")
        print("[cookies] Try running: python3 extract_cookies.py")
        print("[cookies] Or ensure you're logged into LinkedIn in Chrome/Firefox")
        return []

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


async def scrape_profiles(urls: list[str], use_browser_cookies: bool = True) -> list[dict]:
    """Scrape all LinkedIn profile URLs using Playwright."""
    profiles: list[dict] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # Load cookies from browser if requested
        cookies = []
        if use_browser_cookies:
            cookies = load_linkedin_cookies()

        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        # Add cookies to context if we have them
        if cookies:
            await context.add_cookies(cookies)
            print(f"[scrape] Added {len(cookies)} authentication cookies to browser context")

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
                                         scrape: bool = False, use_browser_cookies: bool = True) -> list[dict]:
    """
    Main function to search for LinkedIn profiles and optionally scrape them.

    Args:
        search_query: Search query (e.g., "software engineer", "machine learning engineer")
        location: Optional location filter (e.g., "San Francisco", "New York")
        company: Optional company filter (e.g., "Google", "Microsoft")
        title: Optional job title filter (e.g., "Senior Engineer", "Product Manager")
        scrape: Whether to scrape profile HTML (requires Playwright)
        use_browser_cookies: Whether to use browser cookies for authentication

    Returns:
        List of profile dictionaries with LinkedIn URLs and optionally HTML.
    """
    urls = fetch_linkedin_profile_urls(search_query, location, company, title)

    if scrape:
        profiles = await scrape_profiles(urls, use_browser_cookies)
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
        parser.add_argument("--no-cookies", action="store_true", help="Don't use browser cookies for authentication")
        
        args = parser.parse_args()
        
        # Get search query from command line or environment
        search_query = args.query or os.getenv("LINKEDIN_SEARCH_QUERY") or "software engineer"
        scrape = args.scrape or SCRAPE_PROFILES
        use_browser_cookies = not args.no_cookies  # Default to using cookies

        if use_browser_cookies and scrape:
            print("[auth] Will attempt to use LinkedIn cookies from your browser for authentication")
            print("[auth] Make sure you're logged into LinkedIn in Chrome or Firefox")

        profiles = asyncio.run(run_linkedin_search_and_scrape(
            search_query=search_query,
            location=args.location or os.getenv("LINKEDIN_LOCATION"),
            company=args.company or os.getenv("LINKEDIN_COMPANY"),
            title=args.title or os.getenv("LINKEDIN_TITLE"),
            scrape=scrape,
            use_browser_cookies=use_browser_cookies,
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
