"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceReport, KPIReport, DepartmentReport } from "@/components/reports";
import { exportReport } from "@/lib/utils/exportReport";
import { toast } from "sonner";
import { FileText, TrendingUp, Target, Building2 } from "lucide-react";

/**
 * Reports & Analytics Page
 * Comprehensive reporting system with multiple report types
 */
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("performance");

  const handleExport = (data: any, reportName: string) => {
    try {
      exportReport(data, reportName, "csv");
      toast.success("Report exported successfully!", {
        description: `${reportName} has been downloaded as CSV.`,
      });
    } catch (error) {
      toast.error("Failed to export report", {
        description: "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into organizational performance and metrics
          </p>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="kpi" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="department" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceReport
            onExport={(data) => handleExport(data, "performance-report")}
          />
        </TabsContent>

        <TabsContent value="kpi" className="space-y-6">
          <KPIReport onExport={(data) => handleExport(data, "kpi-report")} />
        </TabsContent>

        <TabsContent value="department" className="space-y-6">
          <DepartmentReport
            onExport={(data) => handleExport(data, "department-report")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
