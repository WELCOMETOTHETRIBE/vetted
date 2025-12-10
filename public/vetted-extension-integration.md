# Vetted Extension Integration Guide

This guide explains how to integrate the LinkedIn profile scraper extension with Vetted to automatically add candidates to the candidate pool.

## Overview

The extension scrapes LinkedIn profiles and sends the processed data to Vetted's API endpoint, which stores candidates in the database for admin review and search.

## API Endpoint

**POST** `/api/candidates/upload`

### Authentication
- Requires admin role
- Uses NextAuth session

### Request Format

The endpoint accepts processed profile JSON in the format from `profileProcessor.js`:

```json
{
  "Linkedin URL": "https://linkedin.com/in/example",
  "Full Name": "John Doe",
  "Current Company": "Tech Corp",
  "Job title": "Software Engineer",
  "Location": "San Francisco, CA",
  ...
}
```

Or an array of profiles:
```json
[
  { "Linkedin URL": "...", "Full Name": "..." },
  { "Linkedin URL": "...", "Full Name": "..." }
]
```

### Response

```json
{
  "success": true,
  "created": 1,
  "errors": 0,
  "candidates": [...],
  "errorDetails": []
}
```

## Extension Integration

### Option 1: Direct API Call from Extension

Update the extension's `background.js` or `viewer.js` to send data to Vetted:

```javascript
async function sendToVetted(processedProfiles) {
  const response = await fetch('https://your-vetted-domain.com/api/candidates/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Note: You'll need to handle authentication
      // Options:
      // 1. Use API key in header
      // 2. Use OAuth token
      // 3. Manual upload via admin panel
    },
    body: JSON.stringify(processedProfiles)
  });
  
  return await response.json();
}
```

### Option 2: Manual Upload via Admin Panel

1. Use the extension to export processed JSON
2. Copy the JSON
3. Use a browser console or Postman to POST to `/api/candidates/upload`
4. Or create an upload form in the admin panel

### Option 3: Google Sheets Integration

The extension already supports Google Sheets. You can:
1. Set up Google Sheets integration in the extension
2. Create a Google Apps Script that reads from Sheets
3. Have the script POST to Vetted's API endpoint

## Authentication Options

### Option A: API Key (Recommended for Extension)

1. Add an API key field to the User model
2. Generate API keys for admin users
3. Validate API key in the upload endpoint

### Option B: OAuth Token

1. Implement OAuth flow in extension
2. Store token securely
3. Send token in Authorization header

### Option C: Manual Upload (Current)

1. Admin logs into Vetted
2. Uses browser console or admin panel to upload
3. Session-based authentication

## Example: Browser Console Upload

```javascript
// In browser console on Vetted (while logged in as admin)
const profileData = {
  "Linkedin URL": "https://linkedin.com/in/example",
  "Full Name": "John Doe",
  "Current Company": "Tech Corp",
  "Job title": "Software Engineer",
  "Location": "San Francisco, CA"
};

fetch('/api/candidates/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profileData)
})
.then(r => r.json())
.then(console.log);
```

## Next Steps

1. **Add API Key Support**: Create API key generation for admin users
2. **Create Upload UI**: Add a file upload form in the admin panel
3. **Extension Update**: Modify extension to send directly to Vetted API
4. **Bulk Import**: Add CSV import functionality

