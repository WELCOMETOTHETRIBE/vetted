# LinkedIn Profile Import Monitoring & Feedback Loops

## Overview
Enhanced the SERPAPI LinkedIn profile import process with comprehensive monitoring, quality metrics, and feedback loops to ensure data enrichment matches the Chrome extension quality.

## What Was Fixed

### 1. Unified Parsing Pipeline ✅
- **Fixed**: Changed import route to use `extension/profileProcessor.js` (was incorrectly looking for `lib/profile-processor.js`)
- **Result**: SERPAPI-scraped profiles now use the exact same parsing logic as the Chrome extension

### 2. Comprehensive Monitoring ✅
Added detailed logging at every stage:
- **Step 1**: HTML Extraction (via `profile-processor-server.ts`)
- **Step 2**: Profile Processing (via `extension/profileProcessor.js`)
- **Step 3**: Data Quality Assessment
- **Step 4**: AI Enrichment (with retry logic)

### 3. Quality Metrics Tracking ✅
Tracks fill rates for all critical fields:
- Full Name
- Job Title
- Current Company
- Location
- Companies (array)
- Universities (array)
- Fields of Study (array)
- Total Years Experience
- Skills/Experience/Education Counts

### 4. AI Enrichment Retry Logic ✅
- Automatic retry with trimmed text if first attempt fails
- Up to 2 retry attempts
- Detailed logging of corrections applied

### 5. Batch Summary Reports ✅
After each import batch, you get:
- Total profiles processed
- HTML extraction success/failure rates
- ProfileProcessor success/failure rates
- Field fill rate percentages
- Complete vs. needs-enrichment breakdown

## How to Use

### Step 1: Search for Profiles
```bash
# Via API (requires Next.js server running)
curl -X GET "http://localhost:3000/api/linkedin-profiles?query=AI%20Engineer&location=San%20Francisco&company=OpenAI&scrape=true&force=true" \
  -H "Cookie: your-session-cookie"

# Or use the test script
node scripts/test-linkedin-import.js "AI Engineer" --location="San Francisco" --company="OpenAI"
```

### Step 2: Import Profiles
```bash
# Via API
curl -X POST "http://localhost:3000/api/linkedin-profiles/import" \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

### Step 3: Monitor Logs
Watch your server logs for:
```
========== [LINKEDIN IMPORT] Processing <url> ==========
[STEP 1] HTML Extraction Results:
  - Name: ...
  - Headline: ...
  - Experience items: ...
[STEP 2] ProfileProcessor Results:
  - Full Name: ...
  - Companies: ...
[STEP 3] Using processed data - SUCCESS (complete data)
========== [LINKEDIN IMPORT] Complete ==========

========== [LINKEDIN IMPORT] BATCH SUMMARY ==========
Total Profiles: X
Field Fill Rates:
  - fullName: X% (Y/Z)
  - companies: X% (Y/Z)
  ...
========== [LINKEDIN IMPORT] BATCH SUMMARY END ==========
```

## Feedback Loop Process

### Iteration 1: Initial Run
1. Run search with `scrape=true`
2. Import profiles
3. Review batch summary metrics
4. Identify fields with low fill rates

### Iteration 2: Improve Extraction
1. Review logs for HTML extraction failures
2. Check if selectors need updating in `profile-processor-server.ts`
3. Verify ProfileProcessor is handling edge cases

### Iteration 3: Improve AI Enrichment
1. Review AI enrichment logs
2. Check if prompts need refinement in `data-enrichment.ts`
3. Verify retry logic is working

### Iteration 4: Validate Data Quality
1. Spot-check imported candidates in database
2. Compare with extension-scraped profiles
3. Verify field mappings are correct

## Quality Metrics Explained

### Field Fill Rate
Percentage of profiles that have a value for each field after processing.

**Target**: >80% for critical fields (name, jobTitle, companies, universities)

### Complete Data Rate
Percentage of profiles that don't need AI enrichment.

**Target**: >60% (means parsing pipeline is working well)

### HTML Extraction Success Rate
Percentage of profiles where HTML was successfully parsed into structured data.

**Target**: >90%

## Troubleshooting

### Low Fill Rates
- Check HTML extraction logs - are selectors finding the right elements?
- Review ProfileProcessor logs - is it handling the data structure correctly?
- Verify AI enrichment is being triggered and succeeding

### High Error Rate
- Check if profiles have HTML (should be >0 with `scrape=true`)
- Verify `extension/profileProcessor.js` is loading correctly
- Check for JavaScript errors in server logs

### AI Enrichment Not Working
- Verify OpenAI API key is set
- Check if raw data is being passed correctly
- Review retry logic - is it using trimmed text on retry?

## Next Steps for Perfect Data

1. **Run test search**: Use the test script with "AI Engineer, San Francisco, OpenAI"
2. **Monitor first batch**: Review all logs and metrics
3. **Identify gaps**: Which fields are missing? Why?
4. **Iterate**: Fix extraction/processing issues
5. **Re-run**: Test again with same query to compare improvements
6. **Validate**: Spot-check database records match source HTML

## Files Modified

- `app/api/linkedin-profiles/import/route.ts` - Added monitoring, metrics, quality tracking
- `app/api/candidates/upload/route.ts` - Added retry logic for AI enrichment
- `scripts/test-linkedin-import.js` - New test script for easy testing

## Key Improvements

1. ✅ Same parsing pipeline as extension
2. ✅ Comprehensive monitoring at every step
3. ✅ Quality metrics for feedback loops
4. ✅ Retry logic for failed enrichments
5. ✅ Batch summary reports
6. ✅ Detailed field-level tracking

