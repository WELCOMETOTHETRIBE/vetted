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
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

from serpapi import GoogleSearch
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup, Tag

# ---------- CONFIG ----------

SOURCE_CONFIG = {
    "ashby": {
        "site": "jobs.ashbyhq.com",
        "default_query": "software engineer",
        "search_template": 'site:jobs.ashbyhq.com "{query}"',
    },
    "greenhouse": {
        "site": "boards.greenhouse.io",
        "default_query": "software engineer",
        "search_template": 'site:boards.greenhouse.io "{query}"',
    },
    "lever": {
        "site": "lever.co",
        "default_query": "software engineer",
        "search_template": 'site:lever.co "{query}"',
    },
    "workday": {
        "site": "myworkdayjobs.com",
        "default_query": "software engineer",
        "search_template": 'site:myworkdayjobs.com "{query}"',
    },
    "workday_wd5": {
        "site": "wd5.myworkdayjobs.com",
        "default_query": "machine learning engineer",
        "search_template": 'site:wd5.myworkdayjobs.com "{query}"',
    },
    "smartrecruiters": {
        "site": "jobs.smartrecruiters.com",
        "default_query": "software engineer",
        "search_template": 'site:jobs.smartrecruiters.com "{query}"',
    },
    "jobvite": {
        "site": "jobs.jobvite.com",
        "default_query": "software engineer",
        "search_template": 'site:jobs.jobvite.com "{query}"',
    },
    "icims": {
        "site": "icims.com",
        "default_query": "software engineer",
        "search_template": 'site:icims.com inurl:/jobs/ "{query}"',
    },
    "icims_careers": {
        "site": "careers.icims.com",
        "default_query": "software engineer",
        "search_template": 'site:careers.icims.com "{query}"',
    },
    "workable": {
        "site": "apply.workable.com",
        "default_query": "software engineer",
        "search_template": 'site:apply.workable.com "{query}"',
    },
    "workable_jobs": {
        "site": "jobs.workable.com",
        "default_query": "software engineer",
        "search_template": 'site:jobs.workable.com "{query}"',
    },
    "taleo": {
        "site": "taleo.net",
        "default_query": "software engineer",
        "search_template": 'site:taleo.net inurl:careersection "{query}"',
    },
}

MAX_RESULTS = 100  # target number of URLs to collect
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
OUTPUT_FILE = os.getenv("ASHBY_OUTPUT_FILE", "ashby_jobs.json")

# ---------- SEARCH PHASE (SerpAPI) ----------


def fetch_job_urls(search_query: str | None = None, source: str = "ashby") -> list[str]:
    """Fetch job URLs from Google search using SerpAPI."""
    if not SERPAPI_KEY:
        raise RuntimeError("SERPAPI_KEY environment variable is not set.")

    # Get source config
    if source not in SOURCE_CONFIG:
        raise ValueError(f"Unknown source: {source}. Must be one of: {', '.join(SOURCE_CONFIG.keys())}")
    
    config = SOURCE_CONFIG[source]
    allowed_domain = config["site"]
    
    # Use provided query or default, or from environment
    query_text = search_query or os.getenv("ASHBY_SEARCH_QUERY") or config["default_query"]
    
    # Construct the search query
    if query_text.startswith("site:"):
        # Already has site: prefix, use as-is but validate domain
        query = query_text
    else:
        # Use the template for this source
        query = config["search_template"].format(query=query_text)

    print(f"[search] Fetching up to {MAX_RESULTS} results for: {query!r}")
    print(f"[search] Source: {source} ({allowed_domain})")

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

        if allowed_domain not in link:
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

    print(f"[search] Collected {len(deduped)} {source} URLs")
    return deduped


# ---------- GENERIC HELPERS ----------


def extract_company_from_title(title: str | None) -> str | None:
    """Extract company name from job title (e.g., 'Software Engineer @ Company')."""
    if not title:
        return None
    if "@" in title:
        return title.split("@", 1)[1].strip()
    return None


def extract_company_from_url(url: str, source: str) -> str | None:
    """Extract company name from URL for various ATS systems."""
    try:
        if source == "greenhouse":
            # Greenhouse URLs: https://boards.greenhouse.io/companyname/job-id
            # or https://boards.greenhouse.io/companyname/jobs/job-id
            match = re.search(r'boards\.greenhouse\.io/([^/]+)', url)
            if match:
                company = match.group(1)
                # Skip common paths like 'jobs', 'departments', etc.
                if company.lower() in ['jobs', 'departments', 'offices', 'apply']:
                    return None
                # Clean up: replace hyphens with spaces and title case
                company = company.replace('-', ' ').replace('_', ' ')
                # Title case but preserve acronyms
                words = company.split()
                title_words = []
                for word in words:
                    if word.isupper() and len(word) > 1:
                        title_words.append(word)
                    else:
                        title_words.append(word.capitalize())
                return ' '.join(title_words)
        elif source == "lever":
            # Lever URLs: https://jobs.lever.co/companyname/job-id
            # or https://companyname.lever.co/job-id
            # First try subdomain format
            match = re.search(r'https?://([^.]+)\.lever\.co', url)
            if match:
                company = match.group(1)
            else:
                # Try path format
                match = re.search(r'jobs\.lever\.co/([^/]+)', url)
                if match:
                    company = match.group(1)
                else:
                    return None
            
            if company:
                # Clean up: replace hyphens with spaces and title case
                company = company.replace('-', ' ').replace('_', ' ')
                words = company.split()
                title_words = []
                for word in words:
                    if word.isupper() and len(word) > 1:
                        title_words.append(word)
                    else:
                        title_words.append(word.capitalize())
                return ' '.join(title_words)
        elif source in ["workday", "workday_wd5"]:
            # Workday URLs: https://*.myworkdayjobs.com/CompanyName/...
            match = re.search(r'myworkdayjobs\.com/([^/]+)', url)
            if match:
                company = match.group(1)
                if company.lower() not in ['external', 'en-us', 'job']:
                    company = company.replace('-', ' ').replace('_', ' ')
                    words = company.split()
                    title_words = [w.capitalize() if not w.isupper() or len(w) == 1 else w for w in words]
                    return ' '.join(title_words)
        elif source == "smartrecruiters":
            # SmartRecruiters URLs: https://jobs.smartrecruiters.com/CompanyName/...
            match = re.search(r'jobs\.smartrecruiters\.com/([^/]+)', url)
            if match:
                company = match.group(1)
                if company.lower() not in ['jobs', 'search']:
                    company = company.replace('-', ' ').replace('_', ' ')
                    words = company.split()
                    title_words = [w.capitalize() if not w.isupper() or len(w) == 1 else w for w in words]
                    return ' '.join(title_words)
        elif source == "jobvite":
            # Jobvite URLs: https://jobs.jobvite.com/companyname/...
            match = re.search(r'jobs\.jobvite\.com/([^/]+)', url)
            if match:
                company = match.group(1)
                company = company.replace('-', ' ').replace('_', ' ')
                words = company.split()
                title_words = [w.capitalize() if not w.isupper() or len(w) == 1 else w for w in words]
                return ' '.join(title_words)
        elif source in ["icims", "icims_careers"]:
            # iCIMS URLs: https://careers-company.icims.com/... or https://careers.icims.com/...
            match = re.search(r'careers-([^.]+)\.icims\.com', url)
            if match:
                company = match.group(1)
                company = company.replace('-', ' ').replace('_', ' ')
                words = company.split()
                title_words = [w.capitalize() if not w.isupper() or len(w) == 1 else w for w in words]
                return ' '.join(title_words)
        elif source in ["workable", "workable_jobs"]:
            # Workable URLs: https://apply.workable.com/companyname/... or https://jobs.workable.com/companyname/...
            match = re.search(r'(?:apply|jobs)\.workable\.com/([^/]+)', url)
            if match:
                company = match.group(1)
                if company.lower() not in ['careers', 'jobs']:
                    company = company.replace('-', ' ').replace('_', ' ')
                    words = company.split()
                    title_words = [w.capitalize() if not w.isupper() or len(w) == 1 else w for w in words]
                    return ' '.join(title_words)
        elif source == "taleo":
            # Taleo URLs: https://company.taleo.net/... or https://taleo.net/careersection/company/...
            match = re.search(r'([^.]+)\.taleo\.net', url)
            if match:
                company = match.group(1)
                if company.lower() not in ['taleo', 'www']:
                    company = company.replace('-', ' ').replace('_', ' ')
                    words = company.split()
                    title_words = [w.capitalize() if not w.isupper() or len(w) == 1 else w for w in words]
                    return ' '.join(title_words)
    except Exception as e:
        print(f"[extract_company_from_url] Error: {e}")
    return None


def extract_company_greenhouse(soup: BeautifulSoup, url: str) -> str | None:
    """Extract company name from Greenhouse job page."""
    # Try URL first (most reliable for Greenhouse)
    company = extract_company_from_url(url, "greenhouse")
    if company:
        return company
    
    # Try meta tags
    meta_company = soup.find("meta", property="og:site_name")
    if meta_company and meta_company.get("content"):
        content = meta_company.get("content").strip()
        if content and content.lower() not in ["greenhouse", "job board"]:
            return content
    
    # Try og:title which sometimes has "Job Title at Company"
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        text = og_title.get("content")
        if " at " in text.lower():
            parts = text.rsplit(" at ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    
    # Try h1 or page header
    h1 = soup.find("h1")
    if h1:
        text = h1.get_text(strip=True)
        # Sometimes company name is in the h1
        if " at " in text.lower():
            parts = text.rsplit(" at ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    
    # Try finding company name in page structure (breadcrumb, nav, etc.)
    company_elem = soup.find("a", href=re.compile(r"/company/|/about|/team"))
    if company_elem:
        text = company_elem.get_text(strip=True)
        if text and len(text) < 50:  # Reasonable company name length
            return text
    
    # Try looking for company name in page title
    title = soup.find("title")
    if title:
        text = title.get_text(strip=True)
        if " at " in text.lower():
            parts = text.rsplit(" at ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    
    return None


def extract_company_lever(soup: BeautifulSoup, url: str) -> str | None:
    """Extract company name from Lever job page."""
    # Try URL first (most reliable for Lever)
    company = extract_company_from_url(url, "lever")
    if company:
        return company
    
    # Try meta tags
    meta_company = soup.find("meta", property="og:site_name")
    if meta_company and meta_company.get("content"):
        content = meta_company.get("content").strip()
        if content and content.lower() not in ["lever", "job board"]:
            return content
    
    # Try og:title which sometimes has "Job Title at Company"
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        text = og_title.get("content")
        if " at " in text.lower():
            parts = text.rsplit(" at ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    
    # Try page title
    title = soup.find("title")
    if title:
        text = title.get_text(strip=True)
        if " at " in text.lower():
            parts = text.rsplit(" at ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    
    # Try finding company name in page structure
    company_elem = soup.find("a", href=re.compile(r"/company/|/about|/team"))
    if company_elem:
        text = company_elem.get_text(strip=True)
        if text and len(text) < 50:
            return text
    
    return None


def extract_fields_greenhouse(soup: BeautifulSoup) -> dict:
    """Extract job fields from Greenhouse page structure."""
    fields = {
        "location": None,
        "employment_type": None,
        "department": None,
    }
    
    # Greenhouse often uses specific class names or data attributes
    # Look for location
    location_elem = soup.find(string=re.compile(r"location", re.IGNORECASE))
    if location_elem:
        parent = location_elem.parent
        if parent:
            # Try to find the value in next sibling or parent
            value = find_field_value(soup, "Location")
            if value:
                fields["location"] = value
    
    # Try common Greenhouse selectors
    location_selectors = [
        soup.find("div", class_=re.compile(r"location", re.I)),
        soup.find("span", class_=re.compile(r"location", re.I)),
        soup.find("p", class_=re.compile(r"location", re.I)),
    ]
    for elem in location_selectors:
        if elem:
            text = elem.get_text(strip=True)
            if text and len(text) < 100:  # Reasonable location length
                fields["location"] = text
                break
    
    return fields


def extract_fields_lever(soup: BeautifulSoup) -> dict:
    """Extract job fields from Lever page structure."""
    fields = {
        "location": None,
        "employment_type": None,
        "department": None,
    }
    
    # Lever typically has a structure like:
    # h1: Job Title
    # div/span: Location / Employment Type / Hybrid
    # Sometimes: Department – Department
    
    # Look for the main content area
    main_content = soup.find("div", class_=re.compile(r"content|posting|job", re.I))
    if not main_content:
        main_content = soup.find("main") or soup.find("body")
    
    # Try to find location/employment type in common Lever patterns
    # Pattern 1: Look for text that contains location patterns (City, State, Country)
    location_pattern = re.compile(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z]{2,3}(?:\s+[A-Z][a-z]+)*)', re.MULTILINE)
    
    # Look for the posting header area (usually near h1)
    posting_header = None
    h1 = soup.find("h1")
    if h1:
        # Look for sibling or parent container
        parent = h1.parent
        if parent:
            # Get all text from parent and siblings
            header_text = parent.get_text("\n", strip=True)
            # Look for location pattern
            location_match = location_pattern.search(header_text)
            if location_match:
                # Extract the full line that contains location
                lines = header_text.split("\n")
                for line in lines:
                    if location_match.group(1) in line:
                        # Parse the line: "Location / Employment Type / Hybrid"
                        parts = [p.strip() for p in line.split("/")]
                        if len(parts) > 0:
                            fields["location"] = parts[0]
                        if len(parts) > 1:
                            # Employment type might be like "Full-Time (Hybrid in Office Location)"
                            emp_type = parts[1].strip()
                            # Clean up employment type
                            if "full" in emp_type.lower() or "full-time" in emp_type.lower():
                                fields["employment_type"] = "FULL_TIME"
                            elif "part" in emp_type.lower() or "part-time" in emp_type.lower():
                                fields["employment_type"] = "PART_TIME"
                            elif "contract" in emp_type.lower():
                                fields["employment_type"] = "CONTRACT"
                            elif "intern" in emp_type.lower():
                                fields["employment_type"] = "INTERNSHIP"
                            else:
                                fields["employment_type"] = emp_type
                        break
    
    # Pattern 2: Look for specific Lever class names
    location_selectors = [
        soup.find("div", class_=re.compile(r"posting-categories|posting-header", re.I)),
        soup.find("span", class_=re.compile(r"location|workplace", re.I)),
        soup.find("div", class_=re.compile(r"location", re.I)),
    ]
    
    for elem in location_selectors:
        if elem:
            text = elem.get_text("\n", strip=True)
            # Check if it matches location pattern
            location_match = location_pattern.search(text)
            if location_match and not fields["location"]:
                # Extract location
                parts = [p.strip() for p in text.split("/")]
                if len(parts) > 0:
                    fields["location"] = parts[0]
                if len(parts) > 1 and not fields["employment_type"]:
                    emp_type = parts[1].strip()
                    if "full" in emp_type.lower():
                        fields["employment_type"] = "FULL_TIME"
                    elif "part" in emp_type.lower():
                        fields["employment_type"] = "PART_TIME"
                    elif "contract" in emp_type.lower():
                        fields["employment_type"] = "CONTRACT"
                    elif "intern" in emp_type.lower():
                        fields["employment_type"] = "INTERNSHIP"
                break
    
    # Extract department - Lever often shows "Department – Department" or "Department / Department"
    dept_pattern = re.compile(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[–\-/]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', re.MULTILINE)
    if main_content:
        dept_text = main_content.get_text("\n", strip=True)
        dept_match = dept_pattern.search(dept_text)
        if dept_match:
            # Usually the first part is the department
            fields["department"] = dept_match.group(1).strip()
    
    # Fallback: Try generic field finder
    if not fields["location"]:
        location = find_field_value(soup, "Location")
        if location:
            fields["location"] = location
    
    if not fields["employment_type"]:
        emp_type = find_field_value(soup, "Employment Type")
        if emp_type:
            fields["employment_type"] = emp_type
    
    if not fields["department"]:
        dept = find_field_value(soup, "Department")
        if dept:
            fields["department"] = dept
    
    return fields


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


def extract_description_text(soup: BeautifulSoup, source: str = "ashby") -> str:
    """Extract all paragraph text as description."""
    # For Lever, try to get the main content area first
    if source == "lever":
        # Look for the main job description area
        main_content = soup.find("div", class_=re.compile(r"content|posting|description|section", re.I))
        if main_content:
            # Get all text from main content, preserving structure
            description = main_content.get_text("\n", strip=True)
            # Remove common Lever footer text
            description = re.sub(r'Jobs powered by.*?$', '', description, flags=re.MULTILINE | re.DOTALL)
            description = re.sub(r'Save Profile JSON.*?$', '', description, flags=re.MULTILINE | re.DOTALL)
            description = description.strip()
            if description:
                max_chars = 20000
                if len(description) > max_chars:
                    description = description[:max_chars] + " ...[truncated]"
                return description
    
    # Fallback to paragraph extraction
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
    if "what you'll do" in t or "what you will do" in t or "what you do" in t:
        return "what_you_do"
    if "you'll be responsible" in t or "you will be responsible" in t or "you're responsible" in t:
        return "responsibilities"
    if "you'll bring" in t or "you will bring" in t or "you bring" in t or "requirements" in t:
        return "what_we_require"
    if "why" in t and ("company" in t or "us" in t or "recordpoint" in t or "join" in t):
        return "why_join"
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


async def scrape_job(page, url: str, source: str = "ashby") -> dict:
    """Scrape a single job posting page."""
    print(f"[scrape] Visiting {url} (source: {source})")

    try:
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        title_tag = soup.find("title")
        raw_title = title_tag.get_text(strip=True) if title_tag else None

        # Extract company name based on source
        company = None
        if source == "ashby":
            company = extract_company_from_title(raw_title)
        elif source == "greenhouse":
            company = extract_company_greenhouse(soup, url)
        elif source == "lever":
            company = extract_company_lever(soup, url)
        else:
            # For other ATS systems, try URL extraction first
            company = extract_company_from_url(url, source)
            # Fallback to title extraction
            if not company:
                company = extract_company_from_title(raw_title)
        
        # If still no company, try URL extraction as fallback
        if not company:
            company = extract_company_from_url(url, source)
        
        # Extract fields based on source
        if source == "greenhouse":
            fields = extract_fields_greenhouse(soup)
            location = fields.get("location") or find_field_value(soup, "Location")
            employment_type = fields.get("employment_type") or find_field_value(soup, "Employment Type")
            department = fields.get("department") or find_field_value(soup, "Department")
        elif source == "lever":
            fields = extract_fields_lever(soup)
            location = fields.get("location") or find_field_value(soup, "Location")
            employment_type = fields.get("employment_type") or find_field_value(soup, "Employment Type")
            department = fields.get("department") or find_field_value(soup, "Department")
        else:  # ashby and other ATS systems
            location = find_field_value(soup, "Location")
            employment_type = find_field_value(soup, "Employment Type")
            department = find_field_value(soup, "Department")

        description_text = extract_description_text(soup, source)
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

        # Map source to output format
        source_map = {
            "ashby": "ashbyhq",
            "greenhouse": "greenhouse",
            "lever": "lever",
            "workday": "workday",
            "workday_wd5": "workday",
            "smartrecruiters": "smartrecruiters",
            "jobvite": "jobvite",
            "icims": "icims",
            "icims_careers": "icims",
            "workable": "workable",
            "workable_jobs": "workable",
            "taleo": "taleo",
        }
        
        job_data = {
            "company": company or "Unknown Company",
            "title": raw_title,
            "location": location,
            "employment_type": employment_type,
            "department": department,
            "source": source_map.get(source, source),
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


async def scrape_jobs(urls: list[str], source: str = "ashby") -> list[dict]:
    """Scrape all job URLs using Playwright."""
    jobs: list[dict] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for i, url in enumerate(urls, start=1):
            try:
                job = await scrape_job(page, url, source)
                jobs.append(job)
                print(f"[scrape] Done {i}/{len(urls)}")
            except Exception as e:
                print(f"[scrape] ERROR on {url}: {e}")

        await browser.close()

    return jobs


def run_ashby_scrape(search_query: str | None = None, source: str = "ashby") -> list[dict]:
    """
    Main function to run the job scrape.
    
    Args:
        search_query: Optional search query (e.g., "software engineer", "machine learning", "Product Designer")
                     If not provided, uses default query for the source.
        source: Job board source ("ashby", "greenhouse", or "lever"). Defaults to "ashby".
    
    Returns:
        List of job dictionaries.
    """
    urls = fetch_job_urls(search_query, source)
    jobs = asyncio.run(scrape_jobs(urls, source))
    return jobs


def main():
    """CLI entry point."""
    try:
        parser = argparse.ArgumentParser(description="Scrape jobs from various job boards")
        parser.add_argument("query", nargs="?", help="Search query (e.g., 'software engineer', 'Product Designer')")
        parser.add_argument("--source", default="ashby", 
                          choices=["ashby", "greenhouse", "lever", "workday", "workday_wd5", 
                                  "smartrecruiters", "jobvite", "icims", "icims_careers", 
                                  "workable", "workable_jobs", "taleo"],
                          help="Job board source (default: ashby)")
        
        args = parser.parse_args()
        
        # Get source from environment variable or command line
        source = os.getenv("JOB_SOURCE") or args.source
        
        # Get search query from command line argument or environment variable
        search_query = args.query or os.getenv("ASHBY_SEARCH_QUERY")
        
        jobs = run_ashby_scrape(search_query, source)

        # Determine output path
        output_path = Path(OUTPUT_FILE)
        if not output_path.is_absolute():
            # If relative, try to write to project root, but fallback to /tmp if permission denied
            project_root = Path(__file__).parent.parent.parent
            output_path = project_root / OUTPUT_FILE
            
            # Try to create parent directory if it doesn't exist
            try:
                output_path.parent.mkdir(parents=True, exist_ok=True)
            except PermissionError:
                # If we can't write to project root, use /tmp
                output_path = Path("/tmp") / OUTPUT_FILE
                print(f"[output] Cannot write to project root, using {output_path}")

        # Ensure parent directory exists and is writable
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
        except Exception as e:
            # Fallback to /tmp on any error
            output_path = Path("/tmp") / OUTPUT_FILE
            print(f"[output] Error with output path, using {output_path}: {e}")

        print(f"[output] Writing {len(jobs)} jobs to {output_path}")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(jobs, f, ensure_ascii=False, indent=2)

        print(f"[output] Successfully saved {len(jobs)} jobs to {output_path}")
        return 0

    except Exception as e:
        print(f"[error] {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

