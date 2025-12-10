# Deployment Notes

## 🔄 When to Redeploy Chrome Extension

**You need to reload the Chrome extension when:**
- ✅ Any file in the extension is modified
- ✅ `manifest.json` is changed
- ✅ `background.js` is changed
- ✅ `contentScript.js` is changed
- ✅ `profileProcessor.js` is changed
- ✅ `viewer.js` or `viewer.html` is changed

**How to reload:**
1. Go to `chrome://extensions/`
2. Find "Profile JSON Logger" extension
3. Click the refresh/reload icon (🔄)
4. Or toggle it off and back on

---

## 📊 When to Update Google Sheets Script

**You need to update the Google Sheets script when:**
- ✅ CSV column structure changes
- ✅ New fields are added to the output
- ✅ Field names change

**Current Status:** ✅ **UP TO DATE** (as of latest changes)

**How to update:**
1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. Replace the entire script with the latest `googleSheetsIntegration.gs`
4. Click Save (💾)
5. Run `setupSheet()` function once to update headers
6. No need to redeploy the web app unless the `doPost` function signature changes

---

## 📝 Recent Changes Log

### Latest Update (Current)
- ✅ Added comprehensive data extraction (current_employer, past_employers, employment_summary)
- ✅ Added 15+ new CSV columns (Certifications, Languages, Projects, Publications, etc.)
- ✅ Improved error handling for multiple profile saves
- ✅ Added duplicate detection
- ✅ Added storage quota monitoring
- ✅ Google Sheets script updated with all new columns

**Action Required:**
- 🔄 **RELOAD CHROME EXTENSION** - Background and content scripts changed
- ✅ **Google Sheets script already updated** - Just run `setupSheet()` if headers don't match

---

## 🔍 How to Verify Everything Works

### 1. Verify Chrome Extension
```javascript
// Open browser console on any page and run:
chrome.storage.local.get(["profileDocuments"], (data) => {
  console.log("Profiles stored:", data.profileDocuments?.length || 0);
});
```

### 2. Verify Google Sheets Script
- Open Google Apps Script
- Run `testConnection()` function
- Should show: "Connection successful! Sheet found. X columns configured."

### 3. Test End-to-End
1. Save a profile using the extension button
2. Open extension popup - should see profile in list
3. Click "Send to Vetted" - should send to Google Sheets
4. Check Google Sheet - should have new row with all columns

---

## 📋 Current CSV Column Count

**Total Columns: 70+**

Includes:
- Basic info (LinkedIn URL, Name, Location, Job Title)
- Current Company (7 fields: company, start date, end date, tenure years/months)
- Previous Target Company (6 fields)
- Companies (10 fields: Company 1-10)
- Education (Universities 1-10, Fields of Study 1-10)
- Comprehensive fields (Certifications, Languages, Projects, Publications, etc.)
- Metadata (Core Roles, Domains, Submitted At, Raw Data)

---

## ⚠️ Troubleshooting

### Extension not saving profiles?
- Check browser console for errors
- Verify extension is enabled
- Check storage quota (should show in console)

### Google Sheets not receiving data?
- Verify web app URL is correct in extension settings
- Check Google Apps Script execution log
- Verify `doPost` function is deployed as web app
- Check that headers match (run `setupSheet()`)

### CSV missing columns?
- Run `setupSheet()` in Google Apps Script
- Verify HEADERS array matches CSV columns
- Check that profileProcessor.js is generating all fields

---

## 📅 Update History

### 2024-12-09
- Added comprehensive HTML extraction
- Added current_employer and past_employers data structures
- Added 15+ new CSV columns
- Improved error handling
- Added storage monitoring

### Previous
- Initial implementation
- Basic profile extraction
- Google Sheets integration


