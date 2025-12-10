# Google Sheets Integration Update

## Overview
The Google Sheets integration has been updated to capture **ALL columns** from the new CSV structure. The system now properly parses and stores:
- Current company with dates and tenure (years/months)
- Previous target company with dates and tenure
- Multiple companies (Company 1-10)
- Multiple universities (University 1-10)
- Multiple fields of study (Field of Study 1-10)
- Raw data column for later parsing

## What Changed

### 1. Google Sheets Script (`googleSheetsIntegration.gs`)
- **Updated headers**: Now includes all 50+ columns matching the new CSV structure
- **Dynamic array handling**: Automatically parses arrays for companies, universities, and fields of study
- **Raw data storage**: Stores original JSON data in the Raw Data column
- **Header validation**: Automatically updates headers if they don't match

### 2. Profile Processor (`profileProcessor.js`)
- **New output format**: Returns data in the new column structure
- **Date extraction**: Extracts start/end dates and tenure (years/months) separately
- **Array extraction**: Extracts companies, universities, and fields of study as arrays
- **Individual columns**: Also provides individual columns (Company 1, Company 2, etc.) for compatibility

## New Column Structure

The updated structure includes:

### Basic Information
- Linkedin URL
- Full Name
- Job title
- Location

### Current Company (7 columns)
- Current Company
- Current Company Start Date
- Current Company End Date
- Current Company Tenure Years
- Current Company Tenure Months

### Previous Target Company (5 columns)
- Previous target company
- Previous target company Start Date
- Previous target company End Date
- Previous target company Tenure Years
- Previous target company Tenure Months
- Tenure at previous target (Year start to year end)

### Companies (10 columns)
- Company 1 through Company 10

### Education
- Previous title(s)
- Total Years full time experience
- University 1 through University 10
- Field of Study 1 through Field of Study 10
- Degrees
- Year of Undergrad Graduation

### Metadata
- Submitted At (timestamp)
- Raw Data (original JSON)

## Setup Instructions

### For New Sheets
1. Create a new Google Sheet
2. Open Google Apps Script (Extensions > Apps Script)
3. Paste the updated `googleSheetsIntegration.gs` code
4. Update `SHEET_NAME` if needed (default: 'Sheet1')
5. Run `setupSheet()` function to initialize headers
6. Deploy as a web app (see original setup guide)
7. Copy the Web App URL to your extension settings

### For Existing Sheets
1. The script will automatically detect and update headers if they don't match
2. Existing data will remain intact
3. New columns will be added automatically

## Data Flow

1. **Extension captures profile** → Raw JSON stored
2. **Profile Processor** → Converts JSON to structured format with all columns
3. **Google Sheets Script** → Receives data and writes to appropriate columns
4. **Arrays are parsed** → Companies, universities, and fields split into individual columns

## Testing

Run these functions in Google Apps Script to test:

```javascript
// Test connection and see column count
testConnection()

// Set up sheet with new headers
setupSheet()
```

## Notes

- The script supports up to 10 companies, 10 universities, and 10 fields of study
- Raw Data column stores the complete original JSON for later parsing
- All date formats are preserved (e.g., "Aug 2025", "2020", "Present")
- Tenure is stored as separate years and months columns for easier analysis

## Migration from Old Format

If you have existing data in the old format:
1. Export your existing sheet as CSV
2. Use the `fix_csv.py` script to convert to new format
3. Import the converted CSV back to Google Sheets
4. The script will automatically align with the new headers


