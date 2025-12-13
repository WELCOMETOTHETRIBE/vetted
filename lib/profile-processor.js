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
 * Handles overlapping periods correctly by tracking date ranges
 */
function calculateTotalYearsExperience(experienceList) {
  if (!experienceList || experienceList.length === 0) {
    return null;
  }

  // Track all date ranges to avoid double-counting overlaps
  const dateRanges = [];
  
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

    // Get start and end dates
    const [startYear, endYear] = parseDuration(duration);
    const isPresent = /Present/i.test(duration);
    
    if (startYear) {
      const end = isPresent ? new Date().getFullYear() : (endYear || new Date().getFullYear());
      dateRanges.push({
        start: startYear,
        end: end,
        startMonth: exp.start_month || 1,
        endMonth: isPresent ? new Date().getMonth() + 1 : (exp.end_month || 12)
      });
    }
  }

  if (dateRanges.length === 0) {
    return null;
  }

  // Sort by start date
  dateRanges.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.startMonth - b.startMonth;
  });

  // Merge overlapping periods
  const mergedRanges = [];
  for (const range of dateRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push({ ...range });
      continue;
    }

    const lastRange = mergedRanges[mergedRanges.length - 1];
    
    // Check if ranges overlap or are adjacent
    const lastEndYear = lastRange.end;
    const lastEndMonth = lastRange.endMonth;
    const currentStartYear = range.start;
    const currentStartMonth = range.startMonth;
    
    // Convert to months for easier comparison
    const lastEndMonths = lastEndYear * 12 + lastEndMonth;
    const currentStartMonths = currentStartYear * 12 + currentStartMonth;
    
    // If current range starts before or at the same time as last range ends, merge them
    if (currentStartMonths <= lastEndMonths + 1) {
      // Merge: extend the last range to the later end date
      if (range.end > lastRange.end || (range.end === lastRange.end && range.endMonth > lastRange.endMonth)) {
        lastRange.end = range.end;
        lastRange.endMonth = range.endMonth;
      }
    } else {
      // No overlap, add as new range
      mergedRanges.push({ ...range });
    }
  }

  // Calculate total years from merged ranges
  let totalMonths = 0;
  for (const range of mergedRanges) {
    const startMonths = range.start * 12 + (range.startMonth || 1);
    const endMonths = range.end * 12 + (range.endMonth || 12);
    totalMonths += (endMonths - startMonths + 1); // +1 to include both start and end months
  }

  // Convert months to years (round to nearest year)
  const totalYears = Math.round(totalMonths / 12);

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
  
  // Check if it contains job title patterns (but allow if it's a valid company name with title words)
  // Only reject if it's clearly a job title, not a company name that happens to contain title words
  const trimmed = company.trim();
  const titleOnlyPatterns = [
    /^(Senior|Junior|Lead|Principal|Staff|Chief|Head|Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Associate|Executive|Vice President|VP|President|Founder|Co-founder|Co-Founder)\s+(Engineer|Developer|Designer|Manager|Director|Analyst|Specialist|Coordinator|Associate|Executive|Recruiter|Scientist|Architect|Consultant|Advisor|Strategist|Researcher|Writer|Editor|Producer|Coordinator|Representative|Assistant|Intern)$/i,
    /^(Software|Hardware|Frontend|Backend|Full.?Stack|DevOps|SRE|QA|Product|Marketing|Sales|Business|Data|Machine Learning|ML|AI|Security|Cloud|Infrastructure|Systems|Network|Database|Mobile|Web|UI|UX|Graphic|Visual|Content|Social Media|Growth|Operations|HR|Human Resources|Talent|Recruiting|Recruitment)\s+(Engineer|Developer|Designer|Manager|Director|Analyst|Specialist|Coordinator|Associate|Executive|Recruiter|Scientist|Architect|Consultant|Advisor|Strategist|Researcher|Writer|Editor|Producer|Coordinator|Representative|Assistant|Intern)$/i,
  ];
  
  // If it matches a title-only pattern and doesn't look like a company, reject it
  if (titleOnlyPatterns.some(pattern => pattern.test(trimmed)) && !trimmed.includes('Inc') && !trimmed.includes('LLC') && !trimmed.includes('Corp') && !trimmed.includes('Ltd') && trimmed.length < 40) {
    return false;
  }
  
  return !invalidPatterns.some(pattern => pattern.test(trimmed));
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
 * Check if text contains a job title pattern
 */
function containsJobTitle(text) {
  if (!text) return false;
  
  const titlePatterns = [
    /^(Senior|Junior|Lead|Principal|Staff|Chief|Head|Director|Manager|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Associate|Executive|Vice President|VP|President|Founder|Co-founder|Co-Founder)/i,
    /(Engineer|Developer|Designer|Manager|Director|Analyst|Specialist|Coordinator|Associate|Executive|Recruiter|Scientist|Architect|Consultant|Advisor|Strategist|Researcher|Writer|Editor|Producer|Coordinator|Representative|Assistant|Intern)$/i,
    /\b(Software|Hardware|Frontend|Backend|Full.?Stack|Full.?Stack|DevOps|SRE|QA|Product|Marketing|Sales|Business|Data|Machine Learning|ML|AI|Security|Cloud|Infrastructure|Systems|Network|Database|Mobile|Web|UI|UX|Graphic|Visual|Content|Social Media|Growth|Operations|HR|Human Resources|Talent|Recruiting|Recruitment)\s+(Engineer|Developer|Designer|Manager|Director|Analyst|Specialist|Coordinator|Associate|Executive|Recruiter|Scientist|Architect|Consultant|Advisor|Strategist|Researcher|Writer|Editor|Producer|Coordinator|Representative|Assistant|Intern)/i,
  ];
  
  return titlePatterns.some(pattern => pattern.test(text.trim()));
}

/**
 * Check if text looks like a company name (not a job title)
 */
function looksLikeCompanyName(text) {
  if (!text) return false;
  
  const trimmed = text.trim();
  
  // Company name indicators
  const companyIndicators = [
    /Inc\.?$/i,
    /LLC\.?$/i,
    /Corp\.?$/i,
    /Ltd\.?$/i,
    /Limited$/i,
    /Company$/i,
    /Co\.?$/i,
    /Technologies?$/i,
    /Solutions?$/i,
    /Systems?$/i,
    /Group$/i,
    /Capital$/i,
    /Ventures?$/i,
    /Partners?$/i,
    /Studios?$/i,
    /Labs?$/i,
  ];
  
  // If it ends with company indicators, it's likely a company
  if (companyIndicators.some(pattern => pattern.test(trimmed))) {
    return true;
  }
  
  // If it's a single capitalized word or short phrase (2-3 words) without title words, likely a company
  const words = trimmed.split(/\s+/);
  if (words.length <= 3 && words.length >= 1) {
    // Check if it doesn't contain common title words
    const titleWords = ['engineer', 'developer', 'manager', 'director', 'analyst', 'specialist', 
                        'coordinator', 'associate', 'executive', 'senior', 'junior', 'lead', 
                        'principal', 'staff', 'chief', 'head', 'recruiter', 'scientist', 
                        'architect', 'consultant', 'advisor', 'strategist', 'researcher'];
    const lowerText = trimmed.toLowerCase();
    if (!titleWords.some(word => lowerText.includes(word))) {
      // Check if it's capitalized properly (company names usually are)
      if (/^[A-Z]/.test(trimmed)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if text looks like a location (not a company or name)
 */
function looksLikeLocation(text) {
  if (!text) return false;
  
  const trimmed = text.trim();
  
  // Location indicators
  const locationPatterns = [
    /,\s*(United States|USA|US|UK|England|Scotland|Wales|Ireland|Canada|Australia|Germany|France|Spain|Italy|Netherlands|Belgium|Switzerland|Sweden|Norway|Denmark|Finland|Poland|Czech Republic|Austria|Portugal|Greece|Japan|China|India|Singapore|Hong Kong|South Korea|Brazil|Mexico|Argentina|Chile|Colombia|South Africa|Egypt|Israel|UAE|Saudi Arabia|Turkey|Russia)$/i,
    /^(Greater|Metro|Greater Metro)\s+[A-Z][a-z]+\s+Area$/i,
    /^[A-Z][a-z]+,\s+[A-Z][a-z]+$/,
    /^[A-Z][a-z]+,\s+[A-Z][a-z]+,\s+[A-Z][a-z]+/,
    /^(San Francisco|Los Angeles|New York|Chicago|Boston|Seattle|Austin|Denver|Portland|Miami|Atlanta|Dallas|Houston|Phoenix|San Diego|Washington|Philadelphia|Detroit|Minneapolis|Baltimore|Nashville|Charlotte|Raleigh|Indianapolis|Columbus|Milwaukee|Kansas City|Las Vegas|Sacramento|Oklahoma City|Memphis|Louisville|Jacksonville|Tucson|Fresno|Mesa|Virginia Beach|Oakland|Miami|Tulsa|Arlington|Tampa|New Orleans|Honolulu|Wichita|Cleveland|Bakersfield|Aurora|Anaheim|Santa Ana|St\.?\s*Louis|Corpus Christi|Riverside|Lexington|Henderson|Stockton|St\.?\s*Paul|Cincinnati|St\.?\s*Petersburg|Irvine|Greensboro|Lincoln|Plano|Anchorage|Norfolk|Orlando|Chandler|Laredo|Madison|Durham|Lubbock|Winston-Salem|Garland|Glendale|Hialeah|Reno|Chesapeake|Gilbert|Baton Rouge|Irving|Scottsdale|North Las Vegas|Fremont|Boise|Richmond|San Bernardino|Birmingham|Spokane|Rochester|Des Moines|Modesto|Fayetteville|Tacoma|Oxnard|Fontana|Columbus|Montgomery|Moreno Valley|Shreveport|Aurora|Yonkers|Akron|Huntington Beach|Little Rock|Augusta|Amarillo|Glendale|Mobile|Grand Rapids|Salt Lake City|Tallahassee|Huntsville|Grand Prairie|Knoxville|Worcester|Newport News|Brownsville|Overland Park|Santa Clarita|Providence|Garden Grove|Chattanooga|Oceanside|Jackson|Fort Lauderdale|Santa Rosa|Rancho Cucamonga|Port St\.?\s*Lucie|Tempe|Ontario|Vancouver|Sioux Falls|Springfield|Peoria|Pembroke Pines|Elk Grove|Salem|Lancaster|Corona|Eugene|Palmdale|Salinas|Springfield|Pasadena|Fort Collins|Hayward|Pomona|Cary|Rockford|Alexandria|Escondido|McKinney|Joliet|Kansas City|Torrance|Bridgeport|Paterson|Naperville|Syracuse|Lakewood|Hollywood|Sunnyvale|Macon|Pasadena|Orange|Fullerton|Mesquite|Dayton|Savannah|Clarksville|Orange|Pasadena|Killeen|McAllen|Joliet|Carrollton|Midland|Charleston|Waco|Visalia|Raleigh|Gainesville|Thousand Oaks|Cedar Rapids|Elizabeth|Stamford|Concord|Athens|Lafayette|Simi Valley|Santa Clara|Coral Springs|Fort Myers|Clearwater|Miami Beach|West Valley City|San Mateo|El Monte|Inglewood|Abilene|Richmond|Lowell|Wilmington|Arvada|Burbank|Palm Bay|Pueblo|High Point|West Covina|Round Rock|Davenport|Rialto|Brockton|Vista|Daly City|Tuscaloosa|Kenosha|Lakeland|Taylor|Lewisville|Tyler|Lawton|Meridian|Bellingham|Bend|Binghamton|Boca Raton|Boulder|Bremerton|Brentwood|Bristol|Broomfield|Brownsville|Bryan|Buffalo|Burlington|Caldwell|Cambridge|Camden|Canton|Cape Coral|Carlsbad|Carmel|Carrollton|Carson|Cary|Casper|Cedar Park|Cedar Rapids|Centennial|Champaign|Chandler|Chapel Hill|Charleston|Charlotte|Charlottesville|Chattanooga|Cheyenne|Chico|Chula Vista|Cicero|Cincinnati|Citrus Heights|Clarksville|Clearwater|Cleveland|Clifton|Clinton|Clovis|Coachella|Coconut Creek|College Station|Colorado Springs|Columbia|Columbus|Commerce City|Compton|Concord|Coral Gables|Coral Springs|Corona|Corpus Christi|Costa Mesa|Council Bluffs|Covina|Cranston|Cuyahoga Falls|Dallas|Daly City|Danbury|Danville|Davenport|Davis|Dayton|Daytona Beach|Dearborn|Decatur|Delano|Delray Beach|Deltona|Denton|Denver|Des Moines|Detroit|Diamond Bar|Downey|Dublin|Duluth|Durham|East Los Angeles|East Orange|East Providence|Eastvale|Edinburg|Edmond|Edmonds|El Cajon|El Centro|El Monte|El Paso|Elgin|Elizabeth|Elk Grove|Elmhurst|Elyria|Encinitas|Englewood|Erie|Escondido|Eugene|Euless|Evanston|Everett|Fairfield|Fargo|Farmington|Fayetteville|Federal Way|Findlay|Fishers|Flagstaff|Flint|Florence|Folsom|Fontana|Fort Collins|Fort Lauderdale|Fort Myers|Fort Smith|Fort Wayne|Fort Worth|Fountain Valley|Franklin|Fremont|Fresno|Frisco|Fullerton|Gainesville|Garden Grove|Garland|Gary|Gastonia|Georgetown|Germantown|Gilbert|Glenview|Glendale|Glendora|Goodyear|Grand Forks|Grand Island|Grand Junction|Grand Prairie|Grand Rapids|Greeley|Green Bay|Greensboro|Greenville|Greenwood|Gresham|Hackensack|Hagerstown|Hammond|Hampton|Hanford|Harlingen|Harrisburg|Harrisonburg|Hartford|Hattiesburg|Haverhill|Hawthorne|Hayward|Hemet|Henderson|Hesperia|Hialeah|Hickory|High Point|Highland|Hillsboro|Hoboken|Hollywood|Homestead|Honolulu|Hoover|Houston|Huntersville|Huntington|Huntington Beach|Huntsville|Hurst|Independence|Indianapolis|Inglewood|Iowa City|Irvine|Irving|Jackson|Jacksonville|Jefferson City|Jeffersonville|Jersey City|Johnson City|Joliet|Jonesboro|Joplin|Jupiter|Kalamazoo|Kannapolis|Kansas City|Kearny|Keller|Kenner|Kennewick|Kenosha|Kent|Kentwood|Kettering|Killeen|Kingsport|Kingston|Kirkland|Kissimmee|Knoxville|La Crosse|La Habra|La Mesa|La Mirada|La Quinta|Lafayette|Laguna Niguel|Lake Charles|Lake Elsinore|Lake Forest|Lakeland|Lakewood|Lancaster|Lansing|Laredo|Largo|Las Cruces|Las Vegas|Layton|League City|Lee's Summit|Leesburg|Lehi|Lenexa|Lewisville|Lexington|Lincoln|Little Rock|Livermore|Livonia|Lodi|Logan|Lombard|Long Beach|Longmont|Longview|Lorain|Los Angeles|Louisville|Loveland|Lowell|Lubbock|Lynchburg|Lynn|Lynwood|Macon|Madera|Madison|Madison Heights|Malden|Manchester|Manhattan|Mansfield|Maple Grove|Maplewood|Margate|Maricopa|Marietta|Marion|Marlborough|Martinez|Marysville|McAllen|McKinney|McLean|Medford|Melbourne|Memphis|Menifee|Merced|Meridian|Mesa|Mesquite|Miami|Miami Beach|Miami Gardens|Middletown|Midland|Midland|Milford|Millcreek|Milpitas|Milwaukee|Minneapolis|Miramar|Missoula|Missouri City|Mobile|Modesto|Monroe|Monterey|Monterey Park|Montgomery|Moore|Moreno Valley|Morgan Hill|Mount Pleasant|Mount Prospect|Mount Vernon|Mountain View|Muncie|Murfreesboro|Murrieta|Muskegon|Muskogee|Nampa|Napa|Naperville|Nashua|Nashville|National City|New Bedford|New Braunfels|New Haven|New Orleans|New Rochelle|New York|Newark|Newburgh|Newport Beach|Newport News|Newton|Niagara Falls|Noblesville|Norfolk|Normal|Norman|North Charleston|North Las Vegas|North Little Rock|North Miami|North Miami Beach|North Port|Norwalk|Novato|Novi|Oakland|Oakley|Ocala|Oceanside|Odessa|Ogden|Oklahoma City|Olathe|Olympia|Omaha|Ontario|Orange|Orange|Orem|Orlando|Oro Valley|Oshkosh|Overland Park|Owensboro|Oxnard|Palm Bay|Palm Beach Gardens|Palm Coast|Palm Desert|Palm Springs|Palmdale|Palo Alto|Panama City|Paradise|Paramount|Parker|Parma|Pasadena|Pasadena|Pasco|Passaic|Paterson|Pawtucket|Peabody|Pearland|Pembroke Pines|Pensacola|Peoria|Perris|Perth Amboy|Petaluma|Phenix City|Philadelphia|Phoenix|Pico Rivera|Pine Bluff|Pinellas Park|Pittsburgh|Pittsfield|Placentia|Plainfield|Plano|Plantation|Pleasanton|Plymouth|Pocatello|Pomona|Pompano Beach|Pontiac|Port Arthur|Port Charlotte|Port Orange|Port St\.?\s*Lucie|Portland|Portsmouth|Poway|Prescott|Providence|Provo|Pueblo|Punta Gorda|Quincy|Racine|Raleigh|Rancho Cordova|Rancho Cucamonga|Rapid City|Reading|Redding|Redlands|Redmond|Redondo Beach|Redwood City|Reno|Renton|Revere|Rialto|Richardson|Richland|Richmond|Richmond|Rio Rancho|Riverside|Roanoke|Rochester|Rochester|Rockford|Rock Hill|Rock Island|Rockville|Rocky Mount|Rome|Rosemead|Roseville|Roswell|Round Rock|Rowlett|Royal Oak|Sacramento|Saginaw|Salem|Salem|Salinas|Salt Lake City|San Angelo|San Antonio|San Bernardino|San Buenaventura|San Diego|San Francisco|San Jose|San Leandro|San Mateo|San Rafael|San Ramon|Santa Ana|Santa Barbara|Santa Clara|Santa Clarita|Santa Cruz|Santa Fe|Santa Maria|Santa Monica|Santa Rosa|Santee|Sarasota|Savannah|Scottsdale|Scranton|Seattle|Shreveport|Simi Valley|Sioux City|Sioux Falls|Smyrna|Somerville|South Bend|South Gate|South Jordan|South Lyon|South San Francisco|Sparks|Spokane|Springdale|Springfield|Springfield|Springfield|Springfield|Springfield|Springfield|Springfield|Springfield|St\.?\s*Charles|St\.?\s*Cloud|St\.?\s*Louis|St\.?\s*Paul|St\.?\s*Petersburg|Stamford|Stanton|Sterling Heights|Stockton|Stratford|Strongsville|Sunnyvale|Sunrise|Sunset|Surprise|Syracuse|Tacoma|Tallahassee|Tampa|Taunton|Taylor|Temecula|Tempe|Temple|Terre Haute|Texas City|Thornton|Thousand Oaks|Tigard|Titusville|Toledo|Topeka|Torrance|Trenton|Troy|Tucson|Tulare|Tulsa|Turlock|Tuscaloosa|Tustin|Twin Falls|Tyler|Union City|Upland|Urbana|Valdosta|Vallejo|Vancouver|Ventura|Vernon|Victorville|Virginia Beach|Visalia|Waco|Waldorf|Walla Walla|Warner Robins|Warren|Warwick|Washington|Waterbury|Waterloo|Watsonville|Waukegan|Waukesha|Wausau|Wauwatosa|Wellington|West Covina|West Des Moines|West Haven|West Jordan|West Palm Beach|West Sacramento|West Valley City|Westfield|Westland|Westminster|Westminster|Weston|Wheaton|Wichita|Wichita Falls|Wilmington|Wilmington|Wilson|Winston-Salem|Woodbury|Woodland|Worcester|Wylie|Yakima|Yonkers|Yorba Linda|York|Youngstown|Yuba City|Yucaipa|Yuma|Zephyrhills|Zion)$/i,
  ];
  
  // Check for country names
  const countries = ['United States', 'USA', 'US', 'UK', 'England', 'Scotland', 'Wales', 'Ireland', 
                     'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 
                     'Belgium', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 
                     'Czech Republic', 'Austria', 'Portugal', 'Greece', 'Japan', 'China', 'India', 
                     'Singapore', 'Hong Kong', 'South Korea', 'Brazil', 'Mexico', 'Argentina', 
                     'Chile', 'Colombia', 'South Africa', 'Egypt', 'Israel', 'UAE', 'Saudi Arabia', 
                     'Turkey', 'Russia'];
  
  const lowerText = trimmed.toLowerCase();
  if (countries.some(country => lowerText.includes(country.toLowerCase()))) {
    return true;
  }
  
  // Check location patterns
  if (locationPatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }
  
  // Single word that's a known location (like "England")
  const words = trimmed.split(/\s+/);
  if (words.length === 1 && /^[A-Z][a-z]+$/.test(trimmed)) {
    const knownLocations = ['England', 'Scotland', 'Wales', 'Ireland', 'London', 'Manchester', 
                            'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Edinburgh', 
                            'Glasgow', 'Cardiff', 'Belfast', 'Newcastle', 'Nottingham', 'Leicester', 
                            'Coventry', 'Bradford', 'Kingston', 'Plymouth', 'Stoke', 'Wolverhampton', 
                            'Derby', 'Southampton', 'Southend', 'Reading', 'Northampton', 'Luton', 
                            'Bolton', 'Bournemouth', 'Norwich', 'Swindon', 'Peterborough', 'Ipswich', 
                            'Cambridge', 'Oxford', 'York', 'Exeter', 'Grimsby', 'Blackpool', 'Middlesbrough', 
                            'Brighton', 'Hastings', 'Dover', 'Canterbury', 'Winchester', 'Salisbury', 
                            'Bath', 'Gloucester', 'Cheltenham', 'Worcester', 'Hereford', 'Shrewsbury', 
                            'Chester', 'Lancaster', 'Carlisle', 'Durham', 'Newcastle', 'Sunderland', 
                            'Middlesbrough', 'Hartlepool', 'Scarborough', 'Whitby', 'Bridlington', 
                            'Hull', 'Grimsby', 'Lincoln', 'Boston', 'Spalding', 'Wisbech', 'King\'s Lynn', 
                            'Great Yarmouth', 'Lowestoft', 'Ipswich', 'Colchester', 'Chelmsford', 
                            'Southend', 'Basildon', 'Gravesend', 'Dartford', 'Maidstone', 'Canterbury', 
                            'Dover', 'Folkestone', 'Hastings', 'Eastbourne', 'Brighton', 'Worthing', 
                            'Bognor Regis', 'Chichester', 'Portsmouth', 'Southampton', 'Winchester', 
                            'Salisbury', 'Bath', 'Bristol', 'Gloucester', 'Cheltenham', 'Tewkesbury', 
                            'Evesham', 'Stratford', 'Warwick', 'Leamington', 'Rugby', 'Northampton', 
                            'Kettering', 'Corby', 'Wellingborough', 'Rushden', 'Higham Ferrers', 'Oundle', 
                            'Peterborough', 'Stamford', 'Bourne', 'Spalding', 'Holbeach', 'Long Sutton', 
                            'Wisbech', 'March', 'Chatteris', 'Ely', 'Soham', 'Newmarket', 'Bury St Edmunds', 
                            'Thetford', 'Dereham', 'Fakenham', 'Walsingham', 'Holt', 'Cromer', 'Sheringham', 
                            'Wells', 'Blakeney', 'Cley', 'Hunstanton', 'Snettisham', 'Dersingham', 
                            'Heacham', 'Sandringham', 'King\'s Lynn', 'Downham Market', 'Stoke Ferry', 
                            'Wereham', 'Wimbotsham', 'Stradsett', 'Cockley Cley', 'Gooderstone', 'Oxborough', 
                            'Bodney', 'Hilborough', 'Hilgay', 'Feltwell', 'Methwold', 'Foulden', 'Shouldham', 
                            'Shouldham Thorpe', 'Wormegay', 'Tilney', 'Tilney All Saints', 'Tilney St Lawrence', 
                            'Tilney St Lawrence', 'Terrington', 'Terrington St Clement', 'Terrington St John', 
                            'Walpole', 'Walpole St Andrew', 'Walpole St Peter', 'Walpole Highway', 'Tydd St Mary', 
                            'Tydd St Giles', 'Leverington', 'Wisbech St Mary', 'Wisbech', 'Emneth', 'Outwell', 
                            'Upwell', 'Nordelph', 'Downham Market', 'Stoke Ferry', 'Wereham', 'Wimbotsham', 
                            'Stradsett', 'Cockley Cley', 'Gooderstone', 'Oxborough', 'Bodney', 'Hilborough', 
                            'Hilgay', 'Feltwell', 'Methwold', 'Foulden', 'Shouldham', 'Shouldham Thorpe', 
                            'Wormegay', 'Tilney', 'Tilney All Saints', 'Tilney St Lawrence', 'Terrington', 
                            'Terrington St Clement', 'Terrington St John', 'Walpole', 'Walpole St Andrew', 
                            'Walpole St Peter', 'Walpole Highway', 'Tydd St Mary', 'Tydd St Giles', 
                            'Leverington', 'Wisbech St Mary', 'Emneth', 'Outwell', 'Upwell', 'Nordelph'];
    if (knownLocations.some(loc => trimmed === loc)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Remove job title from company name if it's concatenated
 */
function removeTitleFromCompany(company, title) {
  if (!company || !title) return company;
  
  const titleLower = title.toLowerCase().trim();
  const companyLower = company.toLowerCase().trim();
  const titleEscaped = escapeRegex(title);
  
  // Pattern 1: Company starts with title (possibly duplicated)
  // "Director of RecruitingDirector of Recruiting Quantum" -> "Quantum"
  if (companyLower.startsWith(titleLower)) {
    // Remove the title prefix
    let cleaned = company.substring(title.length).trim();
    // If title appears twice consecutively, remove both
    if (cleaned.toLowerCase().startsWith(titleLower)) {
      cleaned = cleaned.substring(title.length).trim();
    }
    // If there's still more title, remove it (handles triple+ occurrences)
    while (cleaned.toLowerCase().startsWith(titleLower) && cleaned.length > title.length) {
      cleaned = cleaned.substring(title.length).trim();
    }
    return cleaned;
  }
  
  // Pattern 2: Title appears twice consecutively in the middle
  // "Senior Software EngineerSenior Software Engineer Airbnb" -> "Airbnb"
  const doubleTitle = title + title;
  const doubleTitleLower = doubleTitle.toLowerCase();
  if (companyLower.includes(doubleTitleLower)) {
    // Find where the double title ends and take everything after it
    const doubleTitleIndex = companyLower.indexOf(doubleTitleLower);
    if (doubleTitleIndex >= 0) {
      return company.substring(doubleTitleIndex + doubleTitle.length).trim();
    }
  }
  
  // Pattern 3: Title appears at start with optional duplication
  // Use regex to match title at start, optionally followed by same title
  const titleAtStartRegex = new RegExp(`^${titleEscaped}\\s*${titleEscaped}?\\s*`, 'i');
  if (titleAtStartRegex.test(company)) {
    return company.replace(titleAtStartRegex, '').trim();
  }
  
  // Pattern 4: Title appears anywhere - only remove if it's clearly a prefix
  // This is more conservative to avoid removing valid company names
  if (companyLower.includes(titleLower)) {
    // Only remove if title is at the very start (with possible duplication)
    const startMatch = company.match(new RegExp(`^(${titleEscaped}\\s*)+`, 'i'));
    if (startMatch) {
      return company.substring(startMatch[0].length).trim();
    }
  }
  
  return company;
}

/**
 * Extract company name from various fields using heuristics
 */
function extractCompanyFromFields(exp, rawText, title) {
  let company = exp.company || "";
  
  // FIRST: Remove title if it's concatenated with company
  if (company && title) {
    company = removeTitleFromCompany(company, title);
  }
  
  // Check if company field contains only dates/tenure (common LinkedIn parsing issue)
  if (isDateOrTenureOnly(company)) {
    company = "";
  }
  
  // Check if company field contains a job title (shouldn't be in company field)
  if (company && containsJobTitle(company)) {
    // If it's just a title with no company, clear it
    if (containsJobTitle(company) && !isValidCompanyName(company)) {
      company = "";
    } else {
      // Try to extract company part if title is concatenated
      if (title) {
        company = removeTitleFromCompany(company, title);
      }
      // If still looks like a title, clear it
      if (containsJobTitle(company) && company.length < 50) {
        company = "";
      }
    }
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
  
  // Final validation - make sure we didn't extract dates/tenure or job titles
  if (company && isDateOrTenureOnly(company)) {
    return null;
  }
  
  // Final check: remove title if still present
  if (company && title) {
    company = removeTitleFromCompany(company, title);
  }
  
  // Final validation: if it still looks like a job title, reject it
  if (company && containsJobTitle(company) && !isValidCompanyName(company)) {
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
 * Check if text looks like a person's name (not a location)
 */
function looksLikeName(text) {
  if (!text) return false;
  
  const trimmed = text.trim();
  
  // Common name patterns
  const namePatterns = [
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // "John Smith"
    /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/, // "John Michael Smith"
    /^[A-Z][a-z]+,\s+[A-Z][a-z]+(,\s+[A-Z][a-z]+)?$/, // "Smith, John" or "Smith, John, Michael"
  ];
  
  // If it matches name patterns and doesn't have location indicators, it's likely a name
  if (namePatterns.some(pattern => pattern.test(trimmed))) {
    // Check if it has location indicators
    const locationIndicators = [
      'united states', 'california', 'new york', 'texas', 'florida', 'washington',
      'massachusetts', 'boston', 'los angeles', 'san francisco', 'seattle',
      'area', 'region', 'metro', 'city', 'state', 'country'
    ];
    
    const lowerText = trimmed.toLowerCase();
    const hasLocationIndicator = locationIndicators.some(indicator => lowerText.includes(indicator));
    
    // If it looks like a name pattern but has no location indicators, it's probably a name
    if (!hasLocationIndicator) {
      return true;
    }
  }
  
  // Check for comma-separated names (common pattern: "Name1, Name2, Name3")
  const commaParts = trimmed.split(',').map(p => p.trim());
  if (commaParts.length >= 2 && commaParts.length <= 5) {
    // Check if all parts look like names (capitalized, 2-20 chars, no location words)
    const allLookLikeNames = commaParts.every(part => {
      return /^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(part) && 
             part.length >= 2 && 
             part.length <= 20 &&
             !part.toLowerCase().includes('united states') &&
             !part.toLowerCase().includes('california') &&
             !part.toLowerCase().includes('new york');
    });
    
    if (allLookLikeNames) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract and clean location from profile data - Enhanced
 */
function extractLocation(data, rawText) {
  let location = data.personal_info?.location || "";

  // FIRST: Check if location looks like names and reject it
  if (location && looksLikeName(location)) {
    location = "";
  }

  // If location has newlines, try to extract the proper location
  if (location && location.includes('\n')) {
    const parts = location.split('\n').map(p => p.trim()).filter(p => p);
    
    // Look for the part that looks like a proper location (has commas, not names)
    for (const part of parts) {
      // Skip if it looks like names
      if (looksLikeName(part)) {
        continue;
      }
      
      if (part.includes(',') && part.length > 10) {
        const commaParts = part.split(',');
        if (commaParts.length >= 2) {
          // Check if it looks like a location
          const lastPart = commaParts[commaParts.length - 1].trim();
          if (lastPart.includes('United States') || lastPart.length === 2 || 
              ['California', 'New York', 'Massachusetts', 'Texas', 'Florida', 'Washington', 'Illinois', 'Pennsylvania', 'Georgia', 'North Carolina', 'Virginia', 'Arizona', 'Colorado', 'Michigan', 'Ohio', 'Tennessee', 'Indiana', 'Wisconsin', 'Minnesota', 'Missouri', 'Maryland', 'Louisiana', 'Oregon', 'Alabama', 'Kentucky', 'Connecticut', 'Utah', 'Iowa', 'Nevada', 'Arkansas', 'Mississippi', 'Kansas', 'New Mexico', 'Nebraska', 'West Virginia', 'Idaho', 'Hawaii', 'New Hampshire', 'Maine', 'Montana', 'Rhode Island', 'Delaware', 'South Dakota', 'North Dakota', 'Alaska', 'Vermont', 'Wyoming'].some(state => lastPart.includes(state))) {
            location = part;
            break;
          }
        }
      }
    }
    
    // If no valid location found, clear it
    if (looksLikeName(location) || !location.includes(',')) {
      location = "";
    }
  }

  // Try to extract from raw_text
  if (rawText && (!location || location.length < 10 || !location.includes(',') || looksLikeName(location))) {
    const locationPatterns = [
      /Los Angeles, California, United States/,
      /New York, New York, United States/,
      /Seattle, Washington, United States/,
      /San Francisco, California, United States/,
      /Austin, Texas, United States/,
      /Boston, Massachusetts, United States/,
      /Chicago, Illinois, United States/,
      /([A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+,\s+United States)/,
      /([A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+)/,
    ];

    for (const pattern of locationPatterns) {
      const match = rawText.substring(0, 5000).match(pattern);
      if (match) {
        const potentialLocation = match[0] || match[1];
        
        // Reject if it looks like names
        if (looksLikeName(potentialLocation)) {
          continue;
        }
        
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

  // Final cleanup and validation
  if (location) {
    // Reject if it still looks like names
    if (looksLikeName(location)) {
      return "";
    }
    
    location = location.replace(/[\n\r]/g, " ").trim();
    
    // Remove university/company names from location
    const skipPatterns = [
      'university', 'college', 'massachusetts boston', 'umass',
      'treelab', 'nexus', 'human capital',
    ];
    
    for (const pattern of skipPatterns) {
      if (location.toLowerCase().includes(pattern)) {
        const index = location.toLowerCase().indexOf(pattern);
        if (index > 0) {
          location = location.substring(index + pattern.length).trim();
          location = location.replace(/^[,\s]+/, '').trim();
        } else if (index === 0) {
          location = location.substring(pattern.length).trim();
          location = location.replace(/^[,\s]+/, '').trim();
        }
      }
    }
    
    // Normalize whitespace
    location = location.replace(/\s+/g, " ").trim();
    
    // Final validation: must have comma and look like a location
    if (location && (!location.includes(',') || location.length < 10 || looksLikeName(location))) {
      // Try to find better one in raw_text
      if (rawText) {
        const betterMatch = rawText.match(/([A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z\s]+,\s+United States)/);
        if (betterMatch && !looksLikeName(betterMatch[1])) {
          location = betterMatch[1];
        } else {
          location = "";
        }
      } else {
        location = "";
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

  // VALIDATION: Fix common data placement errors before building result
  // Check if company name is in title field
  if (currentTitle && looksLikeCompanyName(currentTitle) && !containsJobTitle(currentTitle)) {
    // Company name is in title field - swap them if we have a real title elsewhere
    // Try to find the actual title from experience
    if (currentExp && currentExp.title && containsJobTitle(currentExp.title)) {
      // Found actual title, swap
      const tempCompany = currentTitle;
      currentTitle = currentExp.title;
      if (!currentCompany) {
        currentCompany = tempCompany;
      }
    } else if (!currentCompany) {
      // No company found, move title to company
      currentCompany = currentTitle;
      currentTitle = "";
    }
  }
  
  // Check if location is in company field
  if (currentCompany && looksLikeLocation(currentCompany) && !isValidCompanyName(currentCompany)) {
    // Location is in company field - move it to location if location is empty
    if (!location) {
      location = currentCompany;
      currentCompany = "";
    } else {
      // Location already exists, just clear the company
      currentCompany = "";
    }
  }
  
  // Check if company name looks like a location (single country/region name)
  if (currentCompany && looksLikeLocation(currentCompany) && !isValidCompanyName(currentCompany)) {
    if (!location) {
      location = currentCompany;
      currentCompany = "";
    } else {
      currentCompany = "";
    }
  }

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
