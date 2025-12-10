# Debugging Candidates Not Appearing

## Steps to Debug:

1. **Check Railway Logs:**
   - Go to Railway dashboard → vetted service → Logs
   - Look for these log messages after sending a profile:
     - `"POST /api/candidates/upload - Request received"`
     - `"Processing candidate data:"` (shows data keys)
     - `"Creating new candidate:"` (shows LinkedIn URL and name)
     - `"Created candidate:"` (shows ID, name, and timestamp)
     - `"Upload complete:"` (shows how many were created)

2. **Check Browser Console:**
   - Open DevTools (F12) → Console tab
   - Look for the API response when sending profiles
   - Should show: `{ success: true, created: 1, ... }`

3. **Verify Database:**
   - Visit: `https://YOUR-RAILWAY-DOMAIN/api/candidates`
   - (Must be logged in as admin)
   - Should return JSON with all candidates

4. **Check Candidates Page:**
   - Visit: `https://YOUR-RAILWAY-DOMAIN/candidates`
   - Should show all candidates in a table
   - Check the "Total: X candidates" count at the top

## Common Issues:

- **Candidates created but not showing:** Page might need refresh
- **No logs showing:** API might not be receiving requests
- **Errors in logs:** Check the error message for data format issues
