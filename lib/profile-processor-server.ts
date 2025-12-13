/**
 * Server-side LinkedIn profile processor
 * Uses the same logic as extension/profileProcessor.js but adapted for Node.js
 * Processes HTML scraped from LinkedIn profiles into structured candidate data
 */

import { JSDOM } from "jsdom"

/**
 * Helper function to get text content from element (like extension's getTextContent)
 */
function getTextContent(element: Element | null): string {
  if (!element) return ""
  // Try textContent first
  let text = element.textContent?.trim() || ""
  // If empty, try innerText
  if (!text && "innerText" in element) {
    text = (element as any).innerText?.trim() || ""
  }
  // Remove extra whitespace
  return text.replace(/\s+/g, " ").trim()
}

/**
 * Extract structured data from LinkedIn profile HTML
 * Mimics the extension's contentScript.js extraction logic
 */
export function extractStructuredDataFromHTML(html: string, url: string): any {
  const dom = new JSDOM(html)
  const document = dom.window.document

  const structured: any = {
    personal_info: {
      profile_url: url,
    },
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
    publications: [],
    volunteer_experience: [],
    courses: [],
    honors_awards: [],
    organizations: [],
    patents: [],
    test_scores: [],
    interests: { companies: [], groups: [], causes: [] },
    contact_info: {},
    social_links: [],
    activity: {},
  }

  // Get raw text for fallback extraction
  const rawText = document.body?.textContent || ""
  structured.raw_text = rawText

  // Extract name from various possible selectors (more comprehensive)
  const nameSelectors = [
    "h1.text-heading-xlarge",
    "h1[data-anonymize='person-name']",
    "main h1",
    "h1",
    ".pv-text-details__left-panel h1",
    "[data-test-id='name']",
    "[aria-label*='name']",
    "h1.top-card-layout__title",
    "h1.break-words",
    ".top-card-layout__title",
  ]
  
  for (const selector of nameSelectors) {
    const nameEl = document.querySelector(selector)
    if (nameEl) {
      const nameText = getTextContent(nameEl)
      // Validate name - should be 2-4 words, not too long
      if (nameText && nameText.length > 2 && nameText.length < 100) {
        const nameParts = nameText.split(/\s+/)
        if (nameParts.length >= 2 && nameParts.length <= 4) {
          // Check for invalid names
          const invalidNames = ["Join LinkedIn", "Accessibility", "User Agreement", "LinkedIn Member"]
          if (!invalidNames.some(invalid => nameText.includes(invalid))) {
            structured.personal_info.name = nameText
            break
          }
        }
      }
    }
  }

  // Fallback: Extract name from raw text if not found in HTML
  if (!structured.personal_info.name && rawText) {
    const namePatterns = [
      /^([A-Z][a-z]+(?: [A-Z][a-zñóíéáú\.]+)+(?: [A-Z][a-zñóíéáú\.]+)?)\n/,
      /Me For Business\n([A-Z][a-z]+(?: [A-Z][a-zñóíéáú\.]+)+(?: [A-Z][a-zñóíéáú\.]+)?)\n/,
    ]
    for (const pattern of namePatterns) {
      const match = rawText.substring(0, 1000).match(pattern)
      if (match) {
        const potentialName = match[1].trim()
        const nameParts = potentialName.split(/\s+/)
        if (potentialName.length > 3 && potentialName.length < 50 && nameParts.length >= 2 && nameParts.length <= 4) {
          structured.personal_info.name = potentialName
          break
        }
      }
    }
  }

  // Extract headline
  const headlineSelectors = [
    ".text-body-medium.break-words",
    ".pv-text-details__left-panel .text-body-medium",
    "h2.text-body-medium",
    "h2",
    "[data-test-id='headline']",
    ".top-card-layout__headline",
    ".text-body-medium",
  ]
  for (const selector of headlineSelectors) {
    const headlineEl = document.querySelector(selector)
    if (headlineEl && headlineEl !== document.querySelector("h1")) {
      const headlineText = getTextContent(headlineEl)
      if (headlineText && !headlineText.includes("connections") && !headlineText.includes("followers") && headlineText.length > 5) {
        structured.personal_info.headline = headlineText
        break
      }
    }
  }

  // Extract location
  const locationSelectors = [
    ".text-body-small.inline.t-black--light.break-words",
    ".pv-text-details__left-panel .text-body-small",
    "[data-test-id='location']",
    "[aria-label*='location']",
    ".top-card-layout__first-subline",
    ".text-body-small",
  ]
  for (const selector of locationSelectors) {
    const locationEl = document.querySelector(selector)
    if (locationEl) {
      const locationText = getTextContent(locationEl)
      if (locationText && 
          !locationText.includes("connections") && 
          !locationText.includes("followers") && 
          locationText.length > 3 &&
          locationText.length < 100) {
        structured.personal_info.location = locationText
        break
      }
    }
  }

  // Helper function to find section by heading (like extension)
  function findSectionByHeading(headingTexts: string[]): Element | null {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']"))
    for (const heading of headings) {
      const text = getTextContent(heading)
      if (text && headingTexts.some((h: string) => text.toLowerCase().includes(h.toLowerCase()))) {
        // Find the parent section or container
        let current: Element | null = heading.parentElement
        while (current && current !== document.body) {
          const tagName = current.tagName?.toLowerCase()
          const className = current.className?.toString() || ""
          const id = current.getAttribute("id") || ""
          
          if (tagName === "section" || 
              className.includes("section") || 
              id.includes("section") ||
              className.includes("experience") ||
              className.includes("education")) {
            return current
          }
          current = current.parentElement
        }
        return heading.parentElement
      }
    }
    return null
  }

  // EXPERIENCE - Comprehensive extraction (like extension)
  const experienceSection = findSectionByHeading(["Experience", "Work Experience", "Employment", "Professional Experience"])
  if (experienceSection) {
    const items = experienceSection.querySelectorAll("li, .pvs-list__paged-list-item, [data-view-name='profile-component-entity'], article, [role='listitem'], .pvs-list__item")
    items.forEach((item) => {
      if (!item) return
      
      const itemText = getTextContent(item) || ""
      
      // Extract title - try multiple selectors (like extension)
      const titleSelectors = [
        "h3",
        ".t-16.t-black.t-bold",
        "span[aria-hidden='true']",
        "[class*='title']",
        "[class*='position']",
        ".pvs-entity__summary-info-v2 h3",
        ".mr1.t-bold span[aria-hidden='true']",
        ".t-bold span"
      ]
      
      let title = ""
      for (const selector of titleSelectors) {
        const titleEl = item.querySelector(selector)
        if (titleEl) {
          title = getTextContent(titleEl) || ""
          if (title) break
        }
      }
      
      // If title contains company info, extract it separately
      if (title && /[·•]\s*(?:Full-time|Part-time)/i.test(title)) {
        const titleParts = title.split(/[·•]/)
        title = titleParts[0].trim()
      }
      
      // Extract company - try multiple selectors (like extension)
      const companySelectors = [
        ".t-14.t-black--light.t-normal",
        ".pvs-entity__subtitle",
        "[class*='company']",
        "[class*='organization']",
        "span[aria-hidden='true']",
        ".pvs-entity__secondary-title",
        ".t-14.t-normal.t-black--light",
        ".t-14.t-normal span[aria-hidden='true']",
        ".t-normal span"
      ]
      
      let company = ""
      for (const selector of companySelectors) {
        const companyEl = item.querySelector(selector)
        if (companyEl) {
          const companyText = getTextContent(companyEl)
          // Skip if it's the title we already found
          if (companyText && companyText !== title && companyText.length > 2) {
            company = companyText
            // Clean company name - remove employment type indicators
            company = company.replace(/\s*[·•]\s*(?:Full-time|Part-time|Contract|Internship|Freelance|Self-employed|Volunteer).*$/i, '').trim()
            if (company) break
          }
        }
      }
      
      // Also try to find company by looking for elements that contain "· Full-time" or similar patterns
      if (!company) {
        const allTextElements = item.querySelectorAll("span, div, p")
        for (const el of allTextElements) {
          const text = getTextContent(el)
          if (text && /[·•]\s*(?:Full-time|Part-time|Contract)/i.test(text)) {
            const parts = text.split(/[·•]/).map((p: string) => p.trim()).filter((p: string) => p)
            if (parts.length > 0) {
              company = parts[0]
              break
            }
          }
        }
      }
      
      // Extract date range
      const dateSelectors = [
        ".t-14.t-normal.t-black--light span[aria-hidden='true']",
        ".t-black--light span",
        "[class*='date']",
        "[class*='duration']"
      ]
      
      let dateRange = ""
      for (const selector of dateSelectors) {
        const dateEl = item.querySelector(selector)
        if (dateEl) {
          dateRange = getTextContent(dateEl) || ""
          if (dateRange && (dateRange.includes("Present") || dateRange.includes("Current") || /\d{4}/.test(dateRange))) {
            break
          }
        }
      }
      
      // Extract description
      const descriptionSelectors = [
        ".t-14.t-normal.t-black span[aria-hidden='true']",
        ".t-black span",
        "[class*='description']"
      ]
      
      let description = ""
      for (const selector of descriptionSelectors) {
        const descEl = item.querySelector(selector)
        if (descEl) {
          description = getTextContent(descEl) || ""
          if (description && description.length > 20) break
        }
      }
      
      if (title || company) {
        const experience: any = {
          title: title || "",
          company: company || "",
          dateRange: dateRange || "",
          description: description || "",
        }

        // Parse date range to determine if current
        const dateText = (dateRange || "").toLowerCase()
        experience.isCurrent = dateText.includes("present") || dateText.includes("current") || dateText.includes("now")

        // Extract start/end dates
        const dateMatch = dateRange?.match(/(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current)/i)
        if (dateMatch) {
          experience.startDate = dateMatch[1]
          experience.endDate = dateMatch[2]
        } else {
          const singleDateMatch = dateRange?.match(/(\w+\s+\d{4})/i)
          if (singleDateMatch) {
            experience.startDate = singleDateMatch[1]
          }
        }

        structured.experience.push(experience)
      }
    })
  }

  // EDUCATION - Comprehensive extraction (like extension)
  const educationSection = findSectionByHeading(["Education", "Academic Background", "University", "College"])
  if (educationSection) {
    const items = educationSection.querySelectorAll("li, .pvs-list__paged-list-item, [data-view-name='profile-component-entity'], article, [role='listitem'], .pvs-list__item")
    items.forEach((item) => {
      if (!item) return
      
      const itemText = getTextContent(item) || ""
      
      // Extract school - try multiple selectors
      const schoolSelectors = [
        "h3",
        ".t-16.t-black.t-bold",
        ".mr1.t-bold span[aria-hidden='true']",
        ".t-bold span",
        "[class*='school']",
        "[class*='university']"
      ]
      
      let school = ""
      for (const selector of schoolSelectors) {
        const schoolEl = item.querySelector(selector)
        if (schoolEl) {
          school = getTextContent(schoolEl) || ""
          if (school && school.length > 2) break
        }
      }
      
      // Extract degree/field - try multiple selectors
      const degreeSelectors = [
        ".t-14.t-normal span[aria-hidden='true']",
        ".t-normal span",
        "[class*='degree']",
        "[class*='field']"
      ]
      
      let degree = ""
      let fieldOfStudy = ""
      for (const selector of degreeSelectors) {
        const degreeEl = item.querySelector(selector)
        if (degreeEl) {
          const degreeText = getTextContent(degreeEl) || ""
          // Skip if it's the school name
          if (degreeText && degreeText !== school && degreeText.length > 2) {
            // Check if it contains field of study keywords
            if (/Bachelor|Master|PhD|Doctor|Associate|Certificate|Diploma/i.test(degreeText)) {
              degree = degreeText
            } else {
              fieldOfStudy = degreeText
            }
            break
          }
        }
      }
      
      // Extract date range
      const dateSelectors = [
        ".t-14.t-normal.t-black--light span[aria-hidden='true']",
        ".t-black--light span",
        "[class*='date']"
      ]
      
      let dateRange = ""
      for (const selector of dateSelectors) {
        const dateEl = item.querySelector(selector)
        if (dateEl) {
          dateRange = getTextContent(dateEl) || ""
          if (dateRange && /\d{4}/.test(dateRange)) break
        }
      }
      
      if (school) {
        const education: any = {
          school: school,
          degree: degree || "",
          field_of_study: fieldOfStudy || "",
          date_range: dateRange || "",
        }

        // Extract graduation year
        const yearMatch = dateRange.match(/\d{4}/)
        if (yearMatch) {
          education.graduationYear = yearMatch[0]
        }

        structured.education.push(education)
      }
    })
  }

  // SKILLS - Comprehensive extraction (like extension)
  const skillsSection = findSectionByHeading(["Skills", "Core Competencies", "Expertise", "Technical Skills"])
  if (skillsSection) {
    const items = skillsSection.querySelectorAll("li, .pvs-list__paged-list-item, [data-view-name='profile-component-entity'], article, [role='listitem'], .pvs-list__item, button, span")
    items.forEach((item) => {
      if (!item) return
      
      // Try multiple selectors for skill name
      const skillSelectors = [
        ".mr1.t-bold span[aria-hidden='true']",
        ".t-bold span",
        "span[aria-hidden='true']",
        "button span",
        "[class*='skill']"
      ]
      
      let skillName = ""
      for (const selector of skillSelectors) {
        const skillEl = item.querySelector(selector)
        if (skillEl) {
          skillName = getTextContent(skillEl) || ""
          if (skillName && skillName.length > 1 && skillName.length < 50) {
            // Validate it's actually a skill (not a button label or other text)
            if (!/endorse|add|show|more|less/i.test(skillName)) {
              break
            }
          }
        }
      }
      
      // Fallback: use the item's text content directly
      if (!skillName) {
        const itemText = getTextContent(item)
        if (itemText && itemText.length > 1 && itemText.length < 50 && !/endorse|add|show|more|less/i.test(itemText)) {
          skillName = itemText
        }
      }
      
      if (skillName) {
        structured.skills.push({ name: skillName.trim() })
      }
    })
  }

  // Extract raw text for additional parsing
  structured.raw_text = document.body?.textContent || ""

  // Log extraction results for debugging
  console.log(`\n========== [HTML EXTRACTION] Results for ${url} ==========`)
  console.log(`  - Name extracted: ${structured.personal_info.name || "NOT FOUND"}`)
  console.log(`  - Headline extracted: ${structured.personal_info.headline || "NOT FOUND"}`)
  console.log(`  - Location extracted: ${structured.personal_info.location || "NOT FOUND"}`)
  console.log(`  - Experience items: ${structured.experience.length}`)
  if (structured.experience.length > 0) {
    console.log(`  - First experience:`, {
      title: structured.experience[0].title,
      company: structured.experience[0].company,
      dateRange: structured.experience[0].dateRange,
      isCurrent: structured.experience[0].isCurrent,
    })
  }
  console.log(`  - Education items: ${structured.education.length}`)
  if (structured.education.length > 0) {
    console.log(`  - First education:`, {
      school: structured.education[0].school,
      degree: structured.education[0].degree,
      dateRange: structured.education[0].dateRange,
    })
  }
  console.log(`  - Skills items: ${structured.skills.length}`)
  console.log(`  - Raw text length: ${structured.raw_text.length} chars`)
  console.log(`========== [HTML EXTRACTION] Complete ==========\n`)

  return structured
}

/**
 * Build a profile document similar to what the extension creates
 * This format is what profileProcessor.js expects
 */
export function buildProfileDocumentFromHTML(html: string, url: string): any {
  const structured = extractStructuredDataFromHTML(html, url)

  return {
    extraction_metadata: {
      source_url: url,
      extracted_at: new Date().toISOString(),
    },
    raw_html: html.substring(0, 10000), // Limit HTML size
    raw_text: structured.raw_text,
    personal_info: structured.personal_info,
    experience: structured.experience,
    education: structured.education,
    skills: structured.skills,
    certifications: structured.certifications,
    languages: structured.languages,
    projects: structured.projects,
    publications: structured.publications,
    volunteer_experience: structured.volunteer_experience,
    courses: structured.courses,
    honors_awards: structured.honors_awards,
    organizations: structured.organizations,
    patents: structured.patents,
    test_scores: structured.test_scores,
    interests: structured.interests,
    contact_info: structured.contact_info,
    social_links: structured.social_links,
    activity: structured.activity,
  }
}
