/**
 * Report Export Utilities
 * Functions for exporting reports to CSV and JSON formats
 */

export type ExportFormat = "csv" | "json";

/**
 * Convert data to CSV format
 */
function convertToCSV(data: Array<Record<string, unknown>>): string {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map(escapeCSVValue).join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => escapeCSVValue(row[header]));
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

function escapeCSVValue(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const safe = /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  const escaped = safe.replace(/"/g, '""');
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

/**
 * Download a file with given content
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export report data to CSV
 */
export function exportToCSV(data: unknown, filename: string) {
  let csvContent = "";

  // Handle different data structures
  if (Array.isArray(data)) {
    csvContent = convertToCSV(data as Array<Record<string, unknown>>);
  } else if (data !== null && typeof data === "object") {
    // Convert object to array of key-value pairs
    const flatData = Object.entries(data as Record<string, unknown>).map(
      ([key, value]) => ({
        metric: key,
        value: typeof value === "object" ? JSON.stringify(value) : value,
      }),
    );
    csvContent = convertToCSV(flatData);
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.csv`;

  downloadFile(csvContent, fullFilename, "text/csv;charset=utf-8;");
}

/**
 * Export report data to JSON
 */
export function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.json`;

  downloadFile(jsonContent, fullFilename, "application/json;charset=utf-8;");
}

/**
 * Export report with metadata
 */
export function exportReport(
  data: unknown,
  reportName: string,
  format: ExportFormat = "csv",
  metadata?: Record<string, unknown>,
) {
  const reportData = {
    reportName,
    generatedAt: new Date().toISOString(),
    ...metadata,
    data,
  };

  if (format === "csv") {
    // For CSV, export just the data array
    exportToCSV(Array.isArray(data) ? data : [data], reportName);
  } else {
    // For JSON, export everything including metadata
    exportToJSON(reportData, reportName);
  }
}

/**
 * Format number for display
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
