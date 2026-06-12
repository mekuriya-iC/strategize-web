/**
 * Performance Export Utilities
 * Handles export of performance data to Excel, PDF, and CSV formats
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PerformanceExportData {
  employeeId: string;
  fullName: string;
  title?: string;
  department?: string;
  role: string;
  kpiScore: number;
  competencyScore: number;
  activityScore: number;
  overallScore: number;
  rating: string;
}

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  includeCharts?: boolean;
  includeSummary?: boolean;
  scope: 'current' | 'selected' | 'all';
  periodName?: string;
  organizationName?: string;
}

/**
 * Export performance data to Excel (XLSX)
 */
export async function exportToExcel(
  data: PerformanceExportData[],
  options: ExportOptions,
  summaryStats?: {
    teamSize: number;
    averageScore: number;
    topScore: number;
    excellenceRate: number;
  }
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet (if requested)
  if (options.includeSummary && summaryStats) {
    const summaryData = [
      ['Performance Report Summary'],
      ['Organization', options.organizationName || 'N/A'],
      ['Period', options.periodName || 'Current Period'],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['Key Metrics'],
      ['Team Size', summaryStats.teamSize],
      ['Average Score', `${summaryStats.averageScore.toFixed(1)}%`],
      ['Top Score', `${summaryStats.topScore.toFixed(1)}%`],
      ['Excellence Rate', `${summaryStats.excellenceRate.toFixed(1)}%`],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  // Performance Details Sheet
  const detailsData = data.map((item) => ({
    'Employee ID': item.employeeId,
    'Full Name': item.fullName,
    'Title': item.title || 'N/A',
    'Department': item.department || 'N/A',
    'Role': item.role,
    'KPI Score': `${item.kpiScore.toFixed(1)}%`,
    '360° Score': `${item.competencyScore.toFixed(1)}%`,
    'Activity Score': `${item.activityScore.toFixed(1)}%`,
    'Overall Score': `${item.overallScore.toFixed(1)}%`,
    'Rating': item.rating,
  }));

  const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
  
  // Set column widths
  detailsSheet['!cols'] = [
    { wch: 15 }, // Employee ID
    { wch: 25 }, // Full Name
    { wch: 20 }, // Title
    { wch: 20 }, // Department
    { wch: 15 }, // Role
    { wch: 12 }, // KPI Score
    { wch: 12 }, // 360° Score
    { wch: 15 }, // Activity Score
    { wch: 15 }, // Overall Score
    { wch: 20 }, // Rating
  ];

  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Performance Details');

  // Generate and download file
  const fileName = `Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export performance data to PDF
 */
export async function exportToPDF(
  data: PerformanceExportData[],
  options: ExportOptions,
  summaryStats?: {
    teamSize: number;
    averageScore: number;
    topScore: number;
    excellenceRate: number;
  }
): Promise<void> {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Report', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Organization: ${options.organizationName || 'N/A'}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Period: ${options.periodName || 'Current Period'}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPosition);
  yPosition += 10;

  // Summary Statistics (if requested)
  if (options.includeSummary && summaryStats) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryText = [
      `Team Size: ${summaryStats.teamSize}`,
      `Average Score: ${summaryStats.averageScore.toFixed(1)}%`,
      `Top Score: ${summaryStats.topScore.toFixed(1)}%`,
      `Excellence Rate: ${summaryStats.excellenceRate.toFixed(1)}%`,
    ];

    summaryText.forEach((text) => {
      doc.text(text, 14, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
  }

  // Performance Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Details', 14, yPosition);
  yPosition += 5;

  const tableData = data.map((item) => [
    item.fullName,
    item.title || 'N/A',
    item.department || 'N/A',
    `${item.kpiScore.toFixed(0)}%`,
    `${item.competencyScore.toFixed(0)}%`,
    `${item.activityScore.toFixed(0)}%`,
    `${item.overallScore.toFixed(0)}%`,
    item.rating,
  ]);

  autoTable(doc, {
    startY: yPosition + 5,
    head: [['Name', 'Title', 'Department', 'KPI', '360°', 'Activity', 'Overall', 'Rating']],
    body: tableData,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 30 },
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // Save PDF
  const fileName = `Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Export performance data to CSV
 */
export async function exportToCSV(
  data: PerformanceExportData[],
  options: ExportOptions
): Promise<void> {
  const headers = [
    'Employee ID',
    'Full Name',
    'Title',
    'Department',
    'Role',
    'KPI Score (%)',
    '360° Score (%)',
    'Activity Score (%)',
    'Overall Score (%)',
    'Rating',
  ];

  const rows = data.map((item) => [
    item.employeeId,
    item.fullName,
    item.title || 'N/A',
    item.department || 'N/A',
    item.role,
    item.kpiScore.toFixed(1),
    item.competencyScore.toFixed(1),
    item.activityScore.toFixed(1),
    item.overallScore.toFixed(1),
    item.rating,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Main export function - routes to appropriate export handler
 */
export async function exportPerformanceData(
  data: PerformanceExportData[],
  options: ExportOptions,
  summaryStats?: {
    teamSize: number;
    averageScore: number;
    topScore: number;
    excellenceRate: number;
  }
): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  switch (options.format) {
    case 'excel':
      await exportToExcel(data, options, summaryStats);
      break;
    case 'pdf':
      await exportToPDF(data, options, summaryStats);
      break;
    case 'csv':
      await exportToCSV(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Get rating label from score
 */
export function getRatingFromScore(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Exceeds Expectations';
  if (score >= 70) return 'Meets Expectations';
  if (score >= 60) return 'Needs Improvement';
  return 'Below Expectations';
}
