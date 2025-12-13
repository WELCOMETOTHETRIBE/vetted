/**
 * Utility functions for exporting data to CSV and JSON
 */

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(data: T[]): string {
  if (!data || data.length === 0) {
    return ""
  }

  // Get all unique keys from all objects
  const keys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => keys.add(key))
  })

  const headers = Array.from(keys)

  // Escape CSV values
  function escapeCSV(value: any): string {
    if (value === null || value === undefined) {
      return ""
    }
    if (Array.isArray(value)) {
      return value.join("; ")
    }
    if (typeof value === "object") {
      return JSON.stringify(value)
    }
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Create CSV lines
  const lines = [headers.map(escapeCSV).join(",")]
  data.forEach((item) => {
    const row = headers.map((header) => escapeCSV(item[header]))
    lines.push(row.join(","))
  })

  return lines.join("\n")
}

/**
 * Download data as CSV file
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = "export.csv"
): void {
  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download data as JSON file
 */
export function downloadJSON<T>(data: T, filename: string = "export.json"): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy data to clipboard as JSON
 */
export async function copyToClipboard(data: any): Promise<void> {
  const json = JSON.stringify(data, null, 2)
  await navigator.clipboard.writeText(json)
}

/**
 * Copy CSV to clipboard
 */
export async function copyCSVToClipboard<T extends Record<string, any>>(data: T[]): Promise<void> {
  const csv = convertToCSV(data)
  await navigator.clipboard.writeText(csv)
}

