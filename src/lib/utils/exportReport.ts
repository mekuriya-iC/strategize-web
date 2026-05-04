/**
 * Report Export Utilities
 * Functions for exporting reports to CSV and JSON formats
 */

export type ExportFormat = "csv" | "json";

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(",") ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
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
export function exportToCSV(data: any, filename: string) {
  let csvContent = "";

  // Handle different data structures
  if (Array.isArray(data)) {
    csvContent = convertToCSV(data);
  } else if (typeof data === "object") {
    // Convert object to array of key-value pairs
    const flatData = Object.entries(data).map(([key, value]) => ({
      metric: key,
      value: typeof value === "object" ? JSON.stringify(value) : value,
    }));
    csvContent = convertToCSV(flatData);
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.csv`;

  downloadFile(csvContent, fullFilename, "text/csv;charset=utf-8;");
}

/**
 * Export report data to JSON
 */
export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.json`;

  downloadFile(jsonContent, fullFilename, "application/json;charset=utf-8;");
}

/**
 * Export report with metadata
 */
export function exportReport(
  data: any,
  reportName: string,
  format: ExportFormat = "csv",
  metadata?: Record<string, any>
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
