# Google Sheets Integration Setup Guide

This guide will help you set up the Google Sheets integration so that profile data is automatically sent to a Google Sheet when you click "Save Profile JSON" or "Send to Vetted".

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet (or use an existing one)
3. Name it something like "Vetted Profiles" or "Profile Logger"
4. **Keep this tab open** - you'll need it for the next step

## Step 2: Create Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. A new tab will open with the Apps Script editor
3. Delete any default code in the editor
4. Copy the entire contents of `googleSheetsIntegration.gs` from this extension folder
5. Paste it into the Apps Script editor
6. **Important**: Update the `SHEET_NAME` constant if your sheet tab is not named "Sheet1":
   ```javascript
   const SHEET_NAME = 'Sheet1'; // Change to your actual sheet name
   ```

## Step 3: Deploy as Web App

1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Profile Logger Integration" (or any description)
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone** (or "Anyone with Google account" for more security)
5. Click **Deploy**
6. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
7. Click **Done**

## Step 4: Authorize the Script (First Time Only)

**IMPORTANT:** Before deploying, you need to authorize the script to access your Google Sheet.

1. In the Apps Script editor, click **Run** → **setupSheet** (or select `setupSheet` from the function dropdown and click Run)
2. You'll be prompted to authorize the script
3. Click **Review Permissions**
4. Choose your Google account (the one that owns the sheet)
5. You may see a warning: **"Google hasn't verified this app"**
   - This is normal for custom Apps Script projects
   - Click **Advanced**
   - Click **Go to [Your Project Name] (unsafe)**
6. Click **Allow** to grant permissions
7. The script is now authorized

**Alternative:** If you get "access blocked" error:
- Make sure you're logged into the correct Google account in your browser
- Try running `testConnection()` function first to trigger authorization
- Clear your browser cache and try again
- Make sure you're not using a work/school account with restricted permissions

## Step 5: Configure the Extension

1. Open the extension popup (click the extension icon)
2. Scroll down to the **Settings** section
3. Paste your **Web App URL** into the "Google Sheets Web App URL" field
4. (Optional) Check **"Auto-send to Google Sheets when saving profiles"** if you want profiles to be sent automatically when you click "Save Profile JSON"
5. Click **Save Settings**
6. You should see "Settings saved!" in green

## Step 6: Test the Integration

### Option A: Manual Send (Recommended for first test)
1. Save a profile using the "Save Profile JSON" button on a LinkedIn profile page
2. Open the extension popup
3. Click **"Send to Vetted"**
4. Check your Google Sheet - you should see a new row with the profile data

### Option B: Auto-Send
1. Make sure "Auto-send to Google Sheets when saving profiles" is checked in settings
2. Click "Save Profile JSON" on any profile page
3. The profile should automatically be sent to your Google Sheet
4. Check your Google Sheet to confirm

## Troubleshooting

### "Invalid Google Apps Script URL"
- Make sure you copied the full URL including `/exec` at the end
- The URL should start with `https://script.google.com/macros/s/`

### "Access Blocked" or OAuth Error
- **Before deploying:** Run the `setupSheet()` function first to authorize permissions
- Make sure you're logged into the correct Google account
- Click **Advanced** → **Go to [Project Name] (unsafe)** when prompted
- Grant all requested permissions
- If still blocked, try:
  1. Run `testConnection()` function in Apps Script
  2. Check that you're using a personal Google account (not a restricted work/school account)
  3. Clear browser cache and cookies for script.google.com
  4. Try authorizing in an incognito/private window

### "Error sending to Google Sheets"
- Check that your Apps Script is deployed and the URL is correct
- Make sure "Who has access" is set to "Anyone" (or you're logged into the same Google account)
- Verify the script is authorized (run `testConnection()` function)
- Try redeploying the script and updating the URL in settings

### No data appears in the sheet
- Check that the `SHEET_NAME` in the Apps Script matches your actual sheet tab name
- Make sure the script is authorized (Step 4)
- Check the Apps Script execution log: **View** → **Execution log** in Apps Script editor

### Auto-send not working
- Make sure "Auto-send to Google Sheets when saving profiles" is checked in settings
- Check that the Google Sheets URL is saved correctly
- Try manually sending first to verify the URL works

## Sheet Columns

The Google Sheet will automatically create these columns:
- Linkedin URL
- Full Name
- Current company
- Job title
- Years in current company
- Location
- Previous target company
- Tenure at previous target (Year start to year end)
- Previous title(s)
- Total Years full time experience
- **Employment History (Company - Title (Years))** - Complete employment history with years at each company (e.g., "HUMAN CAPITAL - Director, Talent (2025-Present); Atomic Invest - Head of Talent Acquisition & People Operations (2022-2025)")
- University
- Fields of Study
- Degrees
- Year of Undergrad Graduation
- Submitted At (timestamp)

## Security Notes

- The Web App URL is stored locally in your browser (chrome.storage.local)
- The script runs with your Google account permissions
- For better security, you can set "Who has access" to "Anyone with Google account" instead of "Anyone"
- The extension uses `no-cors` mode, so it cannot read responses from the server (this is normal)

## Updating the Script

If you need to update the Apps Script code:
1. Make your changes in the Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon (✏️) next to your deployment
4. Click **New version**
5. Click **Deploy**
6. The URL stays the same - no need to update the extension settings

