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

  // Extract experience sections - try multiple selectors
  const experienceSelectors = [
    "#experience ~ .pvs-list__outer-container .pvs-list__item",
    ".experience-section .pvs-list__item",
    "section#experience .pvs-list__item",
    ".pvs-list__item",
  ]

  for (const expSelector of experienceSelectors) {
    const experienceSections = document.querySelectorAll(expSelector)
    if (experienceSections.length > 0) {
      experienceSections.forEach((section) => {
        const titleEl = section.querySelector(".mr1.t-bold span[aria-hidden='true'], .t-bold span")
        const companyEl = section.querySelector(".t-14.t-normal span[aria-hidden='true'], .t-normal span")
        const dateEl = section.querySelector(".t-14.t-normal.t-black--light span[aria-hidden='true'], .t-black--light span")
        const descriptionEl = section.querySelector(".t-14.t-normal.t-black span[aria-hidden='true'], .t-black span")

        const title = titleEl?.textContent?.trim()
        const company = companyEl?.textContent?.trim()
        const dateRange = dateEl?.textContent?.trim()
        const description = descriptionEl?.textContent?.trim()

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
      break // Use first selector that finds results
    }
  }

  // Extract education sections
  const educationSelectors = [
    "#education ~ .pvs-list__outer-container .pvs-list__item",
    ".education-section .pvs-list__item",
    "section#education .pvs-list__item",
  ]

  for (const eduSelector of educationSelectors) {
    const educationSections = document.querySelectorAll(eduSelector)
    if (educationSections.length > 0) {
      educationSections.forEach((section) => {
        const schoolEl = section.querySelector(".mr1.t-bold span[aria-hidden='true'], .t-bold span")
        const degreeEl = section.querySelector(".t-14.t-normal span[aria-hidden='true'], .t-normal span")
        const dateEl = section.querySelector(".t-14.t-normal.t-black--light span[aria-hidden='true'], .t-black--light span")

        const school = schoolEl?.textContent?.trim()
        if (school) {
          const education: any = {
            school: school,
            degree: degreeEl?.textContent?.trim() || "",
            dateRange: dateEl?.textContent?.trim() || "",
          }

          // Extract graduation year
          const yearMatch = education.dateRange.match(/\d{4}/)
          if (yearMatch) {
            education.graduationYear = yearMatch[0]
          }

          structured.education.push(education)
        }
      })
      break
    }
  }

  // Extract skills
  const skillSelectors = [
    "#skills ~ .pvs-list__outer-container .pvs-list__item",
    ".skills-section .pvs-list__item",
    "section#skills .pvs-list__item",
  ]

  for (const skillSelector of skillSelectors) {
    const skillElements = document.querySelectorAll(skillSelector)
    if (skillElements.length > 0) {
      skillElements.forEach((skillEl) => {
        const skillName = skillEl.querySelector(".mr1.t-bold span[aria-hidden='true'], .t-bold span")?.textContent?.trim()
        if (skillName) {
          structured.skills.push({ name: skillName })
        }
      })
      break
    }
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
