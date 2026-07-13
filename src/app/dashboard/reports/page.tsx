"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MySubmissionsReport,
  KPIPerformanceAnalytics,
  QuarterlyPerformanceReport,
} from "@/components/reports";
import UnifiedPerformanceReport from "@/components/reports/UnifiedPerformanceReport";
import { exportReport } from "@/lib/utils/exportReport";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Target, 
  Send, 
  Activity, 
  Users, 
  Award,
  BarChart3,
  Download,
  Calendar,
  Zap,
  TrendingDown,
  Minus
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { Button } from "@/components/ui/button";

// GraphQL Queries for Dashboard Metrics
const GET_REPORTS_SUMMARY = gql`
  query GetReportsSummary($filters: UnifiedPerformanceFilters!) {
    unifiedTeamPerformance(filters: $filters) {
      results {
        employeeId
        overallPercentage
        rating
        breakdown {
          kpiScore {
            percentageAchieved
          }
          competencyScore {
            percentageAchieved
          }
          activityScore {
            percentageAchieved
          }
        }
      }
      averageScore
      highestScore
      lowestScore
      topPerformer {
        employee {
          fullName
        }
        overallPercentage
      }
    }
  }
`;

const GET_CORPORATE_SCORECARD = gql`
  query GetCorporateScorecard($organizationId: ID!, $periodId: ID!) {
    realtimeCorporateScorecard(
      organizationId: $organizationId
      periodId: $periodId
      capFinalScore: false
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        level
        achievementRate
      }
    }
  }
`;

// Wrap the main content in a component to use useSearchParams
function ReportsContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const { selectedPeriod } = useStrategicPeriodStore();

  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess =
    !!user?.role && fullAccessRoles.has(user.role as string);
  
  const managerRoles = new Set(["MANAGER", "DIRECTOR", "CEO", "SUPER_ADMIN", "ADMIN", "HR"]);
  const isManager = !!user?.role && managerRoles.has(user.role as string);

  // Fetch performance summary for metrics
  const { data: summaryData, loading: summaryLoading } = useQuery(GET_REPORTS_SUMMARY, {
    variables: {
      filters: {
        strategicPeriodId: selectedPeriod?.strategicPeriodId,
        organizationId: user?.organizationId,
      },
    },
    skip: !hasFullAccess || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Fetch corporate scorecard for KPI metrics
  const { data: scorecardData, loading: scorecardLoading } = useQuery(GET_CORPORATE_SCORECARD, {
    variables: {
      organizationId: user?.organizationId,
      periodId: selectedPeriod?.strategicPeriodId,
    },
    skip: !hasFullAccess || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  const teamPerformance = summaryData?.unifiedTeamPerformance;
  const scorecard = scorecardData?.realtimeCorporateScorecard;

  // Calculate metrics
  const totalEmployees = teamPerformance?.results?.length || 0;
  const avgPerformance = teamPerformance?.averageScore || 0;
  const topPerformerScore = teamPerformance?.highestScore || 0;
  const kpiAchievement = scorecard?.percentageAchieved || 0;

  // Calculate rating distribution (memoized)
  const ratingDistribution = useMemo(() => {
    return teamPerformance?.results?.reduce((acc: any, r: any) => {
      const rating = r.rating || 'Unknown';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {}) || {};
  }, [teamPerformance]);

  // Calculate component averages (memoized)
  const componentAverages = useMemo(() => {
    return teamPerformance?.results?.reduce(
      (acc: any, r: any) => ({
        kpi: acc.kpi + (r.breakdown?.kpiScore?.percentageAchieved || 0),
        competency: acc.competency + (r.breakdown?.competencyScore?.percentageAchieved || 0),
        activity: acc.activity + (r.breakdown?.activityScore?.percentageAchieved || 0),
        count: acc.count + 1,
      }),
      { kpi: 0, competency: 0, activity: 0, count: 0 }
    );
  }, [teamPerformance]);

  const avgKPI = componentAverages?.count ? componentAverages.kpi / componentAverages.count : 0;
  const avgCompetency = componentAverages?.count ? componentAverages.competency / componentAverages.count : 0;
  const avgActivity = componentAverages?.count ? componentAverages.activity / componentAverages.count : 0;

  // Determine default tab based on role (memoized to prevent infinite loops)
  const defaultTabValue = useMemo(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab) return paramTab;
    
    if (hasFullAccess) return "kpi-performance";
    if (isManager) return "performance";
    return "individual";
  }, [searchParams, hasFullAccess, isManager]);

  const [activeTab, setActiveTab] = useState<string>(defaultTabValue);

  // Update tab when search params or role changes
  useEffect(() => {
    setActiveTab(defaultTabValue);
  }, [defaultTabValue]);

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

  const getTrendIcon = (value: number, threshold: number = 75) => {
    if (value >= threshold) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value >= threshold - 10) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
        {selectedPeriod && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{selectedPeriod.name}</span>
            {(selectedPeriod as any).isActive && (
              <Badge variant="default" className="ml-2">
                <Zap className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Executive Summary Cards - For Full Access Users */}
      {hasFullAccess && teamPerformance && !summaryLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Employees */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{totalEmployees}</div>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Being tracked this period
              </p>
            </CardContent>
          </Card>

          {/* Average Performance */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Performance
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className={`text-3xl font-bold ${getScoreColor(avgPerformance)}`}>
                  {avgPerformance.toFixed(1)}%
                </div>
                {getTrendIcon(avgPerformance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Organization-wide average
              </p>
            </CardContent>
          </Card>

          {/* KPI Achievement */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  KPI Achievement
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className={`text-3xl font-bold ${getScoreColor(kpiAchievement)}`}>
                  {kpiAchievement.toFixed(1)}%
                </div>
                {getTrendIcon(kpiAchievement)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Corporate scorecard
              </p>
            </CardContent>
          </Card>

          {/* Top Performer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Performer
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {topPerformerScore.toFixed(1)}%
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {teamPerformance.topPerformer?.employee?.fullName || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Breakdown - For Full Access Users */}
      {hasFullAccess && teamPerformance && !summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Component Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Components
              </CardTitle>
              <CardDescription>
                Average scores across all employees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">KPI Performance</span>
                  <span className={`text-sm font-bold ${getScoreColor(avgKPI)}`}>
                    {avgKPI.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${avgKPI}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">360° Competency</span>
                  <span className={`text-sm font-bold ${getScoreColor(avgCompetency)}`}>
                    {avgCompetency.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${avgCompetency}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Activity Metrics</span>
                  <span className={`text-sm font-bold ${getScoreColor(avgActivity)}`}>
                    {avgActivity.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${avgActivity}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Rating Distribution
              </CardTitle>
              <CardDescription>
                Employee performance ratings breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(ratingDistribution).map(([rating, count]: [string, any]) => (
                  <div key={rating} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          rating === 'Exceptional' ? 'default' :
                          rating === 'Exceeds Expectations' ? 'secondary' :
                          rating === 'Meets Expectations' ? 'outline' :
                          'destructive'
                        }
                      >
                        {rating}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Tabs */}
      {activeTab && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-auto">
          {/* KPI Performance - Full access only */}
          {hasFullAccess && (
            <TabsTrigger value="kpi-performance" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">KPI Performance</span>
              <span className="sm:hidden">KPI</span>
            </TabsTrigger>
          )}

          {/* Quarterly KPI Performance - server-scoped for every role */}
          <TabsTrigger value="quarterly" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Quarterly KPI</span>
            <span className="sm:hidden">Quarterly</span>
          </TabsTrigger>

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

        {/* Quarterly KPI Performance (All Users - Server Scoped) */}
        <TabsContent value="quarterly" className="space-y-6">
          <QuarterlyPerformanceReport
            key={selectedPeriod?.strategicPeriodId ?? "no-period"}
          />
        </TabsContent>

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
