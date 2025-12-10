#!/usr/bin/env python3
"""
Ashby Job Scraper

Searches Google for Ashby job postings and scrapes detailed job information
using SerpAPI and Playwright.
"""

import os
import json
import asyncio
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from serpapi import GoogleSearch
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup, Tag

# ---------- CONFIG ----------

DEFAULT_SEARCH_QUERY = 'site:jobs.ashbyhq.com "software engineer"'
MAX_RESULTS = 100  # target number of URLs to collect
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
OUTPUT_FILE = os.getenv("ASHBY_OUTPUT_FILE", "ashby_jobs.json")
ALLOWED_DOMAIN_FRAGMENT = "jobs.ashbyhq.com"

# ---------- SEARCH PHASE (SerpAPI) ----------


def fetch_ashby_job_urls(search_query: str | None = None) -> list[str]:
    """Fetch Ashby job URLs from Google search using SerpAPI."""
    if not SERPAPI_KEY:
        raise RuntimeError("SERPAPI_KEY environment variable is not set.")

    # Use provided query or default, or from environment
    query = search_query or os.getenv("ASHBY_SEARCH_QUERY") or DEFAULT_SEARCH_QUERY
    
    # Ensure it's a proper site search
    if not query.startswith("site:jobs.ashbyhq.com"):
        # If it doesn't start with site:, construct the query
        if query.startswith("site:"):
            # Already has site: but different domain, replace it
            query = f'site:jobs.ashbyhq.com {query.split(" ", 1)[1] if " " in query else ""}'
        else:
            # No site: prefix, add it
            query = f'site:jobs.ashbyhq.com "{query}"'

    print(f"[search] Fetching up to {MAX_RESULTS} results for: {query!r}")

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

        if ALLOWED_DOMAIN_FRAGMENT not in link:
            continue

        base = link.split("?", 1)[0]
        urls.append(base)

    deduped: list[str] = []
    seen = set()

    for u in urls:
        if u not in seen:
            deduped.append(u)
            seen.add(u)

    if len(deduped) > MAX_RESULTS:
        deduped = deduped[:MAX_RESULTS]

    print(f"[search] Collected {len(deduped)} Ashby URLs")
    return deduped


# ---------- GENERIC HELPERS ----------


def extract_company_from_title(title: str | None) -> str | None:
    """Extract company name from job title (e.g., 'Software Engineer @ Company')."""
    if not title:
        return None
    if "@" in title:
        return title.split("@", 1)[1].strip()
    return None


def find_field_value(soup: BeautifulSoup, label: str) -> str | None:
    """Find a field value by label in the HTML."""
    node = soup.find(string=re.compile(rf"^{label}\s*$", re.IGNORECASE))
    if not node:
        return None

    parent = node.parent
    if not parent:
        return None

    sibling = parent.find_next_sibling()
    if sibling:
        text = sibling.get_text(" ", strip=True)
        if text:
            return text

    for sib in parent.next_siblings:
        if getattr(sib, "get_text", None):
            text = sib.get_text(" ", strip=True)
            if text:
                return text

    return None


def extract_description_text(soup: BeautifulSoup) -> str:
    """Extract all paragraph text as description."""
    paragraphs = soup.find_all("p")
    texts = [p.get_text(" ", strip=True) for p in paragraphs if p.get_text(strip=True)]
    description = "\n".join(texts)
    max_chars = 20000
    if len(description) > max_chars:
        description = description[:max_chars] + " ...[truncated]"
    return description


# ---------- SECTION PARSING ----------

HEADING_TAGS = ["h1", "h2", "h3", "h4"]


def normalize_heading(text: str) -> str:
    """Normalize heading text to a standard key."""
    t = text.strip().lower()
    if "overview" in t:
        return "overview"
    if "the role" in t or t == "role" or t.startswith("role "):
        return "role"
    if "technolog" in t:
        return "technologies"
    if "what we value" in t or "values" in t:
        return "what_we_value"
    if "what we require" in t or "requirements" in t or "require" in t:
        return "what_we_require"
    if "don't work here" in t or "dont work here" in t or "do not work here" in t:
        return "dont_work_here"
    if "compensation" in t or "salary" in t or "pay" in t:
        return "compensation"
    if "benefits" in t or "perks" in t:
        return "benefits"
    slug = re.sub(r"[^a-z0-9]+", "_", t).strip("_")
    return slug or "misc_section"


def gather_sections(soup: BeautifulSoup) -> dict:
    """Gather all sections from the page by finding headings and their content."""
    sections: dict[str, str] = {}

    all_headings: list[Tag] = []
    for tag_name in HEADING_TAGS:
        all_headings.extend(soup.find_all(tag_name))

    # Roughly in DOM order
    for heading in all_headings:
        heading_text = heading.get_text(" ", strip=True)
        if not heading_text:
            continue

        norm = normalize_heading(heading_text)

        content_parts: list[str] = []
        sibling = heading.next_sibling

        while sibling and not (
            isinstance(sibling, Tag) and sibling.name in HEADING_TAGS
        ):
            if isinstance(sibling, Tag):
                txt = sibling.get_text("\n", strip=True)
                if txt:
                    content_parts.append(txt)
            sibling = sibling.next_sibling

        raw_text = "\n\n".join(content_parts).strip()

        if not raw_text:
            continue

        if norm in sections:
            sections[norm] = sections[norm] + "\n\n" + raw_text
        else:
            sections[norm] = raw_text

    return sections


def split_into_items(raw: str | None) -> list[str]:
    """Split text into list items (bullet points, etc.)."""
    if not raw:
        return []

    tmp = raw.replace("\r", "\n")
    chunks = re.split(r"\n\s*\n|•|\-\s+", tmp)
    items: list[str] = []

    for c in chunks:
        c = c.strip()
        if len(c) < 5:
            continue
        items.append(c)

    return items


def parse_salary_range(raw_comp: str | None) -> dict | None:
    """Parse salary range from compensation text."""
    if not raw_comp:
        return None

    m = re.search(
        r"\$?\s*([\d,]+)\s*-\s*\$?\s*([\d,]+)\s*/?\s*(year|yr|annum)?",
        raw_comp,
        flags=re.IGNORECASE,
    )

    if not m:
        return None

    min_str, max_str, period = m.groups()
    min_val = int(min_str.replace(",", ""))
    max_val = int(max_str.replace(",", ""))

    if not period:
        period = "year"

    return {
        "currency": "USD",
        "min": min_val,
        "max": max_val,
        "period": period.lower(),
    }


def derive_meta(full_text: str) -> dict:
    """Derive metadata from full text."""
    work_hours = None
    location_expectation = None

    if re.search(r"70\s*(hrs|hours)", full_text, re.IGNORECASE):
        work_hours = "~70 hrs/week (from posting text)"

    if re.search(r"in person", full_text, re.IGNORECASE):
        location_expectation = "In-person (from posting text)"

    return {
        "work_hours_expectation": work_hours,
        "location_expectation": location_expectation,
        "apply_url": None,
    }


# ---------- SCRAPING A SINGLE JOB ----------


async def scrape_job(page, url: str) -> dict:
    """Scrape a single job posting page."""
    print(f"[scrape] Visiting {url}")

    try:
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        title_tag = soup.find("title")
        raw_title = title_tag.get_text(strip=True) if title_tag else None

        company = extract_company_from_title(raw_title)
        location = find_field_value(soup, "Location")
        employment_type = find_field_value(soup, "Employment Type")
        department = find_field_value(soup, "Department")

        description_text = extract_description_text(soup)
        sections = gather_sections(soup)

        overview_raw = sections.get("overview")
        role_raw = sections.get("role")
        technologies_raw = sections.get("technologies")
        what_we_value_raw = sections.get("what_we_value")
        what_we_require_raw = sections.get("what_we_require")
        dont_work_here_raw = sections.get("dont_work_here")
        compensation_raw = sections.get("compensation")
        benefits_raw = sections.get("benefits")

        headline = None
        overview_summary = None

        if overview_raw:
            lines = [l.strip() for l in overview_raw.split("\n") if l.strip()]
            if lines:
                headline = lines[0]
            overview_summary = overview_raw

        role_summary = role_raw

        responsibilities = split_into_items(role_raw)

        languages_and_frameworks: list[str] = []
        open_source_tech: list[str] = []
        tooling: list[str] = []

        if technologies_raw:
            tech_items = split_into_items(technologies_raw)
            for item in tech_items:
                lower = item.lower()
                if any(
                    k in lower
                    for k in [
                        "react",
                        "typescript",
                        "python",
                        "javascript",
                        "rust",
                        "c++",
                        "node",
                    ]
                ):
                    languages_and_frameworks.append(item)
                elif any(
                    k in lower
                    for k in [
                        "postgres",
                        "turborepo",
                        "lodash",
                        "zod",
                        "open-source",
                    ]
                ):
                    open_source_tech.append(item)
                elif any(
                    k in lower
                    for k in ["github actions", "terraform", "spacelift", "tooling"]
                ):
                    tooling.append(item)

        what_we_value = split_into_items(what_we_value_raw)
        requirements = split_into_items(what_we_require_raw)
        not_for_you_if = split_into_items(dont_work_here_raw)
        benefits = split_into_items(benefits_raw)

        salary_range = parse_salary_range(compensation_raw)

        compensation = {
            "salary_range": salary_range,
            "notes": compensation_raw,
        }

        meta = derive_meta(description_text + "\n\n" + (dont_work_here_raw or ""))

        job_data = {
            "company": company,
            "title": raw_title,
            "location": location,
            "employment_type": employment_type,
            "department": department,
            "source": "ashbyhq",
            "overview": {
                "headline": headline,
                "summary": overview_summary,
            },
            "role": {
                "summary": role_summary,
                "responsibilities": responsibilities,
                "ideal_candidate_profile": None,
            },
            "technologies": {
                "languages_and_frameworks": languages_and_frameworks,
                "open_source_tech": open_source_tech,
                "tooling": tooling,
            },
            "what_we_value": what_we_value,
            "requirements": requirements,
            "not_for_you_if": not_for_you_if,
            "compensation": compensation,
            "benefits": benefits,
            "meta": meta,
            "raw_sections": {
                "overview_raw": overview_raw,
                "role_raw": role_raw,
                "technologies_raw": technologies_raw,
                "what_we_value_raw": what_we_value_raw,
                "what_we_require_raw": what_we_require_raw,
                "dont_work_here_raw": dont_work_here_raw,
                "compensation_raw": compensation_raw,
                "benefits_raw": benefits_raw,
            },
            "description_text": description_text,
            "url": url,
            "scraped_at": datetime.utcnow().isoformat() + "Z",
        }

        return job_data

    except Exception as e:
        print(f"[scrape] Error scraping {url}: {e}")
        raise


# ---------- MAIN ORCHESTRATOR ----------


async def scrape_jobs(urls: list[str]) -> list[dict]:
    """Scrape all job URLs using Playwright."""
    jobs: list[dict] = []

    async with async_playwright() as p:
        # On Alpine Linux, use system chromium if available
        chromium_path = os.getenv("PLAYWRIGHT_CHROMIUM_PATH") or "/usr/bin/chromium"
        launch_options = {
            "headless": True,
        }
        # Use system chromium if it exists (Alpine Linux)
        if os.path.exists(chromium_path):
            launch_options["executable_path"] = chromium_path
        
        browser = await p.chromium.launch(**launch_options)
        page = await browser.new_page()

        for i, url in enumerate(urls, start=1):
            try:
                job = await scrape_job(page, url)
                jobs.append(job)
                print(f"[scrape] Done {i}/{len(urls)}")
            except Exception as e:
                print(f"[scrape] ERROR on {url}: {e}")

        await browser.close()

    return jobs


def run_ashby_scrape(search_query: str | None = None) -> list[dict]:
    """
    Main function to run the Ashby scrape.
    
    Args:
        search_query: Optional search query (e.g., "software engineer", "machine learning")
                     If not provided, uses DEFAULT_SEARCH_QUERY or ASHBY_SEARCH_QUERY env var.
    
    Returns:
        List of job dictionaries.
    """
    urls = fetch_ashby_job_urls(search_query)
    jobs = asyncio.run(scrape_jobs(urls))
    return jobs


def main():
    """CLI entry point."""
    try:
        # Get search query from command line argument or environment variable
        search_query = None
        if len(sys.argv) > 1:
            search_query = sys.argv[1]
        
        jobs = run_ashby_scrape(search_query)

        # Determine output path
        output_path = Path(OUTPUT_FILE)
        if not output_path.is_absolute():
            # If relative, make it relative to project root
            project_root = Path(__file__).parent.parent.parent
            output_path = project_root / OUTPUT_FILE

        print(f"[output] Writing {len(jobs)} jobs to {output_path}")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(jobs, f, ensure_ascii=False, indent=2)

        print(f"[output] Successfully saved {len(jobs)} jobs")
        return 0

    except Exception as e:
        print(f"[error] {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

