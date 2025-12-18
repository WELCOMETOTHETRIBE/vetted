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

  // Apply replacements
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
    query = query.replace(regex, value)
  })

  // Add include keywords
  if (vars.includeKeywords && vars.includeKeywords.length > 0) {
    const includeStr = vars.includeKeywords.map((k) => `"${k}"`).join(" OR ")
    query = `(${query}) AND (${includeStr})`
  }

  // Add exclude keywords
  if (vars.excludeKeywords && vars.excludeKeywords.length > 0) {
    const excludeStr = vars.excludeKeywords.map((k) => `-${k}`).join(" ")
    query = `${query} ${excludeStr}`
  }

  // Add domain focus keywords
  if (vars.domainFocus && vars.domainFocus.length > 0) {
    const domainStr = vars.domainFocus.map((d) => `"${d}"`).join(" OR ")
    query = `(${query}) AND (${domainStr})`
  }

  // Add seniority filters (if not already in template)
  if (vars.seniority && vars.seniority.length > 0 && !query.includes("Staff") && !query.includes("Principal")) {
    const seniorityStr = vars.seniority.map((s) => `"${s}"`).join(" OR ")
    query = `(${query}) AND (${seniorityStr})`
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

