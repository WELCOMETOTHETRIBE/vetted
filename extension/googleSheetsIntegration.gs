/**
 * Google Apps Script for receiving profile data and writing to Google Sheets
 * Updated to capture ALL columns from the new CSV structure
 * 
 * LAST UPDATED: 2024-12-09
 * VERSION: 2.0.0-comprehensive
 * TOTAL COLUMNS: 70+
 * 
 * ⚠️ IMPORTANT: After updating this script, run setupSheet() to update headers
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet (or use an existing one)
 * 2. Open Google Apps Script (Extensions > Apps Script)
 * 3. Paste this code into the script editor
 * 4. Replace 'Sheet1' with your actual sheet name if different
 * 5. Run the setupSheet() function once to initialize (Run > setupSheet)
 * 6. Deploy as a web app:
 *    - Click "Deploy" > "New deployment"
 *    - Choose type: "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (or "Anyone with Google account" for more security)
 *    - Click "Deploy"
 * 7. Authorize the script when prompted (click "Authorize access" and follow prompts)
 * 8. Copy the Web App URL and use it in the extension settings
 * 
 * IMPORTANT: If you get "access blocked" error:
 * - Make sure you're logged into the correct Google account
 * - Click "Advanced" then "Go to [Project Name] (unsafe)" if shown
 * - Grant all requested permissions
 */

// Configuration - UPDATE THESE VALUES
const SHEET_NAME = 'Sheet1'; // Change to your sheet name

// Define all headers matching the new CSV structure
// Supports up to 10 companies, 10 universities, and 10 fields of study
const HEADERS = [
  'Linkedin URL',
  'Full Name',
  'Current Company',
  'Current Company Start Date',
  'Current Company End Date',
  'Current Company Tenure Years',
  'Current Company Tenure Months',
  'Job title',
  'Location',
  'Previous target company',
  'Previous target company Start Date',
  'Previous target company End Date',
  'Previous target company Tenure Years',
  'Previous target company Tenure Months',
  'Tenure at previous target (Year start to year end)',
  'Company 1',
  'Company 2',
  'Company 3',
  'Company 4',
  'Company 5',
  'Company 6',
  'Company 7',
  'Company 8',
  'Company 9',
  'Company 10',
  'Previous title(s)',
  'Total Years full time experience',
  'University 1',
  'University 2',
  'University 3',
  'University 4',
  'University 5',
  'University 6',
  'University 7',
  'University 8',
  'University 9',
  'University 10',
  'Field of Study 1',
  'Field of Study 2',
  'Field of Study 3',
  'Field of Study 4',
  'Field of Study 5',
  'Field of Study 6',
  'Field of Study 7',
  'Field of Study 8',
  'Field of Study 9',
  'Field of Study 10',
  'Degrees',
  'Year of Undergrad Graduation',
  'Certifications',
  'Languages',
  'Projects',
  'Publications',
  'Volunteer Organizations',
  'Courses',
  'Honors & Awards',
  'Organizations',
  'Patents',
  'Test Scores',
  'Emails',
  'Phones',
  'Social Links',
  'Skills Count',
  'Experience Count',
  'Education Count',
  'Core Roles',
  'Domains',
  'Submitted At',
  'Raw Data'
];

/**
 * Handle POST request to add a profile row
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    
    // Parse the JSON data from the request
    const postData = JSON.parse(e.postData.contents);
    
    // Handle both single profile and array of profiles
    const profiles = Array.isArray(postData) ? postData : [postData];
    
    let addedCount = 0;
    
    for (const profile of profiles) {
      // Build row data dynamically based on headers
      const row = [];
      
      for (let i = 0; i < HEADERS.length; i++) {
        const header = HEADERS[i];
        let value = '';
        
        // Special handling for timestamp
        if (header === 'Submitted At') {
          value = profile[header] || new Date().toISOString();
        }
        // Special handling for Raw Data (store as JSON string)
        else if (header === 'Raw Data') {
          // If Raw Data is already a string, use it; otherwise stringify
          if (profile[header]) {
            value = typeof profile[header] === 'string' ? profile[header] : JSON.stringify(profile[header]);
          } else {
            // Store the entire profile as raw data if not provided
            value = JSON.stringify(profile);
          }
        }
        // Handle array fields (companies, universities, fields of study)
        // First check for individual columns (Company 1, Company 2, etc.)
        // Then fall back to arrays if individual columns don't exist
        else if (header.startsWith('Company ')) {
          // Try individual column first (e.g., "Company 1")
          value = profile[header] || '';
          // If not found, try array
          if (!value) {
            const index = parseInt(header.replace('Company ', '')) - 1;
            const companies = profile['Companies'] || [];
            value = companies[index] || '';
          }
        }
        else if (header.startsWith('University ')) {
          // Try individual column first (e.g., "University 1")
          value = profile[header] || '';
          // If not found, try array
          if (!value) {
            const index = parseInt(header.replace('University ', '')) - 1;
            const universities = profile['Universities'] || [];
            value = universities[index] || '';
          }
        }
        else if (header.startsWith('Field of Study ')) {
          // Try individual column first (e.g., "Field of Study 1")
          value = profile[header] || '';
          // If not found, try array
          if (!value) {
            const index = parseInt(header.replace('Field of Study ', '')) - 1;
            const fields = profile['Fields of Study'] || [];
            value = fields[index] || '';
          }
        }
        // Standard field lookup
        else {
          value = profile[header] || '';
        }
        
        row.push(value);
      }
      
      // Append row to sheet
      sheet.appendRow(row);
      addedCount++;
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `Successfully added ${addedCount} profile(s) to sheet`,
        count: addedCount
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET request (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'Profile Logger Google Sheets Integration',
      status: 'active',
      method: 'Use POST to send profile data',
      headers: HEADERS.length + ' columns supported'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get or create the sheet and set up headers if needed
 * This function requires spreadsheet permissions
 */
function getOrCreateSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }
    
    // Set up headers if sheet is empty or headers don't match
    const currentRowCount = sheet.getLastRow();
    if (currentRowCount === 0) {
      // Sheet is empty, add headers
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      // Check if headers match
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (existingHeaders.length !== HEADERS.length || 
          !existingHeaders.every((h, i) => h === HEADERS[i])) {
        // Headers don't match - update them
        // Clear first row and add new headers
        sheet.getRange(1, 1, 1, sheet.getLastColumn()).clear();
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
        sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
    }
    
    return sheet;
  } catch (error) {
    // If permission error, log it
    Logger.log('Permission error: ' + error.toString());
    throw new Error('Permission denied. Please authorize the script to access Google Sheets.');
  }
}

/**
 * Test function - run this to set up the sheet and authorize permissions
 * Run this function first to trigger authorization
 */
function setupSheet() {
  try {
    const sheet = getOrCreateSheet();
    Logger.log('Sheet setup complete. Headers:', HEADERS.length);
    return 'Sheet setup complete! ' + HEADERS.length + ' headers have been created.';
  } catch (error) {
    Logger.log('Setup error: ' + error.toString());
    return 'Error: ' + error.toString() + '. Please authorize the script when prompted.';
  }
}

/**
 * Test function to verify permissions and connection
 */
function testConnection() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (sheet) {
      const rowCount = sheet.getLastRow();
      return 'Connection successful! Sheet "' + SHEET_NAME + '" found. ' + 
             HEADERS.length + ' columns configured. ' +
             (rowCount > 0 ? rowCount + ' rows of data.' : 'No data yet.');
    } else {
      return 'Sheet "' + SHEET_NAME + '" not found. Run setupSheet() first.';
    }
  } catch (error) {
    return 'Error: ' + error.toString() + '. Please authorize the script.';
  }
}
