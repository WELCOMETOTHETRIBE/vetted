# Extension Integration Guide

## Overview

The Vetted platform now supports importing candidate profiles from LinkedIn via the browser extension. Admins can scrape LinkedIn profiles and automatically add them to the searchable candidate pool.

## Features

- ✅ Candidate model in database with all LinkedIn profile fields
- ✅ API endpoint to accept processed profile JSON from extension
- ✅ Admin-only Candidates page with search and filtering
- ✅ Status management (Active, Contacted, Hired, Rejected, Archived)
- ✅ Notes system for each candidate
- ✅ Bulk import support

## Database Schema

The `Candidate` model includes:
- Basic info (name, LinkedIn URL, location)
- Current company and job title
- Experience history
- Education (universities, fields of study, degrees)
- Skills, certifications, languages
- Projects, publications, volunteer work
- Contact information
- Raw JSON data from extension

## API Endpoints

### POST `/api/candidates/upload`
Accepts processed profile JSON from extension.

**Authentication**: Admin only (session-based)

**Request Body**:
```json
{
  "Linkedin URL": "https://linkedin.com/in/example",
  "Full Name": "John Doe",
  "Current Company": "Tech Corp",
  "Job title": "Software Engineer",
  ...
}
```

Or array of profiles:
```json
[{...}, {...}]
```

### GET `/api/candidates`
List candidates with search and filtering.

**Query Parameters**:
- `search`: Search by name, company, title, location
- `status`: Filter by status (ACTIVE, CONTACTED, HIRED, REJECTED, ARCHIVED)
- `page`: Page number
- `limit`: Results per page

### PATCH `/api/candidates/[id]`
Update candidate status or notes.

**Body**:
```json
{
  "status": "CONTACTED",
  "notes": "Initial contact made"
}
```

### DELETE `/api/candidates/[id]`
Delete a candidate.

## Usage

### For Extension Developers

1. Process LinkedIn profile using `profileProcessor.js`
2. POST processed JSON to `/api/candidates/upload`
3. Handle authentication (see options below)

### Authentication Options

#### Option 1: Session-based (Current)
- Admin logs into Vetted
- Extension uses browser session
- Requires same-origin or CORS setup

#### Option 2: API Key (Recommended)
1. Generate API key for admin user
2. Send in `Authorization: Bearer <api-key>` header
3. Validate in endpoint

#### Option 3: Manual Upload
1. Export JSON from extension
2. Use admin panel upload form
3. Or browser console POST

### Example: Browser Console Upload

```javascript
// While logged in as admin on Vetted
const profile = {
  "Linkedin URL": "https://linkedin.com/in/johndoe",
  "Full Name": "John Doe",
  "Current Company": "Tech Corp",
  "Job title": "Senior Engineer",
  "Location": "San Francisco, CA"
};

fetch('/api/candidates/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profile)
})
.then(r => r.json())
.then(console.log);
```

## Admin UI

### Candidates Page (`/candidates`)

Features:
- Searchable table of all candidates
- Status filtering
- Click candidate to view details
- Update status inline
- Add/edit notes
- Delete candidates
- Pagination

### Access
- Only visible to admin users
- Link appears in navbar for admins
- Also accessible from Admin Dashboard

## Next Steps

1. **Add API Key Support**: Create API key generation for secure extension integration
2. **File Upload UI**: Add drag-and-drop JSON upload in admin panel
3. **CSV Import**: Support bulk CSV import
4. **Extension Update**: Modify extension to send directly to Vetted API
5. **Candidate Matching**: Match candidates to job postings
6. **Export**: Export candidates to CSV/JSON

## Logo Integration

The Vetted logo (`vetted.png`) is integrated into:
- Navbar (with fallback to text)
- Should be placed in `/public/vetted-logo.png`

If logo file doesn't exist, navbar falls back to text "Vetted".

