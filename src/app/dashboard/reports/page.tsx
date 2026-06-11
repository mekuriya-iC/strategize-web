"use client";

import { Suspense, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MySubmissionsReport,
  KPIPerformanceAnalytics,
} from "@/components/reports";
import UnifiedPerformanceReport from "@/components/reports/UnifiedPerformanceReport";
import { exportReport } from "@/lib/utils/exportReport";
import { toast } from "sonner";
import { TrendingUp, Target, Send, Activity } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores";

// Wrap the main content in a component to use useSearchParams
function ReportsContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess =
    !!user?.role && fullAccessRoles.has(user.role as string);
  
  const managerRoles = new Set(["MANAGER", "DIRECTOR", "CEO", "SUPER_ADMIN", "ADMIN", "HR"]);
  const isManager = !!user?.role && managerRoles.has(user.role as string);

  // Determine default tab based on role
  const getDefaultTab = () => {
    const paramTab = searchParams.get("tab");
    if (paramTab) return paramTab;
    
    if (hasFullAccess) return "kpi-performance";
    if (isManager) return "performance";
    return "individual";
  };

  const [activeTab, setActiveTab] = useState<string>("");

  // Set default tab when user loads
  useEffect(() => {
    if (user && !activeTab) {
      setActiveTab(getDefaultTab());
    }
  }, [user, activeTab]);

  // Update tab when it changes via search params
  useEffect(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab && paramTab !== activeTab) {
      setActiveTab(paramTab);
    }
  }, [searchParams]);

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
            Performance & Reports
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {hasFullAccess
              ? "Complete organizational performance analytics and KPI tracking"
              : isManager
              ? "Team performance overview and personal metrics"
              : "Your personal performance metrics and achievement history"}
          </p>
        </div>
      </div>

      {/* Report Tabs */}
      {activeTab && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto">
          {/* KPI Performance - Full access only */}
          {hasFullAccess && (
            <TabsTrigger value="kpi-performance" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">KPI Performance</span>
              <span className="sm:hidden">KPI</span>
            </TabsTrigger>
          )}

          {/* Unified Performance - All users */}
          <TabsTrigger value="performance" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isManager ? "Team Performance" : "My Performance"}
            </span>
            <span className="sm:hidden">Performance</span>
          </TabsTrigger>

          {/* Individual Performance - All users */}
          <TabsTrigger value="individual" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Individual View</span>
            <span className="sm:hidden">Individual</span>
          </TabsTrigger>

          {/* My Submissions - All users */}
          <TabsTrigger value="submissions" className="gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">My Submissions</span>
            <span className="sm:hidden">Submissions</span>
          </TabsTrigger>
        </TabsList>

        {/* KPI Performance Analytics (Full Access Only) */}
        {hasFullAccess && (
          <TabsContent value="kpi-performance" className="space-y-6">
            <KPIPerformanceAnalytics
              onExport={(data) => handleExport(data, "kpi-performance-analytics")}
            />
          </TabsContent>
        )}

        {/* Unified Performance (All Users - Role-Based) */}
        <TabsContent value="performance" className="space-y-6">
          <UnifiedPerformanceReport
            viewMode={isManager ? "team" : "personal"}
            onExport={(data) => handleExport(data, "unified-performance-report")}
          />
        </TabsContent>

        {/* Individual Performance View (All Users) */}
        <TabsContent value="individual" className="space-y-6">
          <UnifiedPerformanceReport
            viewMode="personal"
            onExport={(data) => handleExport(data, "individual-performance-report")}
          />
        </TabsContent>

        {/* My Submissions (All Users) */}
        <TabsContent value="submissions" className="space-y-6">
          <MySubmissionsReport
            onExport={(data) => handleExport(data, "my-submissions-report")}
          />
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}

/**
 * Performance & Reports Page
 * Comprehensive, role-based performance reporting system
 * 
 * Access Levels:
 * - Full Access (SUPER_ADMIN, ADMIN, HR, CEO): KPI Analytics + All Reports
 * - Managers (MANAGER, DIRECTOR): Team Performance + Personal Reports
 * - Employees: Personal Performance + Submissions Only
 */
export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
