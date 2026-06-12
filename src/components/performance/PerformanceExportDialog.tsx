"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, File, Loader2 } from 'lucide-react';
import {
  exportPerformanceData,
  PerformanceExportData,
  ExportOptions,
} from '@/lib/utils/performance-export';
import { toast } from 'sonner';

interface PerformanceExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PerformanceExportData[];
  selectedData?: PerformanceExportData[];
  summaryStats?: {
    teamSize: number;
    averageScore: number;
    topScore: number;
    excellenceRate: number;
  };
  periodName?: string;
  organizationName?: string;
}

export function PerformanceExportDialog({
  open,
  onOpenChange,
  data,
  selectedData = [],
  summaryStats,
  periodName,
  organizationName,
}: PerformanceExportDialogProps) {
  const [format, setFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [includeCharts, setIncludeCharts] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [scope, setScope] = useState<'current' | 'selected' | 'all'>('current');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Determine which data to export
      let exportData: PerformanceExportData[] = [];
      if (scope === 'selected' && selectedData.length > 0) {
        exportData = selectedData;
      } else if (scope === 'all') {
        exportData = data;
      } else {
        exportData = data;
      }

      if (exportData.length === 0) {
        toast.error('No data to export');
        return;
      }

      const options: ExportOptions = {
        format,
        includeCharts,
        includeSummary,
        scope,
        periodName,
        organizationName,
      };

      await exportPerformanceData(exportData, options, summaryStats);

      toast.success(`Successfully exported ${exportData.length} records as ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getDataCount = () => {
    if (scope === 'selected') return selectedData.length;
    if (scope === 'all') return data.length;
    return data.length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Performance Report
          </DialogTitle>
          <DialogDescription>
            Choose your preferred export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Excel (.xlsx)</p>
                    <p className="text-xs text-muted-foreground">
                      Best for data analysis and manipulation
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium">PDF Report</p>
                    <p className="text-xs text-muted-foreground">
                      Professional formatted report
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <File className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">CSV (.csv)</p>
                    <p className="text-xs text-muted-foreground">
                      Simple format compatible with all tools
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                />
                <Label htmlFor="summary" className="text-sm cursor-pointer">
                  Summary statistics
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  disabled={format === 'csv'}
                />
                <Label
                  htmlFor="charts"
                  className={`text-sm ${format === 'csv' ? 'opacity-50' : 'cursor-pointer'}`}
                >
                  Charts and visualizations {format === 'csv' && '(not available for CSV)'}
                </Label>
              </div>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Scope</Label>
            <RadioGroup value={scope} onValueChange={(value: any) => setScope(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" />
                <Label htmlFor="current" className="text-sm cursor-pointer">
                  Current view ({data.length} employees)
                </Label>
              </div>
              {selectedData.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected" className="text-sm cursor-pointer">
                    Selected only ({selectedData.length} employees)
                  </Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="text-sm cursor-pointer">
                  Entire organization ({data.length} employees)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export Summary */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Export Preview
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {getDataCount()} employees • {format.toUpperCase()} format
              {includeSummary && ' • Includes summary'}
              {includeCharts && ' • Includes charts'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || getDataCount() === 0}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
