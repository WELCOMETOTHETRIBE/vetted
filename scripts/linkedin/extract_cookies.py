#!/usr/bin/env python3
"""
Extract LinkedIn cookies from browser and save to JSON file for manual use.
Run this if automatic cookie extraction isn't working.
"""

import sqlite3
import json
import os
import glob
from pathlib import Path

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

                cursor.execute("""
                    SELECT name, value, host_key, path, expires_utc, is_secure, is_httponly
                    FROM cookies
                    WHERE host_key LIKE ?
                    ORDER BY name
                """, (f"%.{domain}",))

                cookies = []
                for row in cursor.fetchall():
                    name, value, host_key, path, expires, secure, httponly = row

                    expires_unix = (expires / 1000000) - 11644473600 if expires > 0 else None

                    # Playwright expects expires as a number (Unix timestamp)
                    cookie_data = {
                        "name": name,
                        "value": value,
                        "domain": host_key,
                        "path": path,
                        "httpOnly": bool(httponly),
                        "secure": bool(secure)
                    }

                    # Only add expires if it's a valid number
                    if expires_unix and isinstance(expires_unix, (int, float)):
                        cookie_data["expires"] = expires_unix

                    cookies.append(cookie_data)

                conn.close()

                if cookies:
                    print(f"✅ Found {len(cookies)} LinkedIn cookies in Chrome")
                    return cookies

            except Exception as e:
                print(f"❌ Error reading Chrome cookies: {e}")
                continue

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

                cursor.execute("""
                    SELECT name, value, host, path, expiry, isSecure, isHttpOnly
                    FROM moz_cookies
                    WHERE host LIKE ?
                    ORDER BY name
                """, (f"%.{domain}",))

                cookies = []
                for row in cursor.fetchall():
                    name, value, host, path, expiry, secure, httponly = row

                    cookie_data = {
                        "name": name,
                        "value": value,
                        "domain": host,
                        "path": path,
                        "httpOnly": bool(httponly),
                        "secure": bool(secure)
                    }

                    # Only add expires if it's a valid number
                    if expiry and isinstance(expiry, (int, float)) and expiry > 0:
                        cookie_data["expires"] = expiry

                    cookies.append(cookie_data)

                conn.close()

                if cookies:
                    print(f"✅ Found {len(cookies)} LinkedIn cookies in Firefox")
                    return cookies

            except Exception as e:
                print(f"❌ Error reading Firefox cookies: {e}")
                continue

    return []

def main():
    print("🔍 Extracting LinkedIn cookies from browser...")
    print("   Make sure you're logged into LinkedIn in Chrome or Firefox!")
    print()

    # Try Chrome first, then Firefox
    cookies = extract_chrome_cookies()
    browser = "Chrome"

    if not cookies:
        cookies = extract_firefox_cookies()
        browser = "Firefox"

    if cookies:
        # Filter to essential LinkedIn cookies
        essential_cookies = ['li_at', 'JSESSIONID', 'liap', 'bcookie', 'bscookie', 'lang']
        filtered_cookies = [c for c in cookies if c['name'] in essential_cookies]

        print(f"✅ Successfully extracted {len(filtered_cookies)} essential LinkedIn cookies from {browser}")

        # Save to file
        output_file = "linkedin_cookies.json"
        with open(output_file, 'w') as f:
            json.dump(filtered_cookies, f, indent=2)

        print(f"💾 Saved cookies to {output_file}")
        print()
        print("🔧 To use these cookies with the scraper:")
        print("   python3 linkedin_profile_scraper.py 'AI Engineer' --scrape")
        print()
        print("📋 Cookie details:")
        for cookie in filtered_cookies:
            print(f"   {cookie['name']}: {cookie['value'][:20]}{'...' if len(cookie['value']) > 20 else ''}")

    else:
        print("❌ No LinkedIn cookies found.")
        print("   Make sure you're logged into LinkedIn in your browser.")
        print("   Try closing and reopening your browser, then run this script again.")

if __name__ == "__main__":
    main()
