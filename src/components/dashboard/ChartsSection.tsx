"use client";

import { useMemo, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import ChartCard from "./ChartCard";
import { useAuthStore, useOrgUnitStore, useStrategicPeriodStore } from "@/stores";
import { useAnalytics } from "@/hooks/objectives/useAnalytics";
import { buildDashboardChartData } from "@/lib/dashboard/buildDashboardChartData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  AlertCircle,
  CheckCircle2,
  Activity,
  BarChart3,
  Filter,
  X,
} from "lucide-react";

// GraphQL Queries for Advanced Analytics
const GET_CORPORATE_SCORECARD = gql`
  query GetCorporateScorecardForCharts($organizationId: ID!, $periodId: ID!) {
    realtimeCorporateScorecard(
      organizationId: $organizationId
      periodId: $periodId
      capFinalScore: false
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        kpi {
          kpiId
          name
        }
        level
        actualValue
        targetValue
        achievementRate
      }
    }
  }
`;

const GET_DIVISION_SCORECARD = gql`
  query GetDivisionScorecardForCharts($divisionId: ID!, $periodId: ID!) {
    realtimeDivisionScorecard(
      divisionId: $divisionId
      periodId: $periodId
      capFinalScore: false
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        kpi {
          kpiId
          name
        }
        level
        actualValue
        targetValue
        achievementRate
      }
    }
  }
`;

const GET_DEPARTMENT_SCORECARD = gql`
  query GetDepartmentScorecardForCharts($departmentId: ID!, $periodId: ID!) {
    realtimeDepartmentScorecard(
      departmentId: $departmentId
      periodId: $periodId
      capFinalScore: false
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        kpi {
          kpiId
          name
        }
        level
        actualValue
        targetValue
        achievementRate
      }
    }
  }
`;

const GET_INDIVIDUAL_SCORECARD = gql`
  query GetIndividualScorecardForCharts($employeeId: ID!, $periodId: ID!) {
    realtimeIndividualScorecard(
      employeeId: $employeeId
      periodId: $periodId
      capFinalScore: false
    ) {
      totalScore
      maxPossibleScore
      percentageAchieved
      kpiScores {
        kpi {
          kpiId
          name
        }
        level
        actualValue
        targetValue
        achievementRate
      }
    }
  }
`;

const GET_TEAM_PERFORMANCE_STATS = gql`
  query GetTeamPerformanceForCharts($filters: UnifiedPerformanceFilters!) {
    unifiedTeamPerformance(filters: $filters) {
      results {
        employeeId
        overallPercentage
        rating
      }
      averageScore
      highestScore
      lowestScore
    }
  }
`;

export default function ChartsSection() {
  const user = useAuthStore((state) => state.user);
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const { annualTimeline, selectedPeriod } = useStrategicPeriodStore();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [topN, setTopN] = useState<number>(5);

  const primaryDept = user?.departments?.[0];
  const userDepartmentId = primaryDept?.departmentId;
  const userDivisionId = (primaryDept as any)?.division?.divisionId;

  const roleSelectedUnit =
    (user?.role === "MANAGER" || user?.role === "DIRECTOR") && selectedUnit
      ? {
          id: selectedUnit.id,
          type: selectedUnit.type,
        }
      : null;

  const analytics = useAnalytics({
    selectedUnit: roleSelectedUnit,
    userRole: user?.role,
    userId: user?.employeeId,
    annualTimeline,
    selectedPeriodId: selectedPeriod?.strategicPeriodId,
  });

  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess = !!user?.role && fullAccessRoles.has(user.role as string);
  const isDirector = user?.role === "DIRECTOR";
  const isManager = user?.role === "MANAGER" || user?.role === "COORDINATOR";
  const isLeadershipRole = hasFullAccess || isDirector || isManager;

  // Determine scorecard query dynamically
  let scorecardQuery = GET_CORPORATE_SCORECARD;
  let scorecardVariables: any = {
    periodId: selectedPeriod?.strategicPeriodId,
  };

  if (hasFullAccess) {
    scorecardQuery = GET_CORPORATE_SCORECARD;
    scorecardVariables.organizationId = user?.organizationId;
  } else if (isDirector && userDivisionId) {
    scorecardQuery = GET_DIVISION_SCORECARD;
    scorecardVariables.divisionId = userDivisionId;
  } else if (isManager && userDepartmentId) {
    scorecardQuery = GET_DEPARTMENT_SCORECARD;
    scorecardVariables.departmentId = userDepartmentId;
  } else {
    scorecardQuery = GET_INDIVIDUAL_SCORECARD;
    scorecardVariables.employeeId = user?.employeeId;
  }

  // Fetch scorecard for charts based on role
  const { data: scorecardData } = useQuery(scorecardQuery, {
    variables: scorecardVariables,
    skip: !selectedPeriod?.strategicPeriodId || (hasFullAccess ? !user?.organizationId : (isDirector ? !userDivisionId : (isManager ? !userDepartmentId : !user?.employeeId))),
    fetchPolicy: "cache-and-network",
  });

  const scorecard =
    scorecardData?.realtimeCorporateScorecard ||
    scorecardData?.realtimeDivisionScorecard ||
    scorecardData?.realtimeDepartmentScorecard ||
    scorecardData?.realtimeIndividualScorecard;

  // Fetch team performance for managers and full access
  let teamFilters: any = {
    strategicPeriodId: selectedPeriod?.strategicPeriodId,
    organizationId: user?.organizationId,
  };
  if (isDirector && userDivisionId) {
    teamFilters.divisionId = userDivisionId;
  } else if (isManager && userDepartmentId) {
    teamFilters.departmentId = userDepartmentId;
  }

  const { data: teamData } = useQuery(GET_TEAM_PERFORMANCE_STATS, {
    variables: {
      filters: teamFilters,
    },
    skip: !isLeadershipRole || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  const chartData = useMemo(
    () =>
      buildDashboardChartData(analytics.filteredObjectives, annualTimeline),
    [analytics.filteredObjectives, annualTimeline]
  );

  // Build advanced analytics from scorecard data
  const advancedAnalytics = useMemo(() => {
    if (!scorecard) {
      return null;
    }

    let kpiScores = scorecard.kpiScores || [];

    // Apply filters
    if (performanceFilter !== "all") {
      switch (performanceFilter) {
        case "exceptional":
          kpiScores = kpiScores.filter((k: any) => k.achievementRate >= 0.9);
          break;
        case "strong":
          kpiScores = kpiScores.filter((k: any) => k.achievementRate >= 0.75 && k.achievementRate < 0.9);
          break;
        case "satisfactory":
          kpiScores = kpiScores.filter((k: any) => k.achievementRate >= 0.6 && k.achievementRate < 0.75);
          break;
        case "needs-improvement":
          kpiScores = kpiScores.filter((k: any) => k.achievementRate < 0.6);
          break;
      }
    }

    if (levelFilter !== "all") {
      kpiScores = kpiScores.filter((k: any) => k.level === levelFilter.toUpperCase());
    }

    // Performance distribution (from unfiltered data for accurate totals)
    const allScores = scorecard.kpiScores || [];
    const exceptional = allScores.filter((k: any) => k.achievementRate >= 0.9).length;
    const strong = allScores.filter((k: any) => k.achievementRate >= 0.75 && k.achievementRate < 0.9).length;
    const satisfactory = allScores.filter((k: any) => k.achievementRate >= 0.6 && k.achievementRate < 0.75).length;
    const needsImprovement = allScores.filter((k: any) => k.achievementRate < 0.6).length;

    // KPIs by organization level (from unfiltered data)
    const corporate = allScores.filter((k: any) => k.level === "CORPORATE").length;
    const division = allScores.filter((k: any) => k.level === "DIVISION").length;
    const department = allScores.filter((k: any) => k.level === "DEPARTMENT").length;
    const personnel = allScores.filter((k: any) => k.level === "PERSONNEL").length;

    // Top and bottom performers (use filtered data)
    const sortedKpis = [...kpiScores].sort((a: any, b: any) => b.achievementRate - a.achievementRate);
    const topPerformers = sortedKpis.slice(0, topN);
    const bottomPerformers = sortedKpis.slice(-topN).reverse();

    // Performance distribution chart data
    const performanceDistData = {
      labels: ["Exceptional (≥90%)", "Strong (75-89%)", "Satisfactory (60-74%)", "Needs Improvement (<60%)"],
      datasets: [
        {
          data: [exceptional, strong, satisfactory, needsImprovement],
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
          borderWidth: 0,
        },
      ],
    };

    // Scope level distribution chart data
    const scopeDistData = {
      labels: ["Corporate", "Division", "Department", "Personnel"],
      datasets: [
        {
          data: [corporate, division, department, personnel],
          backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#f97316"],
          borderRadius: 8,
        },
      ],
    };

    return {
      performanceDistData,
      scopeDistData,
      topPerformers,
      bottomPerformers,
      stats: {
        exceptional,
        strong,
        satisfactory,
        needsImprovement,
        total: allScores.length,
        filtered: kpiScores.length,
      },
    };
  }, [scorecard, performanceFilter, levelFilter, topN]);

  // Team performance distribution
  const teamAnalytics = useMemo(() => {
    if (!teamData?.unifiedTeamPerformance?.results) {
      return null;
    }

    const results = teamData.unifiedTeamPerformance.results;
    
    // Performance rating distribution
    const ratingCounts: Record<string, number> = {};
    results.forEach((r: any) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });

    // Score ranges
    const ranges = {
      "90-100%": results.filter((r: any) => r.overallPercentage >= 90).length,
      "75-89%": results.filter((r: any) => r.overallPercentage >= 75 && r.overallPercentage < 90).length,
      "60-74%": results.filter((r: any) => r.overallPercentage >= 60 && r.overallPercentage < 75).length,
      "Below 60%": results.filter((r: any) => r.overallPercentage < 60).length,
    };

    const teamDistData = {
      labels: Object.keys(ranges),
      datasets: [
        {
          label: "Team Members",
          data: Object.values(ranges),
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
          borderRadius: 8,
        },
      ],
    };

    return {
      teamDistData,
      ratingCounts,
      ranges,
    };
  }, [teamData]);

  if (analytics.loading) {
    return (
      <section className="mb-10">
        <h2 className="text-2xl md:text-4xl font-semibold text-[#3F3F46] dark:text-gray-100 mb-6">
          Performance Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-semibold text-[#3F3F46] dark:text-gray-100">
            Performance Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hasFullAccess
              ? "Organization-wide KPI insights and performance trends"
              : isManager
              ? "Team performance distribution and metrics"
              : "Your performance metrics and objectives"}
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
          {annualTimeline && <p>Timeline: {annualTimeline}</p>}
          {selectedPeriod?.name && <p className="font-semibold">{selectedPeriod.name}</p>}
          {roleSelectedUnit && selectedUnit && (
            <p>
              Unit: {selectedUnit.name} ({selectedUnit.type})
            </p>
          )}
          <p className="flex items-center gap-1 justify-end mt-1">
            <Target className="h-3.5 w-3.5" />
            {chartData.totalKpis} KPIs tracked
          </p>
        </div>
      </div>

      {/* Advanced Filters */}
      {hasFullAccess && advancedAnalytics && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {(performanceFilter !== "all" || levelFilter !== "all") && (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              )}
            </Button>
            
            {(performanceFilter !== "all" || levelFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPerformanceFilter("all");
                  setLevelFilter("all");
                }}
                className="gap-2 text-gray-600 dark:text-gray-400"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Performance Level Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Performance Level
                  </label>
                  <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Performance Levels</SelectItem>
                      <SelectItem value="exceptional">Exceptional (≥90%)</SelectItem>
                      <SelectItem value="strong">Strong (75-89%)</SelectItem>
                      <SelectItem value="satisfactory">Satisfactory (60-74%)</SelectItem>
                      <SelectItem value="needs-improvement">Needs Improvement (&lt;60%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Organization Level Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Organization Level
                  </label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="division">Division</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="personnel">Personnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Top/Bottom N Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show Top/Bottom
                  </label>
                  <Select value={topN.toString()} onValueChange={(v) => setTopN(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Top/Bottom 3</SelectItem>
                      <SelectItem value="5">Top/Bottom 5</SelectItem>
                      <SelectItem value="10">Top/Bottom 10</SelectItem>
                      <SelectItem value="15">Top/Bottom 15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Summary */}
              {advancedAnalytics.stats.filtered !== advancedAnalytics.stats.total && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Showing <span className="font-bold">{advancedAnalytics.stats.filtered}</span> of{" "}
                    <span className="font-bold">{advancedAnalytics.stats.total}</span> KPIs
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {chartData.totalKpis === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium mb-1">No KPI data available</p>
          <p className="text-sm">Try selecting a different strategic period or org unit.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Base Charts - All Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard
              title="KPIs Over Time"
              chartType="bar"
              data={chartData.barData}
            />
            <ChartCard
              title="KPIs by Objective"
              chartType="doughnut"
              data={chartData.donutData}
            />
          </div>

          {/* Advanced Charts - Leadership Roles */}
          {isLeadershipRole && advancedAnalytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard
                  title="Performance Distribution"
                  chartType="doughnut"
                  data={advancedAnalytics.performanceDistData}
                  legend={
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Exceptional: {advancedAnalytics.stats.exceptional}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Strong: {advancedAnalytics.stats.strong}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span>Satisfactory: {advancedAnalytics.stats.satisfactory}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span>Needs Work: {advancedAnalytics.stats.needsImprovement}</span>
                      </div>
                    </div>
                  }
                />
                <ChartCard
                  title="KPIs by Organization Level"
                  chartType="bar"
                  data={advancedAnalytics.scopeDistData}
                />
              </div>

              {/* Top and Bottom Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <CardTitle className="text-lg">Top Performing KPIs</CardTitle>
                    </div>
                    <CardDescription>Highest achievement rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {advancedAnalytics.topPerformers.map((kpi: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1 flex-1">
                              {kpi.kpi.name}
                            </span>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {(kpi.achievementRate * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={kpi.achievementRate * 100} className="h-1.5" />
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{kpi.actualValue.toFixed(1)} / {kpi.targetValue}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                              {kpi.level}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom Performers */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <CardTitle className="text-lg">KPIs Needing Attention</CardTitle>
                    </div>
                    <CardDescription>Requires support and intervention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {advancedAnalytics.bottomPerformers.map((kpi: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1 flex-1">
                              {kpi.kpi.name}
                            </span>
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {(kpi.achievementRate * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={kpi.achievementRate * 100} className="h-1.5" />
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{kpi.actualValue.toFixed(1)} / {kpi.targetValue}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                              {kpi.level}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Team Performance Charts - Leadership Roles */}
          {isLeadershipRole && teamAnalytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard
                  title="Team Performance Distribution"
                  chartType="bar"
                  data={teamAnalytics.teamDistData}
                />
                
                {/* Team Stats Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <CardTitle className="text-lg">Team Performance Summary</CardTitle>
                    </div>
                    <CardDescription>Overall team metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            High Performers (≥90%)
                          </span>
                        </div>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {teamAnalytics.ranges["90-100%"]}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Strong Performers (75-89%)
                          </span>
                        </div>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {teamAnalytics.ranges["75-89%"]}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Needs Support (&lt;75%)
                          </span>
                        </div>
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                          {teamAnalytics.ranges["60-74%"] + teamAnalytics.ranges["Below 60%"]}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Team Average
                          </span>
                          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {teamData.unifiedTeamPerformance.averageScore.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={teamData.unifiedTeamPerformance.averageScore} 
                          className="h-2 mt-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
