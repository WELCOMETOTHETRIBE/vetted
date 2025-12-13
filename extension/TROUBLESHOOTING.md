# Extension Troubleshooting Guide

## Error: `chrome-extension://invalid/`

This error typically means the extension needs to be reloaded or there's an issue with the extension installation.

### Solution 1: Reload the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Find "Profile JSON Logger" extension
3. Click the **reload icon** (circular arrow) on the extension card
4. Try clicking "Save Profile JSON" again

### Solution 2: Remove and Re-add Extension

1. Go to `chrome://extensions/`
2. Toggle "Developer mode" ON (top right)
3. Click "Remove" on the extension
4. Click "Load unpacked"
5. Select the `/extension` folder
6. Try again

### Solution 3: Check Console for Errors

1. Right-click the "Save Profile JSON" button
2. Select "Inspect"
3. Check the Console tab for specific error messages
4. Share the error message for further debugging

## Extension Not Loading

### Check Manifest

Make sure `manifest.json` is valid JSON:
- No trailing commas
- All strings properly quoted
- Valid structure

### Check File Structure

Ensure all files are in the extension folder:
- `manifest.json`
- `background.js`
- `contentScript.js`
- `viewer.html`
- `viewer.js`
- `profileProcessor.js`

## Button Not Appearing

1. Refresh the LinkedIn page
2. Check browser console for errors
3. Make sure you're on a page (not chrome:// pages)
4. Try a different website to test

## Profile Not Saving

1. Check browser console for errors
2. Open extension popup and check if profiles appear
3. Check Chrome storage: `chrome://extensions/` → Extension details → "Inspect views: service worker" → Application tab → Storage

## API Connection Issues

### Vetted API Not Working

1. Check the API URL is correct in settings
2. Make sure you're logged into Vetted as admin
3. Check browser console for CORS errors
4. Verify the API endpoint is accessible:
   - Open browser DevTools → Network tab
   - Click "Send to Vetted"
   - Check if request appears and what the response is

### Google Sheets Not Working

1. Verify Google Sheets URL is correct
2. Check Google Apps Script is deployed
3. Check script execution logs in Google Apps Script editor

## Common Issues

### "Profile processor not available"

- Make sure `profileProcessor.js` is in the extension folder
- Reload the extension
- Check that the file isn't corrupted

### "Storage quota exceeded"

- Open extension popup
- Click "Clear All" to remove old profiles
- Or delete individual profiles from the table

### "Unauthorized" or "Forbidden" from API

- Make sure you're logged into Vetted
- Verify your user has admin role
- Check API key if using one
- Try logging out and back in

## Still Having Issues?

1. Check the browser console (F12)
2. Check the service worker console:
   - Go to `chrome://extensions/`
   - Find the extension
   - Click "Inspect views: service worker"
   - Check for errors
3. Share the error messages for help


