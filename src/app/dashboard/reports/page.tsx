"use client";

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceReport, KPIReport, DepartmentReport, MySubmissionsReport } from "@/components/reports";
import { exportReport } from "@/lib/utils/exportReport";
import { toast } from "sonner";
import { TrendingUp, Target, Building2, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores";

// Wrap the main content in a component to use useSearchParams
function ReportsContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  
  const hasFullAccess =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "HR" ||
    user?.role === "DIRECTOR";

  const initialTab = searchParams.get("tab") || "performance";
  const [activeTab, setActiveTab] = useState(initialTab);

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
            {hasFullAccess 
              ? "Comprehensive insights into organizational performance and metrics"
              : "Personal performance overview and submission history"}
          </p>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${hasFullAccess ? "grid-cols-4" : "grid-cols-2"} lg:w-auto lg:inline-grid`}>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          
          {hasFullAccess && (
            <>
              <TabsTrigger value="kpi" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">KPIs</span>
              </TabsTrigger>
              <TabsTrigger value="department" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Departments</span>
              </TabsTrigger>
            </>
          )}

          <TabsTrigger value="my-submissions" className="gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">My Submissions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceReport
            onExport={(data) => handleExport(data, "performance-report")}
          />
        </TabsContent>

        {hasFullAccess && (
          <>
            <TabsContent value="kpi" className="space-y-6">
              <KPIReport onExport={(data) => handleExport(data, "kpi-report")} />
            </TabsContent>

            <TabsContent value="department" className="space-y-6">
              <DepartmentReport
                onExport={(data) => handleExport(data, "department-report")}
              />
            </TabsContent>
          </>
        )}

        <TabsContent value="my-submissions" className="space-y-6">
          <MySubmissionsReport
            onExport={(data) => handleExport(data, "my-submissions-report")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Reports & Analytics Page
 * Comprehensive reporting system with multiple report types
 */
export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
