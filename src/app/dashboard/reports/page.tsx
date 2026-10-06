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
  SupportPerformanceReport,
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
  Minus,
  Network
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { GET_KPI_QUARTER_PERFORMANCE_REPORT } from "@/lib/graphql/queries/quarterly-performance";
import { resolveReportingPeriodContext } from "@/lib/reports/reportingPeriodContext";
import type { KpiQuarterPerformanceReport } from "@/types/graphql";

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
          employeeId
          fullName
        }
        overallPercentage
      }
    }
  }
`;

// Wrap the main content in a component to use useSearchParams
function ReportsContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const { selectedPeriod } = useStrategicPeriodStore();
  const { strategicPeriods } = useActiveStrategicPlanPeriods();
  const reportContext = useMemo(
    () => resolveReportingPeriodContext(selectedPeriod, strategicPeriods),
    [selectedPeriod, strategicPeriods],
  );

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
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  // Use the same quarterly result engine as the detailed report and dashboard.
  const { data: scorecardData } = useQuery<{
    kpiQuarterPerformanceReport: KpiQuarterPerformanceReport;
  }>(GET_KPI_QUARTER_PERFORMANCE_REPORT, {
    variables: {
      filters: {
        annualStrategicPeriodId:
          reportContext?.annualPeriod.strategicPeriodId,
        quarterNumber: reportContext?.quarterNumber,
        level: "CORPORATE",
        cascadeType: "TARGET_ALLOCATION",
        page: 1,
        limit: 1,
      },
    },
    skip:
      !hasFullAccess ||
      !reportContext?.annualPeriod.strategicPeriodId,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  const teamPerformance = summaryData?.unifiedTeamPerformance;
  const scorecard = scorecardData?.kpiQuarterPerformanceReport;

  // Calculate metrics
  const totalEmployees = teamPerformance?.results?.length || 0;
  const avgPerformance = teamPerformance?.averageScore || 0;
  const topPerformerScore = teamPerformance?.highestScore || 0;
  const hasKpiResults =
    (scorecard?.summary.finalCount || 0) +
      (scorecard?.summary.provisionalCount || 0) >
    0;
  const kpiAchievement = scorecard
    ? scorecard.summary.weightedAchievementRate * 100
    : 0;

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

  // Normalize deep-link tab ids from the sidebar (e.g. my-submissions → submissions)
  const defaultTabValue = useMemo(() => {
    const raw = searchParams.get("tab");
    const paramTab =
      raw === "my-submissions" ? "submissions" : raw;
    if (paramTab && !(user?.role === 'CEO' && paramTab === 'submissions')) return paramTab;

    if (hasFullAccess) return "kpi-performance";
    if (isManager) return "performance";
    return "individual";
  }, [searchParams, hasFullAccess, isManager, user?.role]);

  const [activeTab, setActiveTab] = useState<string>(defaultTabValue);
  // Keep visited tab panels mounted so Apollo queries do not cold-restart
  // and show Loading on every tab switch.
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([defaultTabValue]),
  );

  useEffect(() => {
    setActiveTab(defaultTabValue);
    setVisitedTabs((prev) => {
      if (prev.has(defaultTabValue)) return prev;
      const next = new Set(prev);
      next.add(defaultTabValue);
      return next;
    });
  }, [defaultTabValue]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setVisitedTabs((prev) => {
      if (prev.has(value)) return prev;
      const next = new Set(prev);
      next.add(value);
      return next;
    });
  };

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
  };  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/70 p-6 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-violet-950/30 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/20 blur-3xl dark:from-indigo-500/20 dark:to-violet-500/25" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="flex items-center gap-1.5 border-0 bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-700 backdrop-blur-sm dark:bg-indigo-400/10 dark:text-indigo-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                </span>
                Executive Analytics & Audit
              </Badge>
              {selectedPeriod && (
                <Badge
                  variant="outline"
                  className="rounded-full border-slate-300/80 bg-white/70 px-3 py-0.5 text-xs font-medium text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-800/70 dark:text-zinc-300"
                >
                  <Calendar className="mr-1.5 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  {selectedPeriod.name}
                </Badge>
              )}
              {(selectedPeriod as any)?.isActive && (
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-300/80 bg-emerald-50/80 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <Zap className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  Active Cycle
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
              Performance & Reports
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-base">
              {hasFullAccess
                ? "Complete organizational performance analytics, strategic audit tracking, and quarterly KPI scorecards."
                : isManager
                ? "Team performance overview, departmental achievement metrics, and staff evaluations."
                : "Your personal performance metrics, verified logbook achievements, and submission history."}
            </p>
          </div>

          {hasFullAccess && teamPerformance && (
            <div className="flex shrink-0 items-center gap-3">
              <Button
                onClick={() => handleExport(teamPerformance.results, "executive-performance-summary")}
                className="group rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-500/20 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-100"
              >
                <Download className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span>Export Executive Summary</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Executive Pulse Cards */}
      {hasFullAccess && teamPerformance && !summaryLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Employees */}
          <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/60 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/60">
            <div
              className="absolute inset-x-0 top-0 h-[3px] opacity-80 transition-opacity group-hover:opacity-100"
              style={{ background: "linear-gradient(90deg, #4f46e5, #8b5cf6)" }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Total Employees
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-zinc-100">
                    {totalEmployees}
                  </span>
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-bold">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs transition-transform duration-200 group-hover:scale-105 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
              Assigned and tracked this strategic period
            </p>
          </Card>

          {/* Average Performance */}
          <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/60 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/60">
            <div
              className="absolute inset-x-0 top-0 h-[3px] opacity-80 transition-opacity group-hover:opacity-100"
              style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Avg Performance
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold tracking-tight tabular-nums ${getScoreColor(avgPerformance)}`}>
                    {avgPerformance.toFixed(1)}%
                  </span>
                  <div className="rounded-full bg-slate-100 p-1 dark:bg-zinc-800">
                    {getTrendIcon(avgPerformance)}
                  </div>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-xs transition-transform duration-200 group-hover:scale-105 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
              Organization-wide composite average
            </p>
          </Card>

          {/* KPI Achievement */}
          <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/60 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/60">
            <div
              className="absolute inset-x-0 top-0 h-[3px] opacity-80 transition-opacity group-hover:opacity-100"
              style={{ background: "linear-gradient(90deg, #f59e0b, #ec4899)" }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  KPI Achievement
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold tracking-tight tabular-nums ${getScoreColor(kpiAchievement)}`}>
                    {hasKpiResults ? `${kpiAchievement.toFixed(1)}%` : "—"}
                  </span>
                  {hasKpiResults && (
                    <div className="rounded-full bg-slate-100 p-1 dark:bg-zinc-800">
                      {getTrendIcon(kpiAchievement)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-xs transition-transform duration-200 group-hover:scale-105 dark:bg-amber-950/60 dark:text-amber-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
              {hasKpiResults
                ? "Calculated quarter-plan weighted result"
                : "Awaiting calculated KPI scorecards"}
            </p>
          </Card>

          {/* Top Performer */}
          <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/60 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/60">
            <div
              className="absolute inset-x-0 top-0 h-[3px] opacity-80 transition-opacity group-hover:opacity-100"
              style={{ background: "linear-gradient(90deg, #8b5cf6, #3b82f6)" }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Top Performer
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-600 tabular-nums dark:text-emerald-400">
                    {topPerformerScore.toFixed(1)}%
                  </span>
                  <Badge variant="outline" className="rounded-full border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Leader
                  </Badge>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shadow-xs transition-transform duration-200 group-hover:scale-105 dark:bg-violet-950/60 dark:text-violet-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 truncate text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {teamPerformance.topPerformer?.employee?.fullName || "Awaiting rankings"}
            </p>
          </Card>
        </div>
      )}

      {/* Performance Breakdown Deep-Dive */}
      {hasFullAccess && teamPerformance && !summaryLoading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Component Scores */}
          <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Performance Components
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Weighted breakdown across all evaluated dimensions
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full font-semibold">
                3 Pillars
              </Badge>
            </div>

            <div className="mt-5 space-y-4.5">
              {/* KPI Performance */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-zinc-300">KPI Performance Goal</span>
                  <span className={`tabular-nums ${getScoreColor(avgKPI)}`}>
                    {avgKPI.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(avgKPI, 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* 360 Competency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-zinc-300">360° Competency Matrix</span>
                  <span className={`tabular-nums ${getScoreColor(avgCompetency)}`}>
                    {avgCompetency.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(avgCompetency, 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Activity Metrics */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-zinc-300">Operational Activity Score</span>
                  <span className={`tabular-nums ${getScoreColor(avgActivity)}`}>
                    {avgActivity.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(avgActivity, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Rating Distribution */}
          <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                    <Award className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Rating Distribution
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Organizational talent tier allocation
                </p>
              </div>
              <Badge variant="outline" className="rounded-full font-semibold">
                {totalEmployees} Employees
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {Object.entries(ratingDistribution).map(([rating, count]: [string, any]) => {
                const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
                const badgeColor =
                  rating === "Exceptional"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                    : rating === "Exceeds Expectations"
                    ? "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60"
                    : rating === "Meets Expectations"
                    ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                    : "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60";

                return (
                  <div
                    key={rating}
                    className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-2.5 transition-colors hover:bg-slate-50 dark:border-white/[0.06] dark:bg-zinc-900/50 dark:hover:bg-zinc-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
                        {rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
                        {count}
                      </span>
                      <span className="text-slate-400 dark:text-zinc-500">
                        ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Modern High-End Report Tabs */}
      {activeTab && (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/80"
        >
          <div className="border-b border-slate-200/80 bg-slate-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-3">
            <TabsList
              aria-label="Report navigation"
              className="flex w-full flex-wrap gap-1 bg-transparent p-0"
            >
              {/* Quarterly KPI Performance - server-scoped for every role */}
              <TabsTrigger
                value="quarterly"
                className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Quarterly KPI</span>
                <span className="sm:hidden">Quarterly</span>
              </TabsTrigger>

              {/* KPI Performance - Full access only */}
              {hasFullAccess && (
                <TabsTrigger
                  value="kpi-performance"
                  className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
                >
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">KPI Performance</span>
                  <span className="sm:hidden">KPI</span>
                </TabsTrigger>
              )}

              {/* Support Performance - server-scoped for every role */}
              <TabsTrigger
                value="support"
                className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
              >
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Support Matrix</span>
                <span className="sm:hidden">Support</span>
              </TabsTrigger>

              {/* Unified Performance - All users */}
              <TabsTrigger
                value="performance"
                className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isManager ? "Team Performance" : "My Performance"}
                </span>
                <span className="sm:hidden">Performance</span>
              </TabsTrigger>

              {/* Individual Performance - All users */}
              <TabsTrigger
                value="individual"
                className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Individual View</span>
                <span className="sm:hidden">Individual</span>
              </TabsTrigger>

              {/* My Submissions - All users */}
              {user?.role !== "CEO" && (
                <TabsTrigger
                  value="submissions"
                  className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">My Submissions</span>
                  <span className="sm:hidden">Submissions</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="p-4 sm:p-6">
            {/* KPI Performance Analytics (Full Access Only) */}
            {hasFullAccess && visitedTabs.has("kpi-performance") && (
              <TabsContent
                value="kpi-performance"
                forceMount
                className={activeTab === "kpi-performance" ? "space-y-6" : "hidden"}
              >
                <KPIPerformanceAnalytics
                  key={selectedPeriod?.strategicPeriodId ?? "no-period"}
                  onExport={(data) => handleExport(data, "kpi-performance-analytics")}
                />
              </TabsContent>
            )}

            {/* Quarterly KPI Performance (All Users - Server Scoped) */}
            {visitedTabs.has("quarterly") && (
              <TabsContent
                value="quarterly"
                forceMount
                className={activeTab === "quarterly" ? "space-y-6" : "hidden"}
              >
                <QuarterlyPerformanceReport
                  key={selectedPeriod?.strategicPeriodId ?? "no-period"}
                />
              </TabsContent>
            )}

            {/* Support Performance (All Users - Server Scoped) */}
            {visitedTabs.has("support") && (
              <TabsContent
                value="support"
                forceMount
                className={activeTab === "support" ? "space-y-6" : "hidden"}
              >
                <SupportPerformanceReport
                  key={selectedPeriod?.strategicPeriodId ?? "no-period"}
                />
              </TabsContent>
            )}

            {/* Unified Performance (All Users - Role-Based) */}
            {visitedTabs.has("performance") && (
              <TabsContent
                value="performance"
                forceMount
                className={activeTab === "performance" ? "space-y-6" : "hidden"}
              >
                <UnifiedPerformanceReport
                  viewMode={isManager ? "team" : "personal"}
                  onExport={(data) => handleExport(data, "unified-performance-report")}
                />
              </TabsContent>
            )}

            {/* Individual Performance View (All Users) */}
            {visitedTabs.has("individual") && (
              <TabsContent
                value="individual"
                forceMount
                className={activeTab === "individual" ? "space-y-6" : "hidden"}
              >
                <UnifiedPerformanceReport
                  viewMode="personal"
                  onExport={(data) => handleExport(data, "individual-performance-report")}
                />
              </TabsContent>
            )}

            {/* My Submissions (All Users) */}
            {user?.role !== "CEO" && visitedTabs.has("submissions") && (
              <TabsContent
                value="submissions"
                forceMount
                className={activeTab === "submissions" ? "space-y-6" : "hidden"}
              >
                <MySubmissionsReport
                  onExport={(data) => handleExport(data, "my-submissions-report")}
                />
              </TabsContent>
            )}
          </div>
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
