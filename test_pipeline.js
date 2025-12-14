const fs = require('fs');
const { JSDOM } = require('jsdom');

// Load profiles
const profiles = JSON.parse(fs.readFileSync('linkedin_profiles.json', 'utf8'));
const profilesWithHtml = profiles.filter(p => p.html && p.raw_text);

console.log('🎯 Testing LinkedIn Pipeline Quality');
console.log('====================================');
console.log(`Found ${profiles.length} profiles, ${profilesWithHtml.length} with HTML for parsing`);
console.log('');

console.log('📝 Testing HTML → JSON Extraction (profile-processor-server.ts logic):');
console.log('');

// Simple extraction test (mimicking profile-processor-server.ts)
function extractBasicInfo(html, url) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Extract name
  const nameSelectors = [
    "h1.text-heading-xlarge",
    "h1[data-anonymize='person-name']",
    "main h1",
    "h1",
    ".pv-text-details__left-panel h1",
  ];

  let name = '';
  for (const selector of nameSelectors) {
    const nameEl = document.querySelector(selector);
    if (nameEl) {
      name = nameEl.textContent?.trim() || '';
      if (name && name.length > 2 && name.length < 100) {
        break;
      }
    }
  }

  // Extract headline
  const headlineSelectors = [
    ".text-body-medium.break-words",
    ".pv-text-details__left-panel .text-body-medium",
    "h2.text-body-medium",
  ];

  let headline = '';
  for (const selector of headlineSelectors) {
    const headlineEl = document.querySelector(selector);
    if (headlineEl) {
      headline = headlineEl.textContent?.trim() || '';
      if (headline && !headline.includes("connections") && headline.length > 5) {
        break;
      }
    }
  }

  // Extract location
  const locationSelectors = [
    ".text-body-small.inline.t-black--light.break-words",
    ".pv-text-details__left-panel .text-body-small",
    "[data-test-id='location']",
  ];

  let location = '';
  for (const selector of locationSelectors) {
    const locationEl = document.querySelector(selector);
    if (locationEl) {
      location = locationEl.textContent?.trim() || '';
      if (location && !location.includes("connections") && location.length > 3) {
        break;
      }
    }
  }

  // Extract experience (basic count)
  const experienceSection = document.querySelector('section[id*="experience"], section:has(h2:contains("Experience"))');
  let experienceCount = 0;
  if (experienceSection) {
    experienceCount = experienceSection.querySelectorAll('li, .pvs-list__paged-list-item').length;
  }

  return {
    name: name || 'NOT FOUND',
    headline: headline || 'NOT FOUND',
    location: location || 'NOT FOUND',
    experienceCount,
    url
  };
}

// Test each profile
let successCount = 0;
profilesWithHtml.forEach((profile, index) => {
  console.log(`🔍 Profile ${index + 1}: ${profile.linkedin_url}`);
  try {
    const extracted = extractBasicInfo(profile.html, profile.linkedin_url);
    console.log(`  ✅ Name: ${extracted.name}`);
    console.log(`  ✅ Headline: ${extracted.headline}`);
    console.log(`  ✅ Location: ${extracted.location}`);
    console.log(`  ✅ Experience items: ${extracted.experienceCount}`);

    // Check quality
    const hasGoodData = extracted.name !== 'NOT FOUND' &&
                       extracted.headline !== 'NOT FOUND' &&
                       extracted.location !== 'NOT FOUND';

    if (hasGoodData) {
      successCount++;
      console.log(`  🎉 Quality: GOOD`);
    } else {
      console.log(`  ⚠️  Quality: NEEDS IMPROVEMENT`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
  console.log('');
});

console.log('📊 Pipeline Quality Summary:');
console.log(`  Total profiles with HTML: ${profilesWithHtml.length}`);
console.log(`  Successfully parsed: ${successCount}`);
console.log(`  Success rate: ${Math.round((successCount / profilesWithHtml.length) * 100)}%`);
console.log('');
console.log('🎯 Next Steps:');
console.log('  1. Run full pipeline test when server issues are resolved');
console.log('  2. Test AI enrichment on parsed data');
console.log('  3. Compare with extension quality metrics');
