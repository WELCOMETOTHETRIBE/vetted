#!/usr/bin/env node
/**
 * Test script for LinkedIn profile import with monitoring
 * Searches for profiles, scrapes HTML, and imports them with full monitoring
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function runLinkedInSearch(query, location, company, title) {
  console.log('\n========== [TEST] Starting LinkedIn Profile Search ==========');
  console.log(`Query: ${query}`);
  console.log(`Location: ${location || 'None'}`);
  console.log(`Company: ${company || 'None'}`);
  console.log(`Title: ${title || 'None'}`);
  console.log('===========================================================\n');

  const scriptPath = path.join(__dirname, '..', 'scripts', 'linkedin', 'linkedin_profile_scraper.py');
  const pythonCmd = process.env.PYTHON_COMMAND || 'python3';
  
  let command = `${pythonCmd} ${scriptPath}`;
  if (query) command += ` "${query}"`;
  if (location) command += ` --location "${location}"`;
  if (company) command += ` --company "${company}"`;
  if (title) command += ` --title "${title}"`;
  command += ` --scrape`; // Always scrape HTML for full parsing

  console.log(`Running: ${command}\n`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        SERPAPI_KEY: process.env.SERPAPI_KEY,
        LINKEDIN_OUTPUT_FILE: process.env.LINKEDIN_OUTPUT_FILE || 'linkedin_profiles.json',
        SCRAPE_PROFILES: 'true',
      },
      timeout: 600000, // 10 minutes
    });

    if (stdout) console.log('STDOUT:', stdout);
    if (stderr) console.error('STDERR:', stderr);

    // Check output file
    const outputFile = process.env.LINKEDIN_OUTPUT_FILE || 'linkedin_profiles.json';
    let outputPath = path.join(process.cwd(), outputFile);
    const tmpPath = path.join('/tmp', outputFile);

    let data;
    try {
      data = await fs.readFile(outputPath, 'utf-8');
    } catch (error) {
      try {
        data = await fs.readFile(tmpPath, 'utf-8');
        outputPath = tmpPath;
      } catch (tmpError) {
        throw new Error('Output file not found');
      }
    }

    const profiles = JSON.parse(data);
    console.log(`\n✅ Successfully scraped ${profiles.length} profiles`);
    console.log(`Output file: ${outputPath}`);
    
    // Show summary
    const withHtml = profiles.filter(p => p.html && p.raw_text).length;
    const withoutHtml = profiles.length - withHtml;
    console.log(`  - With HTML: ${withHtml}`);
    console.log(`  - Without HTML: ${withoutHtml}`);

    return { success: true, profiles, outputPath };
  } catch (error) {
    console.error('\n❌ Search failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    return { success: false, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const query = args[0] || 'AI Engineer';
  const location = args.find(arg => arg.startsWith('--location='))?.split('=')[1] || 'San Francisco';
  const company = args.find(arg => arg.startsWith('--company='))?.split('=')[1] || 'OpenAI';
  const title = args.find(arg => arg.startsWith('--title='))?.split('=')[1];

  console.log('LinkedIn Profile Import Test Script');
  console.log('====================================\n');
  console.log('This script will:');
  console.log('1. Search for LinkedIn profiles using SERPAPI');
  console.log('2. Scrape HTML from profiles using Playwright');
  console.log('3. Process HTML through extension parsing pipeline');
  console.log('4. Import profiles with AI enrichment');
  console.log('\nNote: You need to run the import via the API endpoint');
  console.log('      POST /api/linkedin-profiles/import\n');

  if (!process.env.SERPAPI_KEY) {
    console.error('❌ ERROR: SERPAPI_KEY environment variable not set');
    console.log('Set it with: export SERPAPI_KEY=your_key_here');
    process.exit(1);
  }

  const result = await runLinkedInSearch(query, location, company, title);

  if (result.success) {
    console.log('\n✅ Search completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your Next.js server: npm run dev');
    console.log('2. Make sure you are logged in as an admin');
    console.log('3. Call POST /api/linkedin-profiles/import to import the profiles');
    console.log('4. Monitor the server logs for detailed parsing and enrichment feedback');
  } else {
    console.log('\n❌ Search failed. Check the errors above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runLinkedInSearch };

