# Vetted Extension Setup Guide

This guide explains how to configure the extension to send LinkedIn profiles directly to your Vetted platform.

## Quick Setup

1. **Open the Extension Popup**
   - Click the extension icon in your browser toolbar
   - This opens the Profile Manager

2. **Configure Vetted API**
   - In the "Vetted API Settings" section:
     - **Vetted API URL**: Enter your Vetted API endpoint
       - Example: `https://your-vetted-domain.com/api/candidates/upload`
       - Or for local development: `http://localhost:3000/api/candidates/upload`
     - **API Key** (optional): Leave empty for session-based auth, or enter an API key if you've set one up
     - **Auto-send to Vetted**: Check this to automatically send profiles when you click "Save Profile JSON"

3. **Save Settings**
   - Click "Save Settings" button
   - You should see "Vetted API configured" in green

## Authentication Methods

### Option 1: Session-Based (Recommended for Testing)

1. Log into Vetted in the same browser
2. Leave API Key field empty
3. The extension will use your browser's session cookies
4. Make sure you're logged in as an **admin** user

### Option 2: API Key (Recommended for Production)

1. Generate an API key in Vetted (when API key feature is implemented)
2. Enter the API key in the extension settings
3. The extension will send the key in the Authorization header

## Usage

### Manual Send

1. Navigate to a LinkedIn profile
2. Click "Save Profile JSON" button (floating button on the page)
3. Open the extension popup
4. Click "Send to Vetted" button
5. Profiles will be sent to your Vetted API

### Auto-Send

1. Enable "Auto-send to Vetted when saving profiles" in settings
2. When you click "Save Profile JSON" on a LinkedIn profile, it will automatically:
   - Save the profile locally
   - Process it
   - Send it to Vetted API

## API Endpoint

The extension sends POST requests to:
```
POST /api/candidates/upload
```

**Request Body:**
```json
[
  {
    "Linkedin URL": "https://linkedin.com/in/example",
    "Full Name": "John Doe",
    "Current Company": "Tech Corp",
    "Job title": "Software Engineer",
    ...
  }
]
```

**Response:**
```json
{
  "success": true,
  "created": 1,
  "errors": 0,
  "candidates": [...]
}
```

## Troubleshooting

### "Vetted API URL not configured"
- Make sure you've entered the API URL in settings
- Click "Save Settings" after entering the URL

### "HTTP 401: Unauthorized"
- Make sure you're logged into Vetted as an admin
- Or provide a valid API key

### "HTTP 403: Forbidden"
- Your user account doesn't have admin role
- Only admin users can add candidates

### "HTTP 500: Internal Server Error"
- Check Vetted server logs
- Make sure the database is set up correctly
- Verify Prisma migrations have been run

### Profiles not appearing in Vetted
- Check the Candidates page: `/candidates`
- Make sure you're logged in as admin
- Check browser console for error messages

## Testing

1. **Test with a single profile:**
   - Go to a LinkedIn profile
   - Click "Save Profile JSON"
   - Open extension popup
   - Click "Send to Vetted"
   - Check Vetted's Candidates page

2. **Test auto-send:**
   - Enable auto-send in settings
   - Save a new profile
   - It should automatically send to Vetted

3. **Test bulk send:**
   - Save multiple profiles
   - Click "Send to Vetted" once
   - All profiles will be sent in one request

## Notes

- The extension processes profiles using `profileProcessor.js` before sending
- Duplicate profiles (same LinkedIn URL) will be updated, not duplicated
- The extension falls back to Google Sheets if Vetted API is not configured
- All profile data is sent in the format expected by Vetted's Candidate model

## Next Steps

After setting up:
1. Test with a few LinkedIn profiles
2. Check the Candidates page in Vetted
3. Verify profiles are searchable
4. Update candidate statuses as needed


