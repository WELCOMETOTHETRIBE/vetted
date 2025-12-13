# Fixing `chrome-extension://invalid/` Error

## Understanding the Error

The error `chrome-extension://invalid/:1 Failed to load resource: net::ERR_FAILED` means Chrome is trying to load a resource from an invalid extension URL. This typically happens when:

1. **Extension was reloaded** - The extension context was invalidated
2. **Resource file missing** - A file referenced in the extension can't be found
3. **Extension ID changed** - The extension was removed and re-added

## Quick Fix Steps

### Step 1: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "Profile JSON Logger"
3. Click the **reload icon** (🔄 circular arrow)
4. **Refresh any open LinkedIn pages** (important!)

### Step 2: Check for Missing Files
Make sure these files exist in the `/extension` folder:
- ✅ `manifest.json`
- ✅ `background.js`
- ✅ `contentScript.js`
- ✅ `profileProcessor.js` ← **Most likely culprit**
- ✅ `viewer.html`
- ✅ `viewer.js`

### Step 3: Verify Extension is Loaded Correctly
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Check if the extension shows any errors (red text)
4. Click "Errors" if any are shown

### Step 4: Check Console Logs

**For Background Script:**
1. Go to `chrome://extensions/`
2. Find "Profile JSON Logger"
3. Click "service worker" or "background page"
4. Check console for errors

**For Content Script:**
1. Open a LinkedIn page
2. Press `F12` to open DevTools
3. Check Console tab for errors

**For Viewer (Extension Popup):**
1. Right-click extension icon → "Inspect popup"
2. Check Console tab for errors

## What I've Added

I've added error handling that will:
1. **Catch importScripts errors** - If `profileProcessor.js` fails to load, it will log the error instead of crashing
2. **Validate extension context** - Check if extension is valid before using chrome APIs
3. **Better error messages** - More detailed logging to help identify the issue

## Debugging the Error

After reloading the extension, check the console logs:

### Expected Logs (Success):
```
[DEBUG-BG] profileProcessor.js loaded successfully
[DEBUG-BG] Extension installed/reloaded
[DEBUG-BG] Extension context valid: true
[DEBUG-BG] ProfileProcessor available: true
```

### Error Logs (Failure):
```
[DEBUG-BG] ERROR loading profileProcessor.js: [error details]
[DEBUG-BG] WARNING: Extension context invalid during install
```

## Common Causes and Solutions

### Cause 1: Extension Reloaded While Page Open
**Symptom:** Error appears after reloading extension
**Solution:** Refresh the LinkedIn page after reloading extension

### Cause 2: profileProcessor.js Not Found
**Symptom:** `[DEBUG-BG] ERROR loading profileProcessor.js`
**Solution:** 
- Verify `profileProcessor.js` exists in `/extension` folder
- Check file permissions
- Reload extension

### Cause 3: Extension Context Invalidated
**Symptom:** `Extension context invalidated` errors
**Solution:**
- Reload extension
- Refresh all pages using the extension
- Restart Chrome if issue persists

### Cause 4: File Path Issues
**Symptom:** Resource loading errors
**Solution:**
- Make sure all files are in the same `/extension` directory
- Check `manifest.json` references files correctly
- No subdirectories for extension files

## Testing After Fix

1. **Reload extension** at `chrome://extensions/`
2. **Refresh LinkedIn page**
3. **Open extension popup** - Should see "Profile Manager"
4. **Check console** - Should see success logs, no errors
5. **Try "Send to Vetted"** - Should work with debug logs

## Still Having Issues?

If the error persists after following these steps:

1. **Check all console logs** (background, content, viewer)
2. **Look for specific error messages** (not just "invalid")
3. **Verify file structure** matches exactly what's in the repo
4. **Try removing and re-adding** the extension completely

The new debug logs will help identify exactly where the failure is occurring.


