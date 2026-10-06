"use client";

import { useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  Award,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";

// GraphQL Queries
const GET_EMPLOYEE_PERFORMANCE = gql`
  query GetEmployeePerformance($filters: UnifiedPerformanceFilters!) {
    unifiedEmployeePerformance(filters: $filters) {
      employeeId
      employee {
        employeeId
        fullName
        email
        title
      }
      strategicPeriodId
      totalScore
      maxPossibleScore
      overallPercentage
      rating
      breakdown {
        kpiScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
        }
        competencyScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
        }
        activityScore {
          rawScore
          maxScore
          percentageAchieved
          weight
          weightedScore
          source
        }
      }
      trendChange
      calculatedAt
    }
  }
`;

const GET_TEAM_PERFORMANCE = gql`
  query GetTeamPerformance($filters: UnifiedPerformanceFilters!) {
    unifiedTeamPerformance(filters: $filters) {
      results {
        employeeId
        employee {
          employeeId
          fullName
          email
          title
        }
        strategicPeriodId
        totalScore
        maxPossibleScore
        overallPercentage
        rating
        breakdown {
          kpiScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
          }
          competencyScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
          }
          activityScore {
            rawScore
            maxScore
            percentageAchieved
            weight
            weightedScore
          }
        }
      }
      averageScore
      medianScore
      highestScore
      lowestScore
      topPerformer {
        employeeId
        employee {
          employeeId
          fullName
        }
        totalScore
      }
    }
  }
`;

const GET_PERIODS = gql`
  query GetStrategicPeriods($page: Int!, $limit: Int!) {
    strategicPeriods(page: $page, limit: $limit) {
      items {
        strategicPeriodId
        name
        periodType
        startDate
        endDate
        status
      }
    }
  }
`;

interface UnifiedPerformanceReportProps {
  viewMode: "personal" | "team";
  onExport?: (data: any) => void;
}

export default function UnifiedPerformanceReport({
  viewMode,
  onExport,
}: UnifiedPerformanceReportProps) {
  const user = useAuthStore((state) => state.user);
  const {
    selectedPeriod,
    setSelectedPeriod,
  } = useStrategicPeriodStore();

  // Fetch periods
  const { data: periodsData } = useQuery(GET_PERIODS, {
    variables: { page: 1, limit: 100 },
  });
  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((p: any) => {
    const now = new Date();
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });
  const fallbackPeriod = activePeriod || periods[0];
  const selectedPeriodId = selectedPeriod?.strategicPeriodId || "";

  // Keep this view aligned with the shared top-bar strategic period selection.
  useEffect(() => {
    if (!selectedPeriod?.strategicPeriodId && fallbackPeriod) {
      setSelectedPeriod(fallbackPeriod);
    }
  }, [
    fallbackPeriod,
    selectedPeriod?.strategicPeriodId,
    setSelectedPeriod,
  ]);

  // Determine which query to use based on view mode
  const isTeamView = viewMode === "team";
  
  // Personal Performance Query
  const {
    data: personalData,
    loading: personalLoading,
    error: personalError,
  } = useQuery(GET_EMPLOYEE_PERFORMANCE, {
    variables: {
      filters: {
        employeeId: user?.employeeId,
        strategicPeriodId: selectedPeriodId,
        organizationId: user?.organizationId,
      },
    },
    skip: isTeamView || !selectedPeriodId || !user?.employeeId,
    fetchPolicy: "cache-first",
  });

  // Team Performance Query
  const {
    data: teamData,
    loading: teamLoading,
    error: teamError,
  } = useQuery(GET_TEAM_PERFORMANCE, {
    variables: {
      filters: {
        strategicPeriodId: selectedPeriodId,
        organizationId: user?.organizationId,
        // Note: divisionId and departmentId filtering would need to be added based on user's department membership
      },
    },
    skip: !isTeamView || !selectedPeriodId,
    fetchPolicy: "cache-first",
  });

  const loading = isTeamView ? teamLoading : personalLoading;
  const error = isTeamView ? teamError : personalError;
  const performanceData = isTeamView
    ? teamData?.unifiedTeamPerformance
    : personalData?.unifiedEmployeePerformance;

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 75) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90)
      return { label: "Exceptional", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (percentage >= 75)
      return { label: "Strong", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (percentage >= 60)
      return { label: "Satisfactory", color: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "Needs Improvement", color: "bg-rose-100 text-rose-700 border-rose-200" };
  };

  const getTrendIcon = (value: number, threshold: number = 75) => {
    if (value >= threshold)
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (value >= threshold - 15) return <Minus className="h-4 w-4 text-amber-500" />;
    return <TrendingDown className="h-4 w-4 text-rose-500" />;
  };

  const handleExport = () => {
    const reportData = {
      viewMode,
      period: periods.find((p: any) => p.strategicPeriodId === selectedPeriodId)?.name,
      data: performanceData,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.fullName,
    };
    onExport?.(reportData);
  };

  const handlePeriodChange = (periodId: string) => {
    const period = periods.find((item: any) => item.strategicPeriodId === periodId);
    if (!period) return;
    setSelectedPeriod(period);
  };

  const periodSelector = (
    <Select value={selectedPeriodId} onValueChange={handlePeriodChange}>
      <SelectTrigger className="h-9 w-full sm:w-[260px] rounded-xl border border-slate-200/90 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
        <SelectValue placeholder="Select strategic period" />
      </SelectTrigger>
      <SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        {periods.map((period: any) => (
          <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId} className="rounded-lg text-xs font-medium">
            {period.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Show loading only on initial load
  if (loading && !performanceData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-3xl border border-rose-200/80 bg-rose-50/50 p-6 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
        <CardContent className="flex items-center gap-3.5 p-0 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Failed to load performance data</p>
            <p className="mt-0.5 text-xs text-rose-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPeriodId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {periodSelector}
          <Button onClick={handleExport} variant="outline" disabled className="h-9 rounded-xl border-slate-200 text-xs font-bold dark:border-zinc-800">
            <Download className="mr-2 h-3.5 w-3.5" />
            Export Report
          </Button>
        </div>
        <Card className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardContent className="p-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Please select a strategic period from the dropdown to load performance data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs dark:border-white/[0.08] dark:bg-zinc-900/90">
        <CardContent className="p-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            No performance evaluation records found for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render Personal Performance View
  if (!isTeamView) {
    const badge = getPerformanceBadge(performanceData.overallPercentage);

    return (
      <div className="space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {periodSelector}

          <Button
            onClick={handleExport}
            variant="outline"
            className="h-9 rounded-xl border-slate-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-slate-50 dark:border-zinc-800"
          >
            <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Export Evaluation Report
          </Button>
        </div>

        {/* Overall Performance Card */}
        <Card className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-indigo-50/20 to-slate-50/80 p-6 dark:border-zinc-800 dark:from-zinc-900/90 dark:via-indigo-950/20 dark:to-zinc-900/90 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  {performanceData.employee.fullName}
                </CardTitle>
                <CardDescription className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {performanceData.employee.title} · {performanceData.employee.email}
                </CardDescription>
              </div>
              <Badge className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-xs ${badge.color}`}>
                {badge.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 sm:p-7">
            {/* Overall Score Meter */}
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-800/30">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Overall Composite Performance Score
                </span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(performanceData.overallPercentage)}
                  <span className={`text-4xl font-black tracking-tight tabular-nums sm:text-5xl ${getPerformanceColor(performanceData.overallPercentage)}`}>
                    {performanceData.overallPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-700"
                  style={{ width: `${Math.min(Math.max(performanceData.overallPercentage, 0), 100)}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
                <span>Earned Score: <strong className="text-slate-800 dark:text-zinc-200">{performanceData.totalScore.toFixed(2)}</strong></span>
                <span>Max Benchmark: <strong className="text-slate-800 dark:text-zinc-200">{performanceData.maxPossibleScore.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Performance Component Breakdown */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* KPI Score */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <Target className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">KPI Performance</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{performanceData.breakdown.kpiScore.weight}% weight</span>
                </div>
                <div className="text-3xl font-black tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
                  {performanceData.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(performanceData.breakdown.kpiScore.percentageAchieved, 0), 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  {performanceData.breakdown.kpiScore.rawScore.toFixed(2)} / {performanceData.breakdown.kpiScore.maxScore.toFixed(2)} raw score
                </div>
              </div>

              {/* Competency Score (360°) */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">360° Competency</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{performanceData.breakdown.competencyScore.weight}% weight</span>
                </div>
                <div className="text-3xl font-black tracking-tight tabular-nums text-purple-600 dark:text-purple-400">
                  {performanceData.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(performanceData.breakdown.competencyScore.percentageAchieved, 0), 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  {performanceData.breakdown.competencyScore.rawScore.toFixed(2)} / {performanceData.breakdown.competencyScore.maxScore.toFixed(2)} raw score
                </div>
              </div>

              {/* Activity Score */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">Operational Activity</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{performanceData.breakdown.activityScore.weight}% weight</span>
                </div>
                <div className="text-3xl font-black tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                  {performanceData.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(performanceData.breakdown.activityScore.percentageAchieved, 0), 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  {performanceData.breakdown.activityScore.rawScore.toFixed(2)} / {performanceData.breakdown.activityScore.maxScore.toFixed(2)} raw score
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Rating Summary */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-xs dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-7">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-zinc-100">Official Period Rating Tier</h3>
          <div className="mt-2 text-4xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
            {performanceData.rating}
          </div>
          {performanceData.trendChange !== null && performanceData.trendChange !== undefined && (
            <div className={`mt-2 flex items-center justify-center gap-1.5 text-xs font-bold ${
              performanceData.trendChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
              performanceData.trendChange < 0 ? 'text-rose-600 dark:text-rose-400' : 
              'text-slate-500'
            }`}>
              {performanceData.trendChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
               performanceData.trendChange < 0 ? <TrendingDown className="h-4 w-4" /> : 
               <Minus className="h-4 w-4" />}
              <span>
                {performanceData.trendChange > 0 ? '+' : ''}{performanceData.trendChange.toFixed(1)}% vs previous evaluation cycle
              </span>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Render Team Performance View
  const results = performanceData.results || [];

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {periodSelector}

        <Button
          onClick={handleExport}
          variant="outline"
          className="h-9 rounded-xl border-slate-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-slate-50 dark:border-zinc-800"
        >
          <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
          Export Team Analytics
        </Button>
      </div>

      {/* Team Summary Card */}
      <Card className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500" />
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-purple-50/20 to-slate-50/80 p-6 dark:border-zinc-800 dark:from-zinc-900/90 dark:via-purple-950/20 dark:to-zinc-900/90 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  Team Performance Summary
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Aggregated evaluation metrics for {results.length} team members
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
              {results.length} Members Evaluated
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-7">
          {/* Average Scores Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Average Score</div>
              <div className="mt-1 text-2xl font-black tabular-nums text-blue-700 dark:text-blue-300">
                {performanceData.averageScore.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Median Score</div>
              <div className="mt-1 text-2xl font-black tabular-nums text-purple-700 dark:text-purple-300">
                {performanceData.medianScore.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Highest Score</div>
              <div className="mt-1 text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                {performanceData.highestScore.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Lowest Score</div>
              <div className="mt-1 text-2xl font-black tabular-nums text-amber-700 dark:text-amber-300">
                {performanceData.lowestScore.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Top Performer Card */}
          {performanceData.topPerformer && (
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-amber-50/80 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-950/20">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Top Overall Performer</div>
                  <div className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {performanceData.topPerformer.employee.fullName}
                  </div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {performanceData.topPerformer.totalScore.toFixed(1)}% benchmark overall score
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Team Member Ranking */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-7">
        <CardHeader className="p-0 pb-5">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Team Member Performance Rankings
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Ranked by overall composite score across KPI, competency, and operational activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5 p-0">
          {[...results]
            .sort((a: any, b: any) => b.overallPercentage - a.overallPercentage)
            .map((result: any, index: number) => {
              const badge = getPerformanceBadge(result.overallPercentage);
              return (
                <div
                  key={result.employeeId}
                  className="rounded-2xl border border-slate-200/70 bg-slate-50/40 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-800/20 dark:hover:bg-zinc-800/40"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black shadow-xs ${
                        index === 0
                          ? "bg-amber-400 text-amber-950"
                          : index === 1
                          ? "bg-slate-300 text-slate-800 dark:bg-zinc-700 dark:text-zinc-200"
                          : index === 2
                          ? "bg-amber-600/30 text-amber-900 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-zinc-100">
                          {result.employee.fullName}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {result.employee.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                        {result.rating}
                      </Badge>
                      <span className={`text-2xl font-black tabular-nums ${getPerformanceColor(result.overallPercentage)}`}>
                        {result.overallPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(result.overallPercentage, 0), 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 dark:bg-zinc-900/60">
                      <span className="text-slate-400">KPI:</span>
                      <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
                        {result.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 dark:bg-zinc-900/60">
                      <span className="text-slate-400">Competency:</span>
                      <span className="font-bold tabular-nums text-purple-600 dark:text-purple-400">
                        {result.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 dark:bg-zinc-900/60">
                      <span className="text-slate-400">Activity:</span>
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {result.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
