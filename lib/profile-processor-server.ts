/**
 * Server-side LinkedIn profile processor
 * Uses the same logic as extension/profileProcessor.js but adapted for Node.js
 * Processes HTML scraped from LinkedIn profiles into structured candidate data
 */

import { JSDOM } from "jsdom"

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

  // Extract name from various possible selectors
  const nameSelectors = [
    "h1.text-heading-xlarge",
    "h1[data-anonymize='person-name']",
    ".pv-text-details__left-panel h1",
    "h1.top-card-layout__title",
    "h1.break-words",
  ]
  for (const selector of nameSelectors) {
    const nameEl = document.querySelector(selector)
    if (nameEl) {
      const nameText = nameEl.textContent?.trim()
      if (nameText && nameText.length > 1) {
        structured.personal_info.name = nameText
        break
      }
    }
  }

  // Extract headline
  const headlineSelectors = [
    ".text-body-medium.break-words",
    ".pv-text-details__left-panel .text-body-medium",
    ".top-card-layout__headline",
    ".text-body-medium",
  ]
  for (const selector of headlineSelectors) {
    const headlineEl = document.querySelector(selector)
    if (headlineEl) {
      const headlineText = headlineEl.textContent?.trim()
      if (headlineText && !headlineText.includes("connections")) {
        structured.personal_info.headline = headlineText
        break
      }
    }
  }

  // Extract location
  const locationSelectors = [
    ".text-body-small.inline.t-black--light.break-words",
    ".pv-text-details__left-panel .text-body-small",
    ".top-card-layout__first-subline",
    ".text-body-small",
  ]
  for (const selector of locationSelectors) {
    const locationEl = document.querySelector(selector)
    if (locationEl) {
      const locationText = locationEl.textContent?.trim()
      if (locationText && !locationText.includes("connections") && !locationText.includes("followers")) {
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
