# Profile JSON Logger Extension

A Chrome Extension that extracts rich profile data from web pages (especially LinkedIn profiles) and converts it to structured JSON and CSV formats for database insertion.

## Features

- **Floating Button**: Injects a "Save Profile JSON" button on every page
- **Rich Data Extraction**: Extracts personal info, experience, education, skills, recommendations, and more
- **Local Storage**: Stores all profiles in `chrome.storage.local`
- **Multiple Export Formats**:
  - Raw JSON (original extracted data)
  - Processed JSON (structured for database insertion)
  - CSV format (ready for spreadsheet/database import)
- **Google Sheets Integration**: 
  - Automatically send profiles to Google Sheets when saving (optional)
  - Manual "Send to Vetted" button to send all profiles
  - See `GOOGLE_SHEETS_SETUP.md` for setup instructions

## Files

- `manifest.json` - Extension manifest (Manifest V3)
- `background.js` - Background service worker for storage management and auto-send to Google Sheets
- `contentScript.js` - Content script that injects button and extracts profile data
- `viewer.html` - Popup UI for viewing and exporting profiles
- `viewer.js` - Popup logic and UI interactions
- `profileProcessor.js` - JavaScript module that processes raw profile JSON into structured data
- `googleSheetsIntegration.gs` - Google Apps Script code for receiving and writing to Google Sheets
- `GOOGLE_SHEETS_SETUP.md` - Complete setup guide for Google Sheets integration

## Profile Processor (`profileProcessor.js`)

The `profileProcessor.js` module converts raw profile documents into structured data suitable for database insertion. It includes:

### Main Functions

- `processProfileDocument(data)` - Processes a single profile document
- `processProfileDocuments(documents)` - Processes an array of profile documents
- `convertToCSV(processedProfiles)` - Converts processed profiles to CSV format

### Processing Features

- **LinkedIn URL Extraction**: Extracts profile URLs from various sources
- **Name & Location Cleaning**: Validates and cleans personal information
- **Experience Parsing**: 
  - Current company and title
  - Years in current role
  - Previous companies and titles
  - Total years of experience
- **Education Extraction**:
  - University names
  - Fields of study
  - Degrees
  - Undergraduate graduation year
- **Data Validation**: Filters out invalid profiles (login pages, error pages, etc.)

### Output Schema

The processed data follows this schema:

```javascript
{
  "Linkedin URL": string,
  "Full Name": string,
  "Current company": string,
  "Job title": string,
  "Years in current company": number,
  "Location": string,
  "Previous target company": string,
  "Tenure at previous target (Year start to year end)": string,
  "Previous title(s)": string,
  "Total Years full time experience": number,
  "University": string,
  "Fields of Study": string,
  "Degrees": string,
  "Year of Undergrad Graduation": number
}
```

## Usage

### In the Extension

1. Click the extension icon to open the popup
2. Use the buttons:
   - **Copy CSV**: Copies processed data as CSV to clipboard
   - **Download CSV**: Downloads `profiles.csv` file
   - **Copy Processed JSON**: Copies processed data as JSON (ready for database)

### In a Dashboard/Web App

```javascript
// Load the profileProcessor.js module
<script src="profileProcessor.js"></script>

// Process profile documents
const rawProfiles = [...]; // Array of raw profile documents
const processed = ProfileProcessor.processProfileDocuments(rawProfiles);

// Convert to CSV
const csv = ProfileProcessor.convertToCSV(processed);

// Or use individual functions
const processedProfile = ProfileProcessor.processProfileDocument(rawProfile);
```

### In Node.js

```javascript
const ProfileProcessor = require('./profileProcessor.js');

const processed = ProfileProcessor.processProfileDocuments(rawProfiles);
const csv = ProfileProcessor.convertToCSV(processed);
```

## Database Integration

The processed JSON output is ready for direct database insertion. Each processed profile object can be inserted into a database table with columns matching the output schema.

Example SQL insertion pattern:

```sql
INSERT INTO candidates (
  linkedin_url, full_name, current_company, job_title,
  years_in_current_company, location, previous_target_company,
  tenure_previous_target, previous_titles, total_years_experience,
  university, fields_of_study, degrees, undergrad_graduation_year
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
```

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension directory

## Google Sheets Integration

To enable automatic sending of profiles to Google Sheets:

1. Follow the setup guide in `GOOGLE_SHEETS_SETUP.md`
2. Configure your Google Sheets Web App URL in the extension settings
3. Optionally enable "Auto-send to Google Sheets when saving profiles"
4. Use the "Send to Vetted" button to manually send all saved profiles

## Testing

1. Navigate to a LinkedIn profile page
2. Click the "Save Profile JSON" floating button
3. Open the extension popup to view saved profiles
4. Use export buttons to get CSV or processed JSON

## Notes

- This extension performs local-only DOM scraping
- Users are responsible for complying with site terms of service
- Intended for internal/testing use only
- All processing happens client-side (no external API calls)

