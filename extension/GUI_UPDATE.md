# GUI Update - Tagging and Editable Fields

## Overview
The extension GUI has been completely redesigned to support:
1. **Tagging system** with Core Roles and Domain dropdowns
2. **Editable fields** for all profile data
3. **Detailed profile view** with all CSV columns visible and editable
4. **Data persistence** - edited fields and tags are saved with each profile

## New Features

### 1. Tagging System

#### Core Roles
- Software Engineer
- Backend
- Frontend
- Full Stack
- ML
- Infra / DevOps
- Data Engineer
- Security
- Product Designer
- Product Manager
- Recruiter
- Embedded Software Engineer
- Hardware Engineer
- Mechanical Engineer
- Electrical Engineer

#### Domains
- Hardware
- SaaS
- FinTech
- Finance
- Consumer
- AI
- Crypto / Blockchain
- Ecomm / Marketplace
- Cybersecurity

**Usage:**
- Click on any profile row to open the edit modal
- Select multiple tags from the dropdowns
- Tags are displayed as chips and can be removed individually
- Tags are saved with the profile and included in CSV export

### 2. Editable Fields

All CSV columns are now editable in the profile modal:
- Basic Info: LinkedIn URL, Full Name, Location
- Current Company: Name, Start/End Dates, Tenure (Years/Months)
- Previous Target Company: Name, Dates, Tenure
- Companies: Company 1-5 (and more)
- Education: Universities, Fields of Study, Degrees, Graduation Year
- Experience: Previous Titles, Total Years

**How it works:**
- Click any profile row or the "Edit" button
- Modify any field in the modal
- Click "Save Changes" to persist edits
- Edited fields override auto-extracted values
- Original data is preserved in Raw Data column

### 3. Enhanced Table View

The main table now shows:
- Profile number
- Name
- Current Company
- Job Title
- Location
- Tags (as badges)
- Edit button

Clicking anywhere on a row opens the edit modal.

## Data Flow

### Current Architecture
```
HTML Page → JSON Extraction → Storage → Processing → CSV → Google Sheets
                ↓
         (Raw HTML preserved)
```

### Why Keep JSON?

**Benefits:**
1. **Structured Data**: JSON provides a clear structure for parsing
2. **Debugging**: Easy to inspect what was extracted
3. **Flexibility**: Can reprocess JSON with different logic
4. **Raw Data Preservation**: Original HTML is stored in Raw Data column
5. **Editability**: Users can fix extraction errors in GUI

**Data Loss Prevention:**
- Raw HTML is preserved in `raw_text` field
- Raw Data column stores complete original JSON
- Edited fields override auto-extracted values
- Users can see and fix any missing data

### Alternative: Direct HTML-to-CSV

**Pros:**
- Potentially less data loss (one less transformation step)
- Simpler pipeline

**Cons:**
- Much more complex parsing logic
- Harder to debug extraction issues
- Less flexible for different data formats
- No intermediate structured representation
- Harder to edit/manipulate data

**Recommendation:**
Keep the current JSON approach but:
1. ✅ Improve extraction to capture more data (already done)
2. ✅ Store raw HTML for later parsing (already done)
3. ✅ Make all fields editable in GUI (already done)
4. ✅ Show all fields so users can see what's missing (already done)

## Storage Structure

Each profile document now includes:
```javascript
{
  // Original extracted data
  personal_info: {...},
  experience: [...],
  education: [...],
  raw_text: "...", // Original HTML
  
  // Metadata (added by GUI)
  _metadata: {
    tags: {
      coreRoles: ["Software Engineer", "Backend"],
      domains: ["SaaS", "FinTech"]
    },
    editedFields: {
      "Current Company": "Acme Corp",
      "Job title": "Senior Engineer",
      // ... any edited fields
    },
    lastEdited: "2025-12-09T..."
  }
}
```

## CSV Export

The CSV now includes:
- All original columns (50+ fields)
- **Core Roles** column (semicolon-separated)
- **Domains** column (semicolon-separated)
- Edited fields override auto-extracted values
- Raw Data column with complete JSON

## Google Sheets Integration

The Google Sheets script has been updated to:
- Accept Core Roles and Domains columns
- Handle edited fields
- Preserve all data including tags

## Usage Workflow

1. **Extract Profile**: Click "Save Profile JSON" on LinkedIn page
2. **Review & Edit**: Open extension popup, click profile row
3. **Tag Profile**: Select Core Roles and Domains
4. **Edit Fields**: Fix any incorrect or missing data
5. **Save**: Click "Save Changes"
6. **Export**: Use "Copy CSV" or "Download CSV"
7. **Send**: Use "Send to Vetted" to push to Google Sheets

## Future Enhancements

Potential improvements:
- Bulk tagging (select multiple profiles)
- Search/filter by tags
- Export filtered subsets
- Import CSV to edit existing profiles
- Direct HTML parsing mode (optional)
- Field validation rules
- Custom tag categories

## Technical Notes

- Tags are stored in `_metadata.tags` object
- Edited fields are stored in `_metadata.editedFields` object
- Original data is never overwritten, only augmented
- CSV generation merges edited fields with processed data
- Google Sheets receives merged data with tags


