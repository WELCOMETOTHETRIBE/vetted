#!/bin/bash

# Test LinkedIn Profile Scraping and Import Pipeline
# This script tests the entire SERPAPI → HTML scraping → parsing → AI enrichment → database pipeline

set -e

echo "🔍 Testing LinkedIn Profile Pipeline"
echo "===================================="

# Check prerequisites
if [ -z "$SERPAPI_KEY" ]; then
    echo "❌ SERPAPI_KEY environment variable not set"
    echo "Please set your SERPAPI key: export SERPAPI_KEY=your_key_here"
    exit 1
fi

# Configuration
QUERY="AI Engineer"
LOCATION="San Francisco"
COMPANY="OpenAI"
OUTPUT_FILE="linkedin_profiles.json"

echo "📋 Test Configuration:"
echo "  Query: $QUERY"
echo "  Location: $LOCATION"
echo "  Company: $COMPANY"
echo "  Output: $OUTPUT_FILE"
echo ""

# Step 1: Scrape LinkedIn profiles
echo "🔎 Step 1: Scraping LinkedIn profiles with SERPAPI + Playwright"
echo "-------------------------------------------------------------"

cd scripts/linkedin
source ../../venv/bin/activate

echo "🔐 Using browser cookies for LinkedIn authentication..."
echo "   Make sure you're logged into LinkedIn in Chrome or Firefox!"
echo ""

python3 linkedin_profile_scraper.py "$QUERY" --location "$LOCATION" --company "$COMPANY" --scrape

# Check if we got any profiles
if [ ! -f "$OUTPUT_FILE" ]; then
    echo "❌ No output file generated"
    exit 1
fi

PROFILE_COUNT=$(jq '. | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")
echo "✅ Found $PROFILE_COUNT profiles"

if [ "$PROFILE_COUNT" -eq 0 ]; then
    echo "⚠️  No profiles found. This might be expected if the search criteria are too specific."
    echo "   Try broader search terms or check your SERPAPI key."
    exit 0
fi

# Check HTML quality
HTML_COUNT=$(jq '[.[] | select(.html and .raw_text)] | length' "$OUTPUT_FILE")
echo "✅ $HTML_COUNT profiles have HTML content for parsing"

cd ../..

# Step 2: Import profiles to database
echo ""
echo "📥 Step 2: Importing profiles to database with parsing + AI enrichment"
echo "-------------------------------------------------------------------"

# Start Next.js server in background if not running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "🚀 Starting Next.js server..."
    npm run dev &
    SERVER_PID=$!
    sleep 10
else
    echo "✅ Next.js server already running"
fi

# Import profiles
echo "📤 Sending profiles to import endpoint..."
IMPORT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/linkedin-profiles/import" \
    -H "Content-Type: application/json")

echo "📊 Import Results:"
echo "$IMPORT_RESPONSE" | jq '.message' 2>/dev/null || echo "$IMPORT_RESPONSE"

# Extract quality metrics
SUCCESS_RATE=$(echo "$IMPORT_RESPONSE" | jq '.summary.successRate' 2>/dev/null || echo "N/A")
PARSING_RATE=$(echo "$IMPORT_RESPONSE" | jq '.summary.parsingSuccessRate' 2>/dev/null || echo "N/A")
AI_RATE=$(echo "$IMPORT_RESPONSE" | jq '.summary.aiEnrichmentRate' 2>/dev/null || echo "N/A")

echo ""
echo "📈 Quality Metrics:"
echo "  Success Rate: $SUCCESS_RATE%"
echo "  Parsing Success: $PARSING_RATE%"
echo "  AI Enrichment: $AI_RATE%"

echo ""
echo "🏷️  Field Fill Rates:"
echo "$IMPORT_RESPONSE" | jq -r '.summary.fieldFillRates | to_entries[] | "  \(.key): \(.value)%"' 2>/dev/null || echo "  Could not parse field rates"

# Step 3: Manual verification
echo ""
echo "🔍 Step 3: Manual verification"
echo "------------------------------"
echo "Check the database for imported candidates:"
echo "1. Visit http://localhost:3000/candidates"
echo "2. Look for candidates with LinkedIn URLs"
echo "3. Verify that fields are populated:"
echo "   - Full Name, Job Title, Current Company"
echo "   - Companies array, Universities array"
echo "   - Skills/Experience/Education counts > 0"
echo "   - AI Summary generated"

echo ""
echo "📋 Feedback Loop Checklist:"
echo "☐ Candidates have complete profiles (name, title, company, location)"
echo "☐ Companies and Universities arrays are populated"
echo "☐ Skills/Experience/Education counts are reasonable (>0)"
echo "☐ AI summaries are generated and meaningful"
echo "☐ No data appears in wrong fields (e.g., company name in job title)"
echo "☐ Parsing success rate > 80%"
echo "☐ AI enrichment applied where needed"

echo ""
echo "🎯 If any issues found, check server logs for:"
echo "- [LINKEDIN IMPORT] Processing messages"
echo "- [AI ENRICHMENT] Success/failure messages"
echo "- [QUALITY] Candidate assessment messages"

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "🧹 Server started by this script (PID: $SERVER_PID) - leaving running for manual testing"
fi

echo ""
echo "✅ Pipeline test complete!"
