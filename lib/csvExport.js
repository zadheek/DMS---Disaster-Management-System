import { Parser } from "@json2csv/plainjs";

/**
 * Sanitize a CSV cell value to prevent formula injection
 * @param {*} val
 * @returns {*}
 */
function sanitizeCsvValue(val) {
  if (typeof val !== "string") return val;
  if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
  return val;
}

/**
 * Export an array of objects to a CSV string
 * @param {Object[]} data - Array of records to export
 * @param {string[]} fields - Column field names to include
 * @returns {string} CSV string
 */
export function exportToCsv(data, fields) {
  try {
    const sanitized = data.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, sanitizeCsvValue(v)])
      )
    );
    const parser = new Parser({ fields });
    return parser.parse(sanitized);
  } catch (err) {
    console.error("CSV export error:", err);
    throw new Error("Failed to generate CSV");
  }
}
