/**
 * Profile JSON Processor - Enhanced Version
 * Converts LinkedIn profile JSON documents to structured data for database insertion
 * Uses extensive heuristics to extract maximum information from all available fields
 */

/**
 * Get LinkedIn URL from JSON data
 */
function getLinkedInUrlFromJson(data) {
  const personalInfo = data.personal_info || {};
  if (personalInfo.profile_url) {
    return personalInfo.profile_url;
  }

  const rawText = data.raw_text || "";
  if (rawText) {
    const urlPattern = /(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s\)]+)/;
    const match = rawText.match(urlPattern);
    if (match) {
      return match[1].replace(/[.,;:!?)]+$/, "");
    }
  }

  if (data.extraction_metadata?.source_url) {
    const url = data.extraction_metadata.source_url;
    if (url.includes('linkedin.com/in/')) {
      return url;
    }
  }

  return null;
}

/**
 * Parse duration string to extract years
 */
function parseDuration(durationStr) {
  if (!durationStr) {
    return [null, null, null];
  }

  const yearPattern = /\d{4}/g;
  const years = durationStr.match(yearPattern) || [];

  let startYear = years.length > 0 ? parseInt(years[0], 10) : null;
  let endYear = years.length > 1 ? parseInt(years[1], 10) : null;

  const isPresent = /Present/i.test(durationStr);
  if (isPresent) {
    endYear = new Date().getFullYear();
  }

  let yearsInRole = null;

  if (/yr/i.test(durationStr)) {
    const yearMatch = durationStr.match(/(\d+)\s*(?:yr|yrs)/i);
    if (yearMatch) {
      yearsInRole = parseInt(yearMatch[1], 10);
      const monthMatch = durationStr.match(/(\d+)\s*(?:mos?|months?)/i);
      if (monthMatch) {
        const months = parseInt(monthMatch[1], 10);
        if (months >= 6) {
          yearsInRole += 1;
        }
      }
    }
  } else if (/mos?/i.test(durationStr)) {
    const monthMatch = durationStr.match(/(\d+)\s*(?:mos?|months?)/i);
    if (monthMatch) {
      const months = parseInt(monthMatch[1], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthPattern = /([A-Za-z]{3})\s+(\d{4})/g;
      const dateMatches = [];
      let match;
      while ((match = monthPattern.exec(durationStr)) !== null) {
        dateMatches.push([match[1], match[2]]);
      }

      if (dateMatches.length >= 2) {
        const [startMonthName, startYr] = dateMatches[0];
        const [endMonthName, endYr] = dateMatches[1];
        const startMonth = monthNames.indexOf(startMonthName) + 1;
        const endMonth = monthNames.indexOf(endMonthName) + 1;
        const totalMonths = (parseInt(endYr, 10) - parseInt(startYr, 10)) * 12 +
          (endMonth - startMonth) + 1;
        yearsInRole = Math.floor(totalMonths / 12);
        const remainingMonths = totalMonths % 12;
        if (remainingMonths >= 6) {
          yearsInRole += 1;
        }
      } else if (isPresent && startYear && dateMatches.length >= 1) {
        const [startMonthName, startYr] = dateMatches[0];
        const startMonth = monthNames.indexOf(startMonthName) + 1;
        const now = new Date();
        const totalMonths = (now.getFullYear() - parseInt(startYr, 10)) * 12 +
          (now.getMonth() + 1 - startMonth) + 1;
        yearsInRole = Math.floor(totalMonths / 12);
        const remainingMonths = totalMonths % 12;
        if (remainingMonths >= 6) {
          yearsInRole += 1;
        }
      } else {
        yearsInRole = months >= 6 ? 1 : 0;
      }
    }
  }

  if (yearsInRole === null && startYear && endYear) {
    yearsInRole = endYear - startYear;
    if (isPresent) {
      const now = new Date();
      if (now.getMonth() >= 5) {
        yearsInRole += 1;
      }
    }
  }

  return [startYear, endYear, yearsInRole];
}

/**
 * Calculate total years of full-time experience
 */
function calculateTotalYearsExperience(experienceList) {
  if (!experienceList || experienceList.length === 0) {
    return null;
  }

  let totalYears = 0;
  for (const exp of experienceList) {
    const duration = exp.duration || "";
    if (!duration) continue;

    const companyInfo = exp.company_info || "";
    const company = exp.company || "";
    
    // Skip if explicitly part-time, contract, or internship
    if (companyInfo && /part-time|contract|internship/i.test(companyInfo)) {
      continue;
    }
    
    // Skip if company is "Full-time" (this is a parsing error)
    if (company && /^full-time$/i.test(company.trim())) {
      continue;
    }

    const [, , yearsInRole] = parseDuration(duration);
    if (yearsInRole) {
      totalYears += yearsInRole;
    } else {
      const [startYear, endYear] = parseDuration(duration);
      if (startYear && endYear) {
        totalYears += (endYear - startYear);
      }
    }
  }

  return totalYears > 0 ? totalYears : null;
}

/**
 * Clean and validate company name
 */
function isValidCompanyName(company) {
  if (!company || company.length < 2) return false;
  if (company.length > 100) return false;
  
  const invalidPatterns = [
    /^full-time$/i,
    /^part-time$/i,
    /^contract$/i,
    /^internship$/i,
    /^present$/i,
    /^\d+\s*(?:yr|yrs|mos?|months?)$/i,
    /^[A-Z][a-z]+,\s+[A-Z][a-z]+,\s+United States$/,
    /^Greater [A-Z][a-z]+ Area$/,
    /^Los Angeles, California, United States$/,
    /^New York, New York, United States$/,
  ];
  
  return !invalidPatterns.some(pattern => pattern.test(company.trim()));
}

/**
 * Check if text contains only dates/tenure (not a company name)
 */
function isDateOrTenureOnly(text) {
  if (!text) return true;
  
  // Patterns that indicate this is just dates/tenure, not a company name
  const dateTenurePatterns = [
    /^\d{4}\s+-\s+(?:Present|\d{4})/,
    /^[A-Z][a-z]{2}\s+\d{4}\s+-\s+(?:Present|[A-Z][a-z]{2}\s+\d{4})/,
    /^\d{4}\s+to\s+(?:Present|\d{4})/,
    /·\s+\d+\s+(?:mos?|yrs?|months?|years?)/,
    /^\d+\s+(?:mos?|yrs?|months?|years?)/,
    /^[A-Z][a-z]{2}\s+\d{4}\s+to\s+(?:Present|[A-Z][a-z]{2}\s+\d{4})/,
  ];
  
  const trimmed = text.trim();
  // If it matches date/tenure patterns and is short, it's likely not a company
  if (trimmed.length < 50) {
    return dateTenurePatterns.some(pattern => pattern.test(trimmed));
  }
  
  return false;
}

/**
 * Extract company name from various fields using heuristics
 */
function extractCompanyFromFields(exp, rawText, title) {
  let company = exp.company || "";
  
  // Check if company field contains only dates/tenure (common LinkedIn parsing issue)
  if (isDateOrTenureOnly(company)) {
    company = "";
  }
  
  // If company field looks invalid, try other fields
  if (!company || !isValidCompanyName(company)) {
    company = "";
    
    // Try company_info field FIRST (most reliable source)
    const companyInfo = exp.company_info || "";
    if (companyInfo && !isDateOrTenureOnly(companyInfo)) {
      // Look for company name patterns in company_info
      // Common patterns: "Company Name · Full-time", "Company Name (YC S20)", etc.
      const patterns = [
        /^([A-Z][a-zA-Z0-9\s&.,'-]+?)(?:\s+·\s+(?:Full-time|Part-time|Contract|Internship)|$)/,
        /^([A-Z][a-zA-Z0-9\s&.,'-]+?)(?:\s+\(YC|$)/,
        /^([A-Z][a-zA-Z0-9\s&.,'-]+?)(?:\s+Series|$)/,
        /^([A-Z][a-zA-Z0-9\s&.,'-]+?)(?:\s+backed by|$)/i,
        // Just take the first capitalized phrase if it looks like a company name
        /^([A-Z][a-zA-Z0-9\s&.,'-]{2,50})(?:\s|$)/,
      ];
      
      for (const pattern of patterns) {
        const match = companyInfo.match(pattern);
        if (match) {
          const potential = match[1].trim();
          // Clean up common suffixes
          const cleaned = potential
            .replace(/\s+·\s+.*$/, '') // Remove "· Full-time" etc
            .replace(/\s+\(.*$/, '') // Remove parenthetical notes
            .trim();
          
          if (cleaned && isValidCompanyName(cleaned) && !isDateOrTenureOnly(cleaned)) {
            company = cleaned;
            break;
          }
        }
      }
      
      // If no pattern matched, try taking first part before common separators
      if (!company) {
        const parts = companyInfo.split(/[·•\n]/);
        if (parts.length > 0) {
          const firstPart = parts[0].trim();
          if (firstPart && isValidCompanyName(firstPart) && !isDateOrTenureOnly(firstPart)) {
            company = firstPart;
          }
        }
      }
    }
    
    // Try description field
    if (!company) {
      const description = exp.description || "";
      if (description) {
        // Look for company names in description
        const descPatterns = [
          /([A-Z][a-zA-Z0-9\s&.,-]+?)\s+\d+\s*(?:yr|yrs|mos?|months?)/,
          /([A-Z][a-zA-Z0-9\s&.,-]+?)\s+·\s+Full-time/,
          /([A-Z][a-zA-Z0-9\s&.,-]+?)\s+Los Angeles/,
        ];
        
        for (const pattern of descPatterns) {
          const match = description.match(pattern);
          if (match) {
            const potential = match[1].trim();
            if (isValidCompanyName(potential) && !potential.includes("United States")) {
              company = potential;
              break;
            }
          }
        }
      }
    }
    
    // Try raw_text extraction with improved patterns
    if (!company && rawText) {
      try {
        // Pattern 1: "Title\nCompany · Full-time\nDuration"
        if (title) {
          const pattern1 = new RegExp(`${escapeRegex(title)}[\\n\\r\\s]+([A-Z][a-zA-Z0-9\\s&.,'-]+?)\\s+·\\s+(?:Full-time|Part-time)`, 'i');
          const match1 = rawText.match(pattern1);
          if (match1) {
            const potential = match1[1].trim();
            if (isValidCompanyName(potential) && !isDateOrTenureOnly(potential)) {
              company = potential;
            }
          }
        }
        
        // Pattern 2: Extract from Experience section - look for current role
        if (!company) {
          const expSection = rawText.match(/Experience[\\n\\r\\s]+(.*?)(?:Education|Skills|Show all|$)/is);
          if (expSection) {
            const expText = expSection[1];
            
            // Look for "Present" entries first (current role)
            const presentPattern = /([A-Z][a-zA-Z0-9\s&.,'-]+(?: [A-Z][a-zA-Z0-9\s&.,'-]+)*)\n([A-Z][a-zA-Z0-9\s&.,'-]+)\s+·\s+(?:Full-time|Part-time).*?Present/is;
            const presentMatch = expText.match(presentPattern);
            if (presentMatch) {
              const potentialCompany = presentMatch[2].trim();
              if (isValidCompanyName(potentialCompany) && !isDateOrTenureOnly(potentialCompany)) {
                company = potentialCompany;
              }
            }
            
            // Pattern 3: "Title\nCompany" (more general)
            if (!company && title) {
              const pattern3 = new RegExp(`${escapeRegex(title)}[\\n\\r\\s]+([A-Z][a-zA-Z0-9\\s&.,'-]+?)(?:\\s+·|\\n|\\r|$)`, 'i');
              const match3 = expText.match(pattern3);
              if (match3) {
                const potential = match3[1].trim();
                if (isValidCompanyName(potential) && !isDateOrTenureOnly(potential)) {
                  company = potential;
                }
              }
            }
          }
        }
      } catch (e) {
        // Pattern matching failed
        console.error('Error extracting company from raw_text:', e);
      }
    }
  }
  
  // Final validation - make sure we didn't extract dates/tenure
  if (company && isDateOrTenureOnly(company)) {
    return null;
  }
  
  return company || null;
}

/**
 * Get current company, job title, and years in current company
 */
function getCurrentCompany(experienceList, rawText = "") {
  if (!experienceList || experienceList.length === 0) {
    return [null, null, null];
  }

  let currentExp = null;
  
  // Find experience with "Present" in duration
  for (const exp of experienceList) {
    const duration = exp.duration || "";
    if (duration && /Present/i.test(duration)) {
      currentExp = exp;
      break;
    }
  }

  // If no "Present", check first entry for future dates
  if (!currentExp && experienceList.length > 0) {
    const firstExp = experienceList[0];
    const duration = firstExp.duration || "";
    if (duration) {
      const yearPattern = /\d{4}/g;
      const years = duration.match(yearPattern) || [];
      if (years.length > 0) {
        const endYear = parseInt(years[years.length - 1], 10);
        const currentYear = new Date().getFullYear();
        if (endYear >= currentYear) {
          currentExp = firstExp;
        }
      }
    }
  }

  if (currentExp) {
    const duration = currentExp.duration || "";
    let title = currentExp.title || "";
    let company = extractCompanyFromFields(currentExp, rawText, title);
    
    // If still no company, try extracting from company_info directly
    if (!company && currentExp.company_info) {
      const companyInfo = currentExp.company_info;
      // Split by common separators and take first valid part
      const parts = companyInfo.split(/[·•\n]/);
      for (const part of parts) {
        const cleaned = part.trim();
        if (cleaned && isValidCompanyName(cleaned) && !isDateOrTenureOnly(cleaned)) {
          company = cleaned;
          break;
        }
      }
    }

    // Clean up title
    if (title && title.length > 50) {
      title = "";
    }

    // Extract title from description if missing
    if (!title || title.length < 2) {
      const description = currentExp.description || "";
      const titlePatterns = [
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+at/,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+·/,
      ];

      for (const pattern of titlePatterns) {
        const match = description.match(pattern);
        if (match) {
          const potentialTitle = match[1].trim();
          if (potentialTitle.length > 2 && potentialTitle.length < 50) {
            title = potentialTitle;
            break;
          }
        }
      }
    }

    const [, , years] = parseDuration(duration);
    return [company, title, years];
  }

  // Fallback: extract from raw_text
  if (rawText) {
    try {
      const expSectionMatch = rawText.match(/Experience[\n\s]+(.*?)(?:Education|Skills|Show all)/is);
      if (expSectionMatch) {
        const expText = expSectionMatch[1];
        const presentPattern = /([A-Z][a-zA-Z0-9\s&.,-]+(?: [A-Z][a-zA-Z0-9\s&.,-]+)*)\n([A-Z][a-zA-Z0-9\s&.,-]+)\s+·\s+Full-time\n.*?Present/is;
        const match = expText.match(presentPattern);
        if (match) {
          const potentialTitle = match[1].trim();
          const potentialCompany = match[2].trim();
          if (isValidCompanyName(potentialCompany) && potentialTitle.length > 2 && potentialTitle.length < 50) {
            const yearsMatch = expText.match(new RegExp(`${escapeRegex(potentialTitle)}.*?Present.*?(\\d+)\\s*(?:yr|yrs)`, 'i'));
            const years = yearsMatch ? parseInt(yearsMatch[1], 10) : null;
            return [potentialCompany, potentialTitle, years];
          }
        }
      }
    } catch (e) {
      // Extraction failed
    }
  }

  return [null, null, null];
}

/**
 * Get previous target company (first non-current position)
 */
function getPreviousTargetCompany(experienceList) {
  if (!experienceList || experienceList.length < 2) {
    return [null, null, null, null];
  }

  // Find first non-current position
  for (let i = 1; i < experienceList.length; i++) {
    const exp = experienceList[i];
    const duration = exp.duration || "";
    if (duration && !/Present/i.test(duration)) {
      const title = exp.title || "";
      let company = extractCompanyFromFields(exp, "", title);

      if (company && isValidCompanyName(company)) {
        const [startYear, endYear] = parseDuration(duration);
        return [company, title, startYear, endYear];
      }
    }
  }

  // Fallback: get second item
  if (experienceList.length >= 2) {
    const prevExp = experienceList[1];
    const title = prevExp.title || "";
    let company = extractCompanyFromFields(prevExp, "", title);
    const duration = prevExp.duration || "";

    if (company && isValidCompanyName(company)) {
      const [startYear, endYear] = parseDuration(duration);
      return [company, title, startYear, endYear];
    }
  }

  return [null, null, null, null];
}

/**
 * Get all previous titles (all non-current positions)
 */
function getPreviousTitles(experienceList) {
  if (!experienceList || experienceList.length < 2) {
    return "";
  }

  const titles = [];
  for (let i = 1; i < experienceList.length; i++) {
    const title = experienceList[i].title || "";
    if (title && title.length > 2 && title.length < 100 && !titles.includes(title)) {
      // Skip if title looks invalid
      if (!/^full-time$/i.test(title.trim()) && !/^part-time$/i.test(title.trim())) {
        titles.push(title);
      }
    }
  }

  return titles.join("; ");
}

/**
 * Get comprehensive employment history with years at each company
 * Returns formatted string: "Company1 (2020-2023); Company2 (2018-2020); Company3 (2015-Present)"
 */
function getEmploymentHistory(experienceList, rawText = "") {
  if (!experienceList || experienceList.length === 0) {
    return "";
  }

  const employmentEntries = [];
  
  for (const exp of experienceList) {
    const duration = exp.duration || "";
    const title = exp.title || "";
    let company = extractCompanyFromFields(exp, rawText, title);
    
    // Skip if no valid company
    if (!company || !isValidCompanyName(company)) {
      continue;
    }
    
    // Skip if title is invalid
    if (!title || title.length < 2 || /^full-time$/i.test(title.trim()) || /^part-time$/i.test(title.trim())) {
      continue;
    }
    
    // Parse years from duration
    const [startYear, endYear] = parseDuration(duration);
    const isPresent = /Present/i.test(duration);
    
    // Format the entry
    let yearRange = "";
    if (startYear && endYear) {
      yearRange = `${startYear}-${endYear}`;
    } else if (startYear) {
      yearRange = isPresent ? `${startYear}-Present` : String(startYear);
    } else if (endYear) {
      yearRange = String(endYear);
    }
    
    // Format: "Company - Title (Year Range)" or "Company (Year Range)" if no title
    let entry = "";
    if (yearRange) {
      if (title && title.length > 2) {
        entry = `${company} - ${title} (${yearRange})`;
      } else {
        entry = `${company} (${yearRange})`;
      }
    } else {
      // No year info, just include company and title
      if (title && title.length > 2) {
        entry = `${company} - ${title}`;
      } else {
        entry = company;
      }
    }
    
    if (entry) {
      employmentEntries.push(entry);
    }
  }
  
  return employmentEntries.join("; ");
}

/**
 * Extract university from raw text with better patterns
 */
function extractUniversityFromRawText(rawText, educationList) {
  if (!rawText) {
    return null;
  }

  const universitiesFound = [];
  const skipWords = ['contact', 'message', 'connect', 'follow', 'pioneer', 'robot', 'equipped', 'laser', 'scans', 'sonar', 'wheel', 'encoders'];

  // Enhanced patterns
  const universityPatterns = [
    /University of [A-Z][a-zA-Z\s-]+(?: Boston| Los Angeles| New York)?/g,
    /[A-Z][a-z]+ University[^\n]*/g,
    /UMass Boston/g,
    /UMass\s+Boston/g,
    /[A-Z]{2,} - [^\n]+/g,
    /[A-Z][a-z]+ College[^\n]*/g,
    /[A-Z][a-z]+ Institute[^\n]*/g,
  ];

  for (const pattern of universityPatterns) {
    const matches = rawText.match(pattern) || [];
    for (const match of matches) {
      let cleaned = match.trim();
      
      // Clean up common suffixes
      cleaned = cleaned.replace(/\s*·\s*Contact info.*$/i, '');
      cleaned = cleaned.replace(/\s*Connect.*$/i, '');
      
      if (cleaned.length > 5 && cleaned.length < 100 &&
        !skipWords.some(skip => cleaned.toLowerCase().includes(skip)) &&
        (['university', 'college', 'institute', 'school', 'umass', 'mit', 'stanford', 'harvard', 'berkeley'].some(word => cleaned.toLowerCase().includes(word)) ||
         /^UMass/i.test(cleaned))) {
        if (!universitiesFound.includes(cleaned)) {
          universitiesFound.push(cleaned);
        }
      }
    }
  }

  // Look in Education section specifically
  const educationSection = rawText.match(/Education[\n\s]+([^\n]+(?:\n[^\n]+)?)/i);
  if (educationSection) {
    const eduText = educationSection[1];
    // Try to extract university name from education section
    const eduPatterns = [
      /([A-Z][a-zA-Z\s-]+(?:University|College|Institute|UMass)[^\n]*)/,
      /UMass\s+Boston/,
      /University of [A-Z][a-zA-Z\s-]+/,
    ];
    
    for (const pattern of eduPatterns) {
      const match = eduText.match(pattern);
      if (match) {
        let uni = match[1] || match[0];
        uni = uni.trim();
        if (uni.length > 5 && uni.length < 100 && 
            !skipWords.some(skip => uni.toLowerCase().includes(skip))) {
          if (!universitiesFound.includes(uni)) {
            universitiesFound.unshift(uni); // Prioritize education section
          }
        }
      }
    }
  }

  // Normalize "UMass Boston" to "University of Massachusetts Boston"
  const normalized = universitiesFound.map(uni => {
    if (/^UMass\s+Boston$/i.test(uni)) {
      return "University of Massachusetts Boston";
    }
    return uni;
  });

  // Remove duplicates and return
  const unique = [];
  for (const uni of normalized) {
    if (!unique.includes(uni)) {
      unique.push(uni);
    }
  }

  return unique.length > 0 ? unique.slice(0, 2).join("; ") : null;
}

/**
 * Get education information with enhanced extraction
 */
function getEducationInfo(educationList, rawText = "") {
  if (!educationList || educationList.length === 0) {
    // Still try to extract from raw_text
    if (rawText) {
      const extractedUni = extractUniversityFromRawText(rawText, []);
      return [extractedUni, null, null, null];
    }
    return [null, null, null, null];
  }

  const universities = [];
  const fields = [];
  const degrees = [];
  let undergradYear = null;

  for (const edu of educationList) {
    const school = edu.school || "";
    const field = edu.field_of_study || "";
    const degree = edu.degree || "";
    const dateRange = edu.date_range || "";

    // Extract university name from school field
    if (school && !/^\d{4}/.test(school.trim())) {
      if (/[A-Za-z]/.test(school)) {
        const skipWords = ['activities', 'societies', 'regents', 'chancellor', 'pioneer', 'robot', 'equipped', 'laser', 'scans', 'sonar', 'wheel', 'encoders'];
        if (!skipWords.some(skip => school.toLowerCase().includes(skip)) &&
          school.length < 100 &&
          (['university', 'college', 'institute', 'school', 'umass'].some(word => school.toLowerCase().includes(word)) || school.split(/\s+/).length <= 5)) {
          universities.push(school);
        }
      }
    }

    if (field) fields.push(field);
    if (degree) degrees.push(degree);

    // Find undergrad graduation year
    if (/Bachelor|B\.S\.|B\.A\.|undergrad/i.test(degree)) {
      if (dateRange) {
        const years = dateRange.match(/\d{4}/g);
        if (years && years.length > 0) {
          undergradYear = parseInt(years[years.length - 1], 10);
        }
      } else if (school) {
        const years = school.match(/\d{4}/g);
        if (years && years.length > 0) {
          undergradYear = parseInt(years[years.length - 1], 10);
        }
      }
    }
  }

  // Always try to extract from raw_text (even if we found some)
  if (rawText) {
    const extractedUni = extractUniversityFromRawText(rawText, educationList);
    if (extractedUni) {
      // Add to universities, prioritizing raw_text extraction
      const parts = extractedUni.split(';').map(u => u.trim());
      for (const part of parts) {
        if (!universities.includes(part) && !/^\d{4}/.test(part)) {
          universities.unshift(part);
        }
      }
    }
  }

  // Filter out date ranges and invalid entries
  const filteredUniversities = universities.filter(uni => {
    const trimmed = uni.trim();
    return !/^\d{4}/.test(trimmed) &&
      !/^Sep \d{4}/.test(trimmed) &&
      !/^\d{4} - \d{4}/.test(trimmed) &&
      trimmed.length >= 5 && trimmed.length <= 100;
  });

  const university = filteredUniversities.length > 0 ? filteredUniversities.join("; ") : null;
  const fieldsOfStudy = fields.length > 0 ? fields.join("; ") : null;
  const degreesStr = degrees.length > 0 ? degrees.join("; ") : null;

  return [university, fieldsOfStudy, degreesStr, undergradYear];
}

/**
 * Check if profile is valid
 */
function isValidProfile(data) {
  const personalInfo = data.personal_info || {};
  const name = personalInfo.name || "";

  const invalidNames = [
    "Join LinkedIn",
    "Accessibility User Agreement",
    "LinkedIn Member",
    "User Agreement"
  ];

  if (invalidNames.some(invalid => name.includes(invalid))) {
    return false;
  }

  const experience = data.experience || [];
  const education = data.education || [];

  if (experience.length === 0 && education.length === 0) {
    const rawText = data.raw_text || "";
    const location = personalInfo.location || "";

    if (name && name.length > 2 && !invalidNames.some(invalid => name.includes(invalid))) {
      if (location && location.length > 5) {
        return true;
      } else if (rawText && rawText.length > 500) {
        return true;
      }
    }
    return false;
  }

  return true;
}

/**
 * Clean field value
 */
function cleanField(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  const cleaned = String(value).replace(/[\n\r]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned;
}

/**
 * Extract and clean location from profile data - Enhanced
 */
function extractLocation(data, rawText) {
  let location = data.personal_info?.location || "";

  // If location has newlines, try to extract the proper location
  if (location && location.includes('\n')) {
    const parts = location.split('\n').map(p => p.trim()).filter(p => p);
    
    // Look for the part that looks like a proper location (has commas)
    for (const part of parts) {
      if (part.includes(',') && part.length > 10) {
        const commaParts = part.split(',');
        if (commaParts.length >= 2) {
          // Check if it looks like a location
          const lastPart = commaParts[commaParts.length - 1].trim();
          if (lastPart.includes('United States') || lastPart.length === 2 || 
              ['California', 'New York', 'Massachusetts', 'Texas', 'Florida', 'Washington'].some(state => lastPart.includes(state))) {
            location = part;
            break;
          }
        }
      }
    }
    
    // If no comma-separated location found, try to find one in raw_text
    if (!location.includes(',')) {
      location = "";
    }
  }

  // Try to extract from raw_text
  if (rawText && (!location || location.length < 10 || !location.includes(','))) {
    const locationPatterns = [
      /Los Angeles, California, United States/,
      /New York, New York, United States/,
      /Seattle, Washington, United States/,
      /([A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+,\s+United States)/,
      /([A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+)/,
    ];

    for (const pattern of locationPatterns) {
      const match = rawText.substring(0, 3000).match(pattern);
      if (match) {
        const potentialLocation = match[0] || match[1];
        const parts = potentialLocation.split(',');
        if (parts.length >= 2 && potentialLocation.length > 10) {
          const skipWords = ['contact info', 'connections', 'connect message', 'he/him', 'she/her', 'they/them', 'sign in', 'message', 'more', 'university', 'college'];
          if (!skipWords.some(skip => potentialLocation.toLowerCase().includes(skip))) {
            location = potentialLocation.trim();
            break;
          }
        }
      }
    }
  }

  // Final cleanup
  if (location) {
    location = location.replace(/[\n\r]/g, " ").trim();
    
    // Remove university/company names from location
    const skipPatterns = [
      'university', 'college', 'massachusetts boston', 'umass',
      'treelab', 'nexus', 'human capital',
    ];
    
    for (const pattern of skipPatterns) {
      if (location.toLowerCase().includes(pattern)) {
        // Try to extract just the location part after the skip pattern
        const index = location.toLowerCase().indexOf(pattern);
        if (index > 0) {
          // Take the part after the pattern
          location = location.substring(index + pattern.length).trim();
          // Remove leading commas/spaces
          location = location.replace(/^[,\s]+/, '').trim();
        } else if (index === 0) {
          // Pattern is at start, remove it
          location = location.substring(pattern.length).trim();
          location = location.replace(/^[,\s]+/, '').trim();
        }
      }
    }
    
    // Normalize whitespace
    location = location.replace(/\s+/g, " ").trim();
    
    // Validate it has proper structure
    if (location && !location.includes(',') && location.length < 20) {
      // Might be incomplete, try to find better one
      if (rawText) {
        const betterMatch = rawText.match(/([A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+,\s+United States)/);
        if (betterMatch) {
          location = betterMatch[1];
        }
      }
    }
  }

  return location || "";
}

/**
 * Extract name from raw text if parsed name is invalid
 */
function extractName(data, rawText) {
  let fullName = data.personal_info?.name || "";

  const invalidNames = ["Harvard Business Review", "User Agreement", "Accessibility", "Me For Business",
    "Rutgers University", "Connect Message More", "University", "College", "Nexus Lilia Tsalenk"];

  if (!fullName || fullName.length < 3 || invalidNames.some(invalid => fullName.includes(invalid)) ||
    fullName.toLowerCase().endsWith('university') || fullName.toLowerCase().endsWith('college') ||
    fullName.includes("Nexus")) {

    const namePatterns = [
      /Me For Business\n([A-Z][a-z]+(?: [A-Z][a-zñóíéáú\.]+)+(?: [A-Z][a-zñóíéáú\.]+)?)\n/,
      /My Network Jobs Messaging[^\n]+\n([A-Z][a-z]+(?: [A-Z][a-zñóíéáú\.]+)+(?: [A-Z][a-zñóíéáú\.]+)?)\n/,
      /^([A-Z][a-z]+(?: [A-Z][a-zñóíéáú\.]+)+(?: [A-Z][a-zñóíéáú\.]+)?)\n/,
    ];

    const skipPhrases = ['home', 'network', 'jobs', 'messaging', 'notifications', 'me for business',
      'user agreement', 'accessibility', 'rutgers university', 'university of', 'connect message more',
      'he/him', 'she/her'];

    for (const pattern of namePatterns) {
      const matches = rawText.substring(0, 1000).match(pattern);
      if (matches) {
        const potentialName = matches[1].trim();
        const nameParts = potentialName.split(/\s+/);
        if (potentialName.length > 3 && potentialName.length < 50 &&
          !skipPhrases.some(skip => potentialName.toLowerCase().includes(skip)) &&
          nameParts.length >= 2 && nameParts.length <= 4 &&
          !potentialName.toLowerCase().startsWith('head of') &&
          !potentialName.toLowerCase().startsWith('director') &&
          !potentialName.toLowerCase().endsWith('university') &&
          !potentialName.toLowerCase().endsWith('college')) {
          fullName = potentialName;
          break;
        }
      }
    }
  }

  return fullName || "";
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract companies from experience list
 */
function extractCompanies(experienceList, rawText = "") {
  const companies = [];
  const seen = new Set();
  
  for (const exp of experienceList) {
    const duration = exp.duration || "";
    const title = exp.title || "";
    let company = extractCompanyFromFields(exp, rawText, title);
    
    if (company && isValidCompanyName(company)) {
      const companyLower = company.toLowerCase().trim();
      if (!seen.has(companyLower)) {
        seen.add(companyLower);
        companies.push(company);
      }
    }
  }
  
  return companies.slice(0, 10); // Limit to 10 companies
}

/**
 * Extract date range and tenure from duration string
 */
function extractDateRangeAndTenure(durationStr) {
  if (!durationStr) {
    return { startDate: null, endDate: null, years: null, months: null };
  }
  
  let startDate = null;
  let endDate = null;
  let years = null;
  let months = null;
  
  // Pattern: "Aug 2025 - Present" or "Aug 2025 - Jul 2025"
  const datePattern1 = /([A-Z][a-z]{2})\s+(\d{4})\s+-\s+(?:Present|([A-Z][a-z]{2})\s+(\d{4}))/;
  const match1 = durationStr.match(datePattern1);
  
  if (match1) {
    const startMonth = match1[1];
    const startYear = match1[2];
    startDate = `${startMonth} ${startYear}`;
    
    if (match1[3]) {
      const endMonth = match1[3];
      const endYear = match1[4];
      endDate = `${endMonth} ${endYear}`;
    } else {
      endDate = "Present";
    }
  } else {
    // Pattern: "2020 - Present" or "2020 - 2018" (year only)
    const datePattern2 = /(\d{4})\s+-\s+(?:Present|(\d{4}))/;
    const match2 = durationStr.match(datePattern2);
    if (match2) {
      startDate = match2[1];
      if (match2[2]) {
        endDate = match2[2];
      } else {
        endDate = "Present";
      }
    }
  }
  
  // Extract years and months
  const yearMatch = durationStr.match(/(\d+)\s+(?:yr|yrs)/i);
  const monthMatch = durationStr.match(/(\d+)\s+(?:mos?|months?)/i);
  
  if (yearMatch) {
    years = parseInt(yearMatch[1], 10);
  }
  if (monthMatch) {
    months = parseInt(monthMatch[1], 10);
  }
  
  return { startDate, endDate, years, months };
}

/**
 * Extract companies from experience list
 */
function extractCompanies(experienceList, rawText = "") {
  const companies = [];
  const seen = new Set();
  
  for (const exp of experienceList) {
    const duration = exp.duration || "";
    const title = exp.title || "";
    let company = extractCompanyFromFields(exp, rawText, title);
    
    if (company && isValidCompanyName(company)) {
      const companyLower = company.toLowerCase().trim();
      if (!seen.has(companyLower)) {
        seen.add(companyLower);
        companies.push(company);
      }
    }
  }
  
  return companies.slice(0, 10); // Limit to 10 companies
}

/**
 * Extract date range and tenure from duration string
 */
function extractDateRangeAndTenure(durationStr) {
  if (!durationStr) {
    return { startDate: null, endDate: null, years: null, months: null };
  }
  
  let startDate = null;
  let endDate = null;
  let years = null;
  let months = null;
  
  // Pattern: "Aug 2025 - Present" or "Aug 2025 - Jul 2025"
  const datePattern1 = /([A-Z][a-z]{2})\s+(\d{4})\s+-\s+(?:Present|([A-Z][a-z]{2})\s+(\d{4}))/;
  const match1 = durationStr.match(datePattern1);
  
  if (match1) {
    const startMonth = match1[1];
    const startYear = match1[2];
    startDate = `${startMonth} ${startYear}`;
    
    if (match1[3]) {
      const endMonth = match1[3];
      const endYear = match1[4];
      endDate = `${endMonth} ${endYear}`;
    } else {
      endDate = "Present";
    }
  } else {
    // Pattern: "2020 - Present" or "2020 - 2018" (year only)
    const datePattern2 = /(\d{4})\s+-\s+(?:Present|(\d{4}))/;
    const match2 = durationStr.match(datePattern2);
    if (match2) {
      startDate = match2[1];
      if (match2[2]) {
        endDate = match2[2];
      } else {
        endDate = "Present";
      }
    }
  }
  
  // Extract years and months
  const yearMatch = durationStr.match(/(\d+)\s+(?:yr|yrs)/i);
  const monthMatch = durationStr.match(/(\d+)\s+(?:mos?|months?)/i);
  
  if (yearMatch) {
    years = parseInt(yearMatch[1], 10);
  }
  if (monthMatch) {
    months = parseInt(monthMatch[1], 10);
  }
  
  return { startDate, endDate, years, months };
}

/**
 * Process a single profile JSON document - Enhanced with new column structure
 * Now handles comprehensive_data array format from v2.0.0-comprehensive extractor
 */
function processProfileDocument(data) {
  if (!isValidProfile(data)) {
    return null;
  }

  // Handle new comprehensive_data format if available
  let experienceList = data.experience || [];
  let educationList = data.education || [];
  let skillsList = data.skills || [];
  let certificationsList = data.certifications || [];
  let languagesList = data.languages || [];
  let projectsList = data.projects || [];
  let publicationsList = data.publications || [];
  let volunteerList = data.volunteer_experience || [];
  let coursesList = data.courses || [];
  let honorsList = data.honors_awards || [];
  let organizationsList = data.organizations || [];
  let patentsList = data.patents || [];
  let testScoresList = data.test_scores || [];
  let recommendationsList = data.recommendations || [];
  let interestsData = data.interests || { companies: [], groups: [], causes: [] };
  let personalInfo = data.personal_info || {};
  let activityData = data.activity || {};
  let contactInfo = data.contact_info || {};
  let socialLinks = data.social_links || [];
  
  // Extract current_employer and past_employers if available (from comprehensive extraction)
  let currentEmployerData = data.current_employer || null;
  let pastEmployersData = data.past_employers || [];
  let employmentSummaryData = data.employment_summary_array || [];

  // If comprehensive_data exists, extract from it for maximum information
  if (data.comprehensive_data && Array.isArray(data.comprehensive_data)) {
    // Extract experience from comprehensive_data
    const expItems = data.comprehensive_data.filter(item => item.category === 'experience');
    if (expItems.length > 0) {
      experienceList = expItems.map(item => item.data);
    }

    // Extract education from comprehensive_data
    const eduItems = data.comprehensive_data.filter(item => item.category === 'education');
    if (eduItems.length > 0) {
      educationList = eduItems.map(item => item.data);
    }

    // Extract skills from comprehensive_data
    const skillItems = data.comprehensive_data.filter(item => item.category === 'skills');
    if (skillItems.length > 0) {
      skillsList = skillItems.map(item => item.data);
    }

    // Extract certifications from comprehensive_data
    const certItems = data.comprehensive_data.filter(item => item.category === 'certifications');
    if (certItems.length > 0) {
      certificationsList = certItems.map(item => item.data);
    }

    // Extract languages from comprehensive_data
    const langItems = data.comprehensive_data.filter(item => item.category === 'languages');
    if (langItems.length > 0) {
      languagesList = langItems.map(item => item.data);
    }

    // Extract projects from comprehensive_data
    const projItems = data.comprehensive_data.filter(item => item.category === 'projects');
    if (projItems.length > 0) {
      projectsList = projItems.map(item => item.data);
    }

    // Extract publications from comprehensive_data
    const pubItems = data.comprehensive_data.filter(item => item.category === 'publications');
    if (pubItems.length > 0) {
      publicationsList = pubItems.map(item => item.data);
    }

    // Extract volunteer experience from comprehensive_data
    const volItems = data.comprehensive_data.filter(item => item.category === 'volunteer_experience');
    if (volItems.length > 0) {
      volunteerList = volItems.map(item => item.data);
    }

    // Extract courses from comprehensive_data
    const courseItems = data.comprehensive_data.filter(item => item.category === 'courses');
    if (courseItems.length > 0) {
      coursesList = courseItems.map(item => item.data);
    }

    // Extract honors & awards from comprehensive_data
    const honorItems = data.comprehensive_data.filter(item => item.category === 'honors_awards');
    if (honorItems.length > 0) {
      honorsList = honorItems.map(item => item.data);
    }

    // Extract organizations from comprehensive_data
    const orgItems = data.comprehensive_data.filter(item => item.category === 'organizations');
    if (orgItems.length > 0) {
      organizationsList = orgItems.map(item => item.data);
    }

    // Extract patents from comprehensive_data
    const patentItems = data.comprehensive_data.filter(item => item.category === 'patents');
    if (patentItems.length > 0) {
      patentsList = patentItems.map(item => item.data);
    }

    // Extract test scores from comprehensive_data
    const testItems = data.comprehensive_data.filter(item => item.category === 'test_scores');
    if (testItems.length > 0) {
      testScoresList = testItems.map(item => item.data);
    }

    // Extract recommendations from comprehensive_data
    const recItems = data.comprehensive_data.filter(item => item.category === 'recommendations');
    if (recItems.length > 0) {
      recommendationsList = recItems.map(item => item.data);
    }

    // Extract interests from comprehensive_data
    const interestItems = data.comprehensive_data.filter(item => item.category === 'interests');
    if (interestItems.length > 0) {
      interestsData = {
        companies: interestItems.filter(item => item.type === 'company_interest').map(item => item.data.name || item.data),
        groups: interestItems.filter(item => item.type === 'group_interest').map(item => item.data.name || item.data),
        causes: interestItems.filter(item => item.type === 'cause_interest').map(item => item.data.name || item.data)
      };
    }

    // Extract personal info from comprehensive_data
    const personalInfoItem = data.comprehensive_data.find(item => item.category === 'personal_info');
    if (personalInfoItem && personalInfoItem.data) {
      personalInfo = personalInfoItem.data;
    }

    // Extract activity from comprehensive_data
    const activityItem = data.comprehensive_data.find(item => item.category === 'activity');
    if (activityItem && activityItem.data) {
      activityData = activityItem.data;
    }

    // Extract contact info from comprehensive_data
    const contactItem = data.comprehensive_data.find(item => item.category === 'contact_info');
    if (contactItem && contactItem.data) {
      contactInfo = contactItem.data;
    }

    // Extract social links from comprehensive_data
    const socialItems = data.comprehensive_data.filter(item => item.category === 'social_links');
    if (socialItems.length > 0) {
      socialLinks = socialItems.map(item => item.data);
    }

    // Extract current_employer from comprehensive_data
    const currentEmployerItems = data.comprehensive_data.filter(item => 
      item.category === 'employment' && item.type === 'current_employer'
    );
    if (currentEmployerItems.length > 0 && currentEmployerItems[0].data) {
      currentEmployerData = currentEmployerItems[0].data;
    }

    // Extract past_employers from comprehensive_data
    const pastEmployerItems = data.comprehensive_data.filter(item => 
      item.category === 'employment' && item.type === 'past_employer'
    );
    if (pastEmployerItems.length > 0) {
      pastEmployersData = pastEmployerItems.map(item => item.data);
    }

    // Extract employment_summary from comprehensive_data
    const employmentSummaryItems = data.comprehensive_data.filter(item => 
      item.category === 'employment' && item.type === 'employment_summary'
    );
    if (employmentSummaryItems.length > 0) {
      employmentSummaryData = employmentSummaryItems.map(item => item.data);
    }
  }

  const rawText = data.raw_text || data.raw_html || "";

  // Extract LinkedIn URL
  let linkedinUrl = getLinkedInUrlFromJson(data);
  
  // Try to get URL from personal_info if available
  if (!linkedinUrl && personalInfo && personalInfo.profile_url) {
    linkedinUrl = personalInfo.profile_url;
  }

  // Extract personal info
  const fullName = extractName(data, rawText);
  // Use personalInfo from comprehensive_data if available
  const extractedName = personalInfo.name || fullName;
  let location = extractLocation(data, rawText);
  // Use personalInfo location from comprehensive_data if available
  if (personalInfo.location && !location) {
    location = personalInfo.location;
  }
  
  // PRIORITIZE: Use current_employer from comprehensive_data if available
  let currentCompany = null;
  let currentTitle = null;
  let yearsInCurrent = null;
  let currentDateTenure = { startDate: null, endDate: null, years: null, months: null };
  
  if (currentEmployerData) {
    // Use comprehensive current_employer data
    currentCompany = currentEmployerData.company || null;
    currentTitle = currentEmployerData.title || null;
    yearsInCurrent = currentEmployerData.years_in_tenure || null;
    currentDateTenure = {
      startDate: currentEmployerData.start_date || null,
      endDate: currentEmployerData.end_date || null,
      years: currentEmployerData.years_in_tenure || null,
      months: currentEmployerData.months_in_tenure || null
    };
  } else {
    // Fallback to old extraction method - check experience list for current position
    let currentExp = null;
    
    // First, try to find experience with is_current flag
    for (const exp of experienceList) {
      if (exp.is_current === true) {
        currentExp = exp;
        break;
      }
    }
    
    // If not found, try to find by "Present" in duration
    if (!currentExp) {
      for (const exp of experienceList) {
        const duration = exp.duration || "";
        if (duration && /Present/i.test(duration)) {
          currentExp = exp;
          break;
        }
      }
    }
    
    // If still not found, check first experience entry for recent dates
    if (!currentExp && experienceList.length > 0) {
      const firstExp = experienceList[0];
      const duration = firstExp.duration || "";
      if (duration) {
        const yearPattern = /\d{4}/g;
        const years = duration.match(yearPattern) || [];
        if (years.length > 0) {
          const endYear = parseInt(years[years.length - 1], 10);
          const currentYear = new Date().getFullYear();
          // If end year is current year or future, likely current position
          if (endYear >= currentYear) {
            currentExp = firstExp;
          }
        }
      }
    }
    
    if (currentExp) {
      // Extract company from current experience
      const title = currentExp.title || "";
      currentTitle = title;
      currentCompany = extractCompanyFromFields(currentExp, rawText, title);
      
      // Use detailed duration if available
      if (currentExp.start_date || currentExp.end_date) {
        currentDateTenure = {
          startDate: currentExp.start_date || null,
          endDate: currentExp.end_date || null,
          years: currentExp.years_in_tenure || null,
          months: currentExp.months_in_tenure || null
        };
        yearsInCurrent = currentExp.years_in_tenure || null;
      } else {
        // Parse from duration string
        const duration = currentExp.duration || "";
        currentDateTenure = extractDateRangeAndTenure(duration);
        const [, , extractedYears] = parseDuration(duration);
        yearsInCurrent = extractedYears;
      }
    } else {
      // Last resort: use getCurrentCompany function
      const [extractedCompany, extractedTitle, extractedYears] = getCurrentCompany(experienceList, rawText);
      currentCompany = extractedCompany;
      currentTitle = extractedTitle;
      yearsInCurrent = extractedYears;
      
      // Try to get date range from first experience entry
      if (experienceList.length > 0) {
        const firstExp = experienceList[0];
        const duration = firstExp.duration || "";
        if (duration && /Present/i.test(duration)) {
          currentDateTenure = extractDateRangeAndTenure(duration);
        }
      }
    }
  }
  
  // Fallback: Try to extract company name from location if currentCompany is still empty
  // Sometimes LinkedIn puts company name in location field (e.g., "Atomic Invest Stanford, California")
  if (!currentCompany && location) {
    const locationParts = location.split(',');
    if (locationParts.length > 0) {
      const firstPart = locationParts[0].trim();
      // Check if first part looks like a company name (not a standard location)
      const locationKeywords = ['united states', 'california', 'new york', 'texas', 'georgia', 
                                'washington', 'massachusetts', 'boston', 'los angeles', 
                                'san francisco', 'seattle', 'austin', 'atlanta', 'san jose', 
                                'bay area', 'stanford', 'education'];
      const firstLower = firstPart.toLowerCase();
      if (!locationKeywords.some(keyword => firstLower.includes(keyword)) && 
          firstPart.length > 3 && firstPart.length < 50 &&
          /^[A-Z]/.test(firstPart)) {
        // Might be a company name
        if (isValidCompanyName(firstPart) && !isDateOrTenureOnly(firstPart)) {
          currentCompany = firstPart;
        }
      }
    }
  }
  
  // PRIORITIZE: Use past_employers from comprehensive_data if available
  let prevTargetCompany = null;
  let prevTitle = null;
  let prevStartYear = null;
  let prevEndYear = null;
  let prevDateTenure = { startDate: null, endDate: null, years: null, months: null };
  
  if (pastEmployersData && pastEmployersData.length > 0) {
    // Use first past employer (most recent)
    const firstPastEmployer = pastEmployersData[0];
    prevTargetCompany = firstPastEmployer.company || null;
    prevTitle = firstPastEmployer.title || null;
    prevStartYear = firstPastEmployer.start_year || null;
    prevEndYear = firstPastEmployer.end_year || null;
    prevDateTenure = {
      startDate: firstPastEmployer.start_date || null,
      endDate: firstPastEmployer.end_date || null,
      years: firstPastEmployer.years_in_tenure || null,
      months: firstPastEmployer.months_in_tenure || null
    };
  } else {
    // Fallback to old extraction method
    const [extractedPrevCompany, extractedPrevTitle, extractedPrevStartYear, extractedPrevEndYear] = getPreviousTargetCompany(experienceList);
    prevTargetCompany = extractedPrevCompany;
    prevTitle = extractedPrevTitle;
    prevStartYear = extractedPrevStartYear;
    prevEndYear = extractedPrevEndYear;
    
    // Get previous target company date range and tenure from experience list
    let prevExp = null;
    for (let i = 1; i < experienceList.length; i++) {
      const exp = experienceList[i];
      const duration = exp.duration || "";
      if (duration && !/Present/i.test(duration)) {
        prevExp = exp;
        break;
      }
    }
    const prevDuration = prevExp ? (prevExp.duration || "") : "";
    prevDateTenure = extractDateRangeAndTenure(prevDuration);
  }
  
  // Format tenure at previous target
  let tenurePrevious = "";
  if (prevStartYear && prevEndYear) {
    tenurePrevious = `${prevStartYear} to ${prevEndYear}`;
  } else if (prevStartYear) {
    tenurePrevious = String(prevStartYear);
  } else if (prevDateTenure.startDate && prevDateTenure.endDate) {
    tenurePrevious = `${prevDateTenure.startDate} to ${prevDateTenure.endDate}`;
  }
  
  const previousTitles = getPreviousTitles(experienceList);
  const totalYears = calculateTotalYearsExperience(experienceList);
  const employmentHistory = getEmploymentHistory(experienceList, rawText);
  
  // Extract companies as array - prioritize from employment_summary if available
  let companies = [];
  if (employmentSummaryData && employmentSummaryData.length > 0) {
    // Extract companies from employment summary (already aggregated)
    companies = employmentSummaryData.map(summary => summary.company).filter(Boolean);
  } else {
    // Fallback to extracting from experience list
    companies = extractCompanies(experienceList, rawText);
  }
  
  // Also extract companies from interests if available
  if (interestsData.companies && interestsData.companies.length > 0) {
    interestsData.companies.forEach(comp => {
      const compName = typeof comp === 'string' ? comp : comp.name;
      if (compName && !companies.includes(compName)) {
        companies.push(compName);
      }
    });
  }

  // Extract education (now using comprehensive_data if available)
  const [university, fieldsOfStudy, degrees, undergradYear] = getEducationInfo(educationList, rawText);
  
  // Parse universities into array
  const universities = university ? university.split(';').map(u => u.trim()).filter(u => u) : [];
  
  // Parse fields of study into array
  const fields = fieldsOfStudy ? fieldsOfStudy.split(';').map(f => f.trim()).filter(f => f) : [];

  // Extract additional comprehensive data
  const certifications = certificationsList.map(cert => cert.name || cert.title || JSON.stringify(cert)).filter(Boolean);
  const languages = languagesList.map(lang => lang.name || JSON.stringify(lang)).filter(Boolean);
  const projects = projectsList.map(proj => proj.name || proj.title || JSON.stringify(proj)).filter(Boolean);
  const publications = publicationsList.map(pub => pub.title || JSON.stringify(pub)).filter(Boolean);
  const volunteerOrgs = volunteerList.map(vol => vol.organization || JSON.stringify(vol)).filter(Boolean);
  const courses = coursesList.map(course => course.name || course.title || JSON.stringify(course)).filter(Boolean);
  const honors = honorsList.map(honor => honor.title || JSON.stringify(honor)).filter(Boolean);
  const organizations = organizationsList.map(org => org.name || JSON.stringify(org)).filter(Boolean);
  const patents = patentsList.map(patent => patent.title || JSON.stringify(patent)).filter(Boolean);
  const testScores = testScoresList.map(test => `${test.name || 'Test'}: ${test.score || ''}`).filter(Boolean);
  
  // Extract contact info
  const emails = contactInfo.emails || [];
  const phones = contactInfo.phones || [];
  
  // Extract social links
  const socialLinkUrls = socialLinks.map(link => link.href || link.url || '').filter(Boolean);

  // Build result object with all new columns - ensure all fields are populated
  // Use arrays for structured data to preserve all information
  const result = {
    "Linkedin URL": cleanField(linkedinUrl) || "",
    "Full Name": cleanField(extractedName || fullName) || "",
    "Current Company": cleanField(currentCompany) || "",
    "Current Company Start Date": cleanField(currentDateTenure.startDate) || "",
    "Current Company End Date": cleanField(currentDateTenure.endDate) || "",
    "Current Company Tenure Years": (currentDateTenure.years !== null && currentDateTenure.years !== undefined) 
      ? String(currentDateTenure.years) 
      : ((yearsInCurrent !== null && yearsInCurrent !== undefined) ? String(yearsInCurrent) : ""),
    "Current Company Tenure Months": (currentDateTenure.months !== null && currentDateTenure.months !== undefined) 
      ? String(currentDateTenure.months) 
      : "",
    "Job title": cleanField(currentTitle) || "",
    "Location": cleanField(location) || "",
    "Previous target company": cleanField(prevTargetCompany) || "",
    "Previous target company Start Date": cleanField(prevDateTenure.startDate) || "",
    "Previous target company End Date": cleanField(prevDateTenure.endDate) || "",
    "Previous target company Tenure Years": (prevDateTenure.years !== null && prevDateTenure.years !== undefined) 
      ? String(prevDateTenure.years) 
      : "",
    "Previous target company Tenure Months": (prevDateTenure.months !== null && prevDateTenure.months !== undefined) 
      ? String(prevDateTenure.months) 
      : "",
    "Tenure at previous target (Year start to year end)": cleanField(tenurePrevious) || "",
    "Companies": companies, // Array - will be properly handled by API
    "Previous title(s)": cleanField(previousTitles),
    "Total Years full time experience": totalYears ? String(totalYears) : "",
    "Universities": universities, // Array - will be properly handled by API
    "Fields of Study": fields, // Array - will be properly handled by API
    "Degrees": cleanField(degrees),
    "Year of Undergrad Graduation": undergradYear ? String(undergradYear) : "",
    "Certifications": certifications.length > 0 ? certifications.join("; ") : "",
    "Languages": languages.length > 0 ? languages.join("; ") : "",
    "Projects": projects.length > 0 ? projects.join("; ") : "",
    "Publications": publications.length > 0 ? publications.join("; ") : "",
    "Volunteer Organizations": volunteerOrgs.length > 0 ? volunteerOrgs.join("; ") : "",
    "Courses": courses.length > 0 ? courses.join("; ") : "",
    "Honors & Awards": honors.length > 0 ? honors.join("; ") : "",
    "Organizations": organizations.length > 0 ? organizations.join("; ") : "",
    "Patents": patents.length > 0 ? patents.join("; ") : "",
    "Test Scores": testScores.length > 0 ? testScores.join("; ") : "",
    "Emails": emails.length > 0 ? emails.join("; ") : "",
    "Phones": phones.length > 0 ? phones.join("; ") : "",
    "Social Links": socialLinkUrls.length > 0 ? socialLinkUrls.join("; ") : "",
    "Skills Count": skillsList.length > 0 ? String(skillsList.length) : "",
    "Experience Count": experienceList.length > 0 ? String(experienceList.length) : "",
    "Education Count": educationList.length > 0 ? String(educationList.length) : "",
    "Raw Data": JSON.stringify(data) // Store original JSON including comprehensive_data - preserve all data
  };
  
  // Add individual company columns (Company 1, Company 2, etc.) for compatibility
  for (let i = 0; i < 10; i++) {
    result[`Company ${i + 1}`] = companies[i] || "";
  }
  
  // Add individual university columns (University 1, University 2, etc.)
  for (let i = 0; i < 10; i++) {
    result[`University ${i + 1}`] = universities[i] || "";
  }
  
  // Add individual field of study columns (Field of Study 1, Field of Study 2, etc.)
  for (let i = 0; i < 10; i++) {
    result[`Field of Study ${i + 1}`] = fields[i] || "";
  }
  
  return result;
}

/**
 * Process multiple profile documents
 */
function processProfileDocuments(documents) {
  if (!Array.isArray(documents)) {
    return [];
  }

  const processed = [];
  for (const doc of documents) {
    try {
      const processedDoc = processProfileDocument(doc);
      if (processedDoc) {
        processed.push(processedDoc);
      }
    } catch (error) {
      console.error("Error processing profile document:", error);
      continue;
    }
  }

  return processed;
}

/**
 * Convert processed profiles to CSV format - Updated with new column structure
 */
function convertToCSV(processedProfiles) {
  if (!processedProfiles || processedProfiles.length === 0) {
    return "";
  }

  // Define columns matching the new CSV structure
  const columns = [
    "Linkedin URL",
    "Full Name",
    "Current Company",
    "Current Company Start Date",
    "Current Company End Date",
    "Current Company Tenure Years",
    "Current Company Tenure Months",
    "Job title",
    "Location",
    "Previous target company",
    "Previous target company Start Date",
    "Previous target company End Date",
    "Previous target company Tenure Years",
    "Previous target company Tenure Months",
    "Tenure at previous target (Year start to year end)",
    "Company 1",
    "Company 2",
    "Company 3",
    "Company 4",
    "Company 5",
    "Company 6",
    "Company 7",
    "Company 8",
    "Company 9",
    "Company 10",
    "Previous title(s)",
    "Total Years full time experience",
    "University 1",
    "University 2",
    "University 3",
    "University 4",
    "University 5",
    "University 6",
    "University 7",
    "University 8",
    "University 9",
    "University 10",
    "Field of Study 1",
    "Field of Study 2",
    "Field of Study 3",
    "Field of Study 4",
    "Field of Study 5",
    "Field of Study 6",
    "Field of Study 7",
    "Field of Study 8",
    "Field of Study 9",
    "Field of Study 10",
    "Degrees",
    "Year of Undergrad Graduation",
    "Certifications",
    "Languages",
    "Projects",
    "Publications",
    "Volunteer Organizations",
    "Courses",
    "Honors & Awards",
    "Organizations",
    "Patents",
    "Test Scores",
    "Emails",
    "Phones",
    "Social Links",
    "Skills Count",
    "Experience Count",
    "Education Count",
    "Core Roles",
    "Domains",
    "Submitted At",
    "Raw Data"
  ];

  function escapeCSV(value) {
    if (value === null || value === undefined) {
      return "";
    }
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join('; ');
    }
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const lines = [columns.map(escapeCSV).join(',')];
  for (const profile of processedProfiles) {
    const row = columns.map(col => {
      // Handle special cases
      if (col === "Submitted At") {
        return profile[col] || new Date().toISOString();
      }
      if (col === "Raw Data") {
        // Always include raw data - use provided or stringify the profile
        return profile[col] || JSON.stringify(profile);
      }
      // Ensure all fields are populated (even if empty string)
      const value = profile[col];
      if (value === null || value === undefined) {
        return "";
      }
      return escapeCSV(value);
    });
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

// Export functions
const ProfileProcessorExports = {
  processProfileDocument,
  processProfileDocuments,
  convertToCSV,
  getLinkedInUrlFromJson,
  parseDuration,
  calculateTotalYearsExperience,
  getCurrentCompany,
  getPreviousTargetCompany,
  getPreviousTitles,
  getEmploymentHistory,
  getEducationInfo,
  isValidProfile,
  cleanField,
  extractCompanies,
  extractDateRangeAndTenure
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileProcessorExports;
}

if (typeof window !== 'undefined') {
  window.ProfileProcessor = ProfileProcessorExports;
}

if (typeof self !== 'undefined') {
  self.ProfileProcessor = ProfileProcessorExports;
}

if (typeof globalThis !== 'undefined') {
  globalThis.ProfileProcessor = ProfileProcessorExports;
}
