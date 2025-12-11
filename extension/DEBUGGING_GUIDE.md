# Extension Debugging Guide

## Overview
Comprehensive debugging has been added to track the "Send to Vetted" workflow. All debug logs are prefixed with `[DEBUG]` or `[DEBUG-BG]` for easy filtering.

## How to Debug

### 1. Open Browser Console
- **For the extension popup (viewer)**: 
  - Right-click the extension icon → "Inspect popup"
  - Or: Open the extension popup, then press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
  
- **For the background script**:
  - Go to `chrome://extensions/`
  - Find "Profile JSON Logger" extension
  - Click "service worker" or "background page" link
  - This opens the background script console

### 2. Filter Debug Logs
In the console, use the filter box and type:
- `[DEBUG]` - View all debug logs
- `[DEBUG-BG]` - View only background script logs
- `ERROR` - View only errors

### 3. Debug Flow Steps

When you click "Send to Vetted", you'll see logs for each step:

#### In Viewer Console:
1. **Step 1**: Reloading profiles from storage
2. **Step 2**: Checking ProfileProcessor availability
3. **Step 3**: Loading Vetted API URL
4. **Step 4**: Loading API key from storage
5. **Step 5**: Processing profiles (this can take time for many profiles)
6. **Step 6**: Merging edited fields and tags
7. **Step 7**: Sending message to background script

#### In Background Script Console:
1. **Message received**: Shows when the message arrives
2. **sendProcessedProfilesToVetted START**: Beginning of the send process
3. **Fetch request**: Network request details
4. **Response handling**: Response status and data
5. **SUCCESS/ERROR**: Final result

## Common Issues and What to Look For

### Issue: "Request timed out"
**Look for:**
- `[DEBUG] Step 7 TIMEOUT` in viewer console
- Check if `[DEBUG-BG] Message received` appears in background console
- If message is received but fetch hangs, check network tab

**Possible causes:**
- Background script not responding
- Network request hanging (CORS, server down, etc.)
- API endpoint not accessible

### Issue: "No response from background script"
**Look for:**
- `[DEBUG] Step 7 ERROR: No response received`
- Check background console for errors
- Verify extension context is valid

**Possible causes:**
- Background script crashed
- Extension was reloaded
- Message handler not working

### Issue: "Network error"
**Look for:**
- `[DEBUG-BG] FETCH ERROR` in background console
- Check the error details (CORS, timeout, etc.)
- Verify API URL is correct

**Possible causes:**
- CORS policy blocking request
- API endpoint down
- Network connectivity issues
- Invalid API URL

### Issue: "HTTP 401/403"
**Look for:**
- `[DEBUG-BG] Response not OK: 401` or `403`
- Check if API key is being sent
- Verify authentication

**Possible causes:**
- Not logged in to Vetted
- Not an admin user
- Invalid or missing API key

## Debug Information Captured

### Timing Information
- Total time for each operation
- Time between steps
- Network request duration

### Data Information
- Profile count
- Payload size
- Response size
- First profile sample (keys only)

### Error Information
- Error messages
- Error stacks
- Error types
- HTTP status codes
- Response bodies

## Next Steps When Debugging

1. **Check both consoles** - Viewer and background script
2. **Look for ERROR logs** - These indicate where it failed
3. **Check timing** - See which step takes too long
4. **Verify network** - Check Network tab in DevTools
5. **Test API directly** - Try the API endpoint in Postman/curl

## Example Debug Output

### Successful Send:
```
[DEBUG] ========== Send to Vetted clicked ==========
[DEBUG] Step 1: Reloading profiles from storage...
[DEBUG] Step 1 complete: Reloaded 5 profiles from storage
[DEBUG] Step 2: Checking ProfileProcessor...
[DEBUG] Step 2 complete: ProfileProcessor available
[DEBUG] Step 5: Processing 5 profiles...
[DEBUG] Step 5 complete: Processed 5 profiles in 234 ms
[DEBUG] Step 7: Sending message to background script...
[DEBUG-BG] ========== Message received ==========
[DEBUG-BG] Message type: SEND_PROCESSED_TO_VETTED
[DEBUG-BG] ========== sendProcessedProfilesToVetted START ==========
[DEBUG-BG] Starting fetch request...
[DEBUG-BG] Fetch completed in 1234 ms
[DEBUG-BG] Response OK, parsing JSON...
[DEBUG-BG] ========== sendProcessedProfilesToVetted SUCCESS ==========
[DEBUG] ========== SUCCESS ==========
```

### Failed Send:
```
[DEBUG] Step 7: Sending message to background script...
[DEBUG-BG] ========== Message received ==========
[DEBUG-BG] ========== sendProcessedProfilesToVetted START ==========
[DEBUG-BG] Starting fetch request...
[DEBUG-BG] FETCH ERROR after 5000 ms: NetworkError
[DEBUG-BG] ========== sendProcessedProfilesToVetted ERROR ==========
[DEBUG] Step 7 ERROR: Send failed
```

## Tips

1. **Keep both consoles open** - Viewer and background
2. **Clear console before testing** - Easier to see new logs
3. **Check Network tab** - See actual HTTP requests
4. **Test with 1 profile first** - Easier to debug
5. **Check extension status** - Make sure it's enabled and not reloaded

