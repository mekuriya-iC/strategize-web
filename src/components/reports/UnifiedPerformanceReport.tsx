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
          fullName
        }
        totalScore
      }
    }
  }
`;

const GET_PERIODS = gql`
  query GetStrategicPeriods {
    strategicPeriods {
      items {
        strategicPeriodId
        name
        periodType
        startDate
        endDate
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
  const { data: periodsData } = useQuery(GET_PERIODS);
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
    fetchPolicy: "cache-and-network",
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
    fetchPolicy: "cache-and-network",
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
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        {periods.map((period: any) => (
          <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId}>
            {period.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Show loading only on initial load
  if (loading && !performanceData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 dark:border-rose-900">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Failed to load performance data</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPeriodId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {periodSelector}
          <Button onClick={handleExport} variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Please select a period to view performance data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            No performance data available for the selected period.
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
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {periodSelector}

          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Overall Performance Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-900/40 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{performanceData.employee.fullName}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {performanceData.employee.title}
                </CardDescription>
              </div>
              <Badge className={`text-lg py-2 px-4 ${badge.color}`}>
                {badge.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Overall Score */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Performance Score
                </span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(performanceData.overallPercentage)}
                  <span className={`text-5xl font-bold ${getPerformanceColor(performanceData.overallPercentage)}`}>
                    {performanceData.overallPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress value={performanceData.overallPercentage} className="h-4 mb-2" />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Score: {performanceData.totalScore.toFixed(2)}</span>
                <span>Max Possible: {performanceData.maxPossibleScore.toFixed(2)}</span>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* KPI Score */}
              <Card className="border-2 border-blue-100 dark:border-blue-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-sm font-semibold">KPI Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {performanceData.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                  </div>
                  <Progress
                    value={performanceData.breakdown.kpiScore.percentageAchieved}
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {performanceData.breakdown.kpiScore.rawScore.toFixed(2)} / {performanceData.breakdown.kpiScore.maxScore.toFixed(2)}
                    <span className="ml-2">({performanceData.breakdown.kpiScore.weight}% weight)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Competency Score (360°) */}
              <Card className="border-2 border-purple-100 dark:border-purple-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <CardTitle className="text-sm font-semibold">Competency (360°)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {performanceData.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                  </div>
                  <Progress
                    value={performanceData.breakdown.competencyScore.percentageAchieved}
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {performanceData.breakdown.competencyScore.rawScore.toFixed(2)} / {performanceData.breakdown.competencyScore.maxScore.toFixed(2)}
                    <span className="ml-2">({performanceData.breakdown.competencyScore.weight}% weight)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Score */}
              <Card className="border-2 border-emerald-100 dark:border-emerald-900/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-sm font-semibold">Activity Metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    {performanceData.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                  </div>
                  <Progress
                    value={performanceData.breakdown.activityScore.percentageAchieved}
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {performanceData.breakdown.activityScore.rawScore.toFixed(2)} / {performanceData.breakdown.activityScore.maxScore.toFixed(2)}
                    <span className="ml-2">({performanceData.breakdown.activityScore.weight}% weight)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Performance Rating Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Performance Rating
            </CardTitle>
            <CardDescription>Your overall performance rating for this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {performanceData.rating}
              </div>
              {performanceData.trendChange !== null && performanceData.trendChange !== undefined && (
                <div className={`flex items-center justify-center gap-2 text-sm ${
                  performanceData.trendChange > 0 ? 'text-emerald-600' : 
                  performanceData.trendChange < 0 ? 'text-rose-600' : 
                  'text-gray-600'
                }`}>
                  {performanceData.trendChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                   performanceData.trendChange < 0 ? <TrendingDown className="h-4 w-4" /> : 
                   <Minus className="h-4 w-4" />}
                  <span>
                    {performanceData.trendChange > 0 ? '+' : ''}{performanceData.trendChange.toFixed(1)}% 
                    from previous period
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Team Performance View
  const results = performanceData.results || [];

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {periodSelector}

        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Team Summary Card */}
      <Card className="border-2 border-purple-200 dark:border-purple-900/40 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            Team Performance Summary
          </CardTitle>
          <CardDescription className="text-base">
            {results.length} team members
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Average Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Average Score</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {performanceData.averageScore.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Median Score</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {performanceData.medianScore.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Highest Score</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {performanceData.highestScore.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Lowest Score</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {performanceData.lowestScore.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Top Performer */}
          {performanceData.topPerformer && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-900/30">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Top Performer</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {performanceData.topPerformer.employee.fullName}
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    {performanceData.topPerformer.totalScore.toFixed(1)}% overall score
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Team Member Results */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
          <CardDescription>Individual performance scores for all team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...results]
              .sort((a: any, b: any) => b.overallPercentage - a.overallPercentage)
              .map((result: any, index: number) => {
                const badge = getPerformanceBadge(result.overallPercentage);
                return (
                  <div
                    key={result.employeeId}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-amber-100 text-amber-700"
                            : index === 1
                            ? "bg-gray-200 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                            {result.employee.fullName}
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {result.employee.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={badge.color}>{result.rating}</Badge>
                        <span className={`text-2xl font-bold ${getPerformanceColor(result.overallPercentage)}`}>
                          {result.overallPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={result.overallPercentage} className="h-2 mb-3" />
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400">KPI:</span>
                        <span className="font-semibold">{result.breakdown.kpiScore.percentageAchieved.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-purple-500" />
                        <span className="text-gray-600 dark:text-gray-400">Competency:</span>
                        <span className="font-semibold">{result.breakdown.competencyScore.percentageAchieved.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-emerald-500" />
                        <span className="text-gray-600 dark:text-gray-400">Activity:</span>
                        <span className="font-semibold">{result.breakdown.activityScore.percentageAchieved.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
