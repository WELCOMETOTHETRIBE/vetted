/**
 * Query builder for Engineer Finder templates
 * Handles variable substitution and query construction
 */

import { QueryTemplate } from "./templates"

export interface QueryVariables {
  location?: string
  company?: string
  roleKeywords?: string
  seniority?: string[]
  domainFocus?: string[]
  includeKeywords?: string[]
  excludeKeywords?: string[]
  source?: string
}

export function buildQuery(template: QueryTemplate, vars: QueryVariables): string {
  let query = template.queryTemplate

  // Replace {{variable}} placeholders
  const replacements: Record<string, string> = {}

  // Location
  if (vars.location) {
    replacements.location = vars.location
  } else if (template.defaultVars.location) {
    replacements.location = String(template.defaultVars.location)
  }

  // Company
  if (vars.company) {
    replacements.company = vars.company
  } else if (template.defaultVars.company) {
    replacements.company = String(template.defaultVars.company)
  }

  // Role keywords
  if (vars.roleKeywords) {
    replacements.roleKeywords = vars.roleKeywords
  } else if (template.defaultVars.roleKeywords) {
    replacements.roleKeywords = String(template.defaultVars.roleKeywords)
  }

  // Apply replacements for placeholders that exist in template
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
    if (query.includes(`{{${key}}}`) || query.includes(`{{ ${key} }}`)) {
      query = query.replace(regex, value)
    }
  })

  // Build additional search terms that aren't in template placeholders
  const additionalTerms: string[] = []

  // Add company if provided and not already in template
  if (vars.company && !query.includes(vars.company) && !query.match(/\{\{.*company.*\}\}/i)) {
    additionalTerms.push(`"${vars.company}"`)
  }

  // Add role keywords if provided and not already in template
  if (vars.roleKeywords && !query.includes(vars.roleKeywords) && !query.match(/\{\{.*roleKeywords.*\}\}/i)) {
    additionalTerms.push(`"${vars.roleKeywords}"`)
  }

  // Add seniority filters
  if (vars.seniority && vars.seniority.length > 0) {
    // Check if seniority terms are already in the query
    const hasSeniorityInQuery = vars.seniority.some((s) =>
      query.toLowerCase().includes(s.toLowerCase())
    )
    if (!hasSeniorityInQuery) {
      const seniorityStr = vars.seniority.map((s) => `"${s}"`).join(" OR ")
      additionalTerms.push(`(${seniorityStr})`)
    }
  }

  // Add domain focus keywords
  if (vars.domainFocus && vars.domainFocus.length > 0) {
    // Check if domain focus terms are already in the query
    const hasDomainInQuery = vars.domainFocus.some((d) =>
      query.toLowerCase().includes(d.toLowerCase())
    )
    if (!hasDomainInQuery) {
      const domainStr = vars.domainFocus.map((d) => `"${d}"`).join(" OR ")
      additionalTerms.push(`(${domainStr})`)
    }
  }

  // Add include keywords
  if (vars.includeKeywords && vars.includeKeywords.length > 0) {
    const includeStr = vars.includeKeywords.map((k) => `"${k}"`).join(" OR ")
    additionalTerms.push(`(${includeStr})`)
  }

  // Combine all additional terms
  if (additionalTerms.length > 0) {
    const additionalQuery = additionalTerms.join(" AND ")
    query = `(${query}) AND (${additionalQuery})`
  }

  // Add exclude keywords (always at the end)
  if (vars.excludeKeywords && vars.excludeKeywords.length > 0) {
    const excludeStr = vars.excludeKeywords.map((k) => `-${k}`).join(" ")
    query = `${query} ${excludeStr}`
  }

  return query.trim()
}

export function validateQuery(query: string): { valid: boolean; error?: string } {
  if (!query || query.trim().length === 0) {
    return { valid: false, error: "Query cannot be empty" }
  }

  if (query.length > 500) {
    return { valid: false, error: "Query is too long (max 500 characters)" }
  }

  // Check for unclosed parentheses
  const openParens = (query.match(/\(/g) || []).length
  const closeParens = (query.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    return { valid: false, error: "Unmatched parentheses in query" }
  }

  return { valid: true }
}

