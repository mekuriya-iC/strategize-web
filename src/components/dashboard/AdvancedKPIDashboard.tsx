"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Layers,
} from "lucide-react";

// GraphQL Queries
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
        kpi {
          kpiId
          name
        }
        actualValue
        targetValue
        achievementRate
      }
    }
  }
`;

const GET_TEAM_PERFORMANCE = gql`
  query GetTeamPerformanceSummary($filters: UnifiedPerformanceFilters!) {
    unifiedTeamPerformance(filters: $filters) {
      results {
        employeeId
        employee {
          fullName
        }
        overallPercentage
        rating
      }
      averageScore
      highestScore
      lowestScore
    }
  }
`;

const GET_EMPLOYEE_PERFORMANCE = gql`
  query GetEmployeePerformanceSummary($filters: UnifiedPerformanceFilters!) {
    unifiedEmployeePerformance(filters: $filters) {
      overallPercentage
      rating
      breakdown {
        kpiScore {
          percentageAchieved
          weight
        }
        competencyScore {
          percentageAchieved
          weight
        }
        activityScore {
          percentageAchieved
          weight
        }
      }
    }
  }
`;

export default function AdvancedKPIDashboard() {
  const user = useAuthStore((state) => state.user);
  const { selectedPeriod } = useStrategicPeriodStore();

  const fullAccessRoles = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
  const hasFullAccess = !!user?.role && fullAccessRoles.has(user.role as string);
  
  const managerRoles = new Set(["MANAGER", "DIRECTOR"]);
  const isManager = !!user?.role && managerRoles.has(user.role as string);

  // Corporate Scorecard (Full Access Only)
  const { data: corporateData, loading: corporateLoading } = useQuery(GET_CORPORATE_SCORECARD, {
    variables: {
      organizationId: user?.organizationId,
      periodId: selectedPeriod?.strategicPeriodId,
    },
    skip: !hasFullAccess || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Team Performance (Managers and Full Access)
  const { data: teamData, loading: teamLoading } = useQuery(GET_TEAM_PERFORMANCE, {
    variables: {
      filters: {
        strategicPeriodId: selectedPeriod?.strategicPeriodId,
        organizationId: user?.organizationId,
        // Note: divisionId and departmentId filtering would need to be added based on user's department membership
      },
    },
    skip: (!hasFullAccess && !isManager) || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  // Personal Performance (All Users)
  const { data: personalData, loading: personalLoading } = useQuery(GET_EMPLOYEE_PERFORMANCE, {
    variables: {
      filters: {
        employeeId: user?.employeeId,
        strategicPeriodId: selectedPeriod?.strategicPeriodId,
        organizationId: user?.organizationId,
      },
    },
    skip: !selectedPeriod?.strategicPeriodId || !user?.employeeId,
    fetchPolicy: "cache-and-network",
  });

  const corporateScorecard = corporateData?.realtimeCorporateScorecard;
  const teamPerformance = teamData?.unifiedTeamPerformance;
  const personalPerformance = personalData?.unifiedEmployeePerformance;

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 75) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90)
      return { label: "Exceptional", color: "bg-emerald-100 text-emerald-700" };
    if (percentage >= 75)
      return { label: "Strong", color: "bg-blue-100 text-blue-700" };
    if (percentage >= 60)
      return { label: "Satisfactory", color: "bg-amber-100 text-amber-700" };
    return { label: "Needs Improvement", color: "bg-rose-100 text-rose-700" };
  };

  if (!selectedPeriod) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please select a strategic period to view KPI performance data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          KPI Performance Dashboard
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {hasFullAccess
            ? "Real-time organizational KPI performance and cascade tracking"
            : isManager
            ? "Team performance overview and KPI metrics"
            : "Your personal performance metrics and achievements"}
        </p>
      </div>

      {/* Corporate KPI Overview - Full Access Only */}
      {hasFullAccess && corporateScorecard && (
        <Card className="border-2 border-blue-200 dark:border-blue-900/40 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Corporate KPI Performance</CardTitle>
                  <CardDescription>Organization-wide achievement metrics</CardDescription>
                </div>
              </div>
              <Badge className={`text-lg px-4 py-1 ${getPerformanceBadge(corporateScorecard.percentageAchieved).color}`}>
                {corporateScorecard.percentageAchieved.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Achievement
                </span>
                <span className={`text-4xl font-bold ${getPerformanceColor(corporateScorecard.percentageAchieved)}`}>
                  {corporateScorecard.percentageAchieved.toFixed(1)}%
                </span>
              </div>
              <Progress value={corporateScorecard.percentageAchieved} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Score: {corporateScorecard.totalScore.toFixed(2)}</span>
                <span>Target: {corporateScorecard.maxPossibleScore.toFixed(2)}</span>
              </div>
            </div>

            {/* Top KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {corporateScorecard.kpiScores.slice(0, 6).map((kpi: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                      {kpi.kpi.name}
                    </span>
                    <span className={`text-sm font-bold ml-2 ${getPerformanceColor(kpi.achievementRate * 100)}`}>
                      {(kpi.achievementRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={kpi.achievementRate * 100} className="h-1.5" />
                  <div className="text-xs text-gray-500 mt-1">
                    {kpi.actualValue.toFixed(1)} / {kpi.targetValue}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance Summary - Managers and Full Access */}
      {(hasFullAccess || isManager) && teamPerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Average Team Performance */}
          <Card className="border-purple-200 dark:border-purple-900/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-base">Team Average</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(teamPerformance.averageScore)}`}>
                {teamPerformance.averageScore.toFixed(1)}%
              </div>
              <Progress value={teamPerformance.averageScore} className="h-2 mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {teamPerformance.results?.length || 0} team members
              </p>
            </CardContent>
          </Card>

          {/* Top Performer */}
          <Card className="border-emerald-200 dark:border-emerald-900/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-base">Top Performer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(teamPerformance.highestScore)}`}>
                {teamPerformance.highestScore.toFixed(1)}%
              </div>
              <Progress value={teamPerformance.highestScore} className="h-2 mb-2" />
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Highest achievement</span>
              </div>
            </CardContent>
          </Card>

          {/* Needs Attention */}
          <Card className="border-amber-200 dark:border-amber-900/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-base">Lowest Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(teamPerformance.lowestScore)}`}>
                {teamPerformance.lowestScore.toFixed(1)}%
              </div>
              <Progress value={teamPerformance.lowestScore} className="h-2 mb-2" />
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <AlertTriangle className="h-3 w-3" />
                <span>May need support</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal Performance - All Users */}
      {personalPerformance && (
        <Card className="border-2 border-indigo-200 dark:border-indigo-900/40">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Your Performance</CardTitle>
                  <CardDescription>Personal achievement metrics</CardDescription>
                </div>
              </div>
              <Badge className={`text-lg px-4 py-1 ${getPerformanceBadge(personalPerformance.overallPercentage).color}`}>
                {personalPerformance.rating}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Score
                </span>
                <span className={`text-5xl font-bold ${getPerformanceColor(personalPerformance.overallPercentage)}`}>
                  {personalPerformance.overallPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={personalPerformance.overallPercentage} className="h-4" />
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">KPI</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {personalPerformance.breakdown.kpiScore.percentageAchieved.toFixed(1)}%
                </div>
                <Progress value={personalPerformance.breakdown.kpiScore.percentageAchieved} className="h-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Weight: {personalPerformance.breakdown.kpiScore.weight}%
                </p>
              </div>

              <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Competency</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {personalPerformance.breakdown.competencyScore.percentageAchieved.toFixed(1)}%
                </div>
                <Progress value={personalPerformance.breakdown.competencyScore.percentageAchieved} className="h-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Weight: {personalPerformance.breakdown.competencyScore.weight}%
                </p>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Activity</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {personalPerformance.breakdown.activityScore.percentageAchieved.toFixed(1)}%
                </div>
                <Progress value={personalPerformance.breakdown.activityScore.percentageAchieved} className="h-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Weight: {personalPerformance.breakdown.activityScore.weight}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cascade Information - Full Access Only */}
      {hasFullAccess && corporateScorecard && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <CardTitle>KPI Cascade Flow</CardTitle>
            </div>
            <CardDescription>How individual achievements cascade to corporate objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500 text-white font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Employee Submits Achievement</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Logbook entry with KPI progress</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-indigo-500" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Manager Approves</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Triggers automatic aggregation</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-amber-500" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 text-white font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Cascades to Department</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Aggregates with other team members</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-purple-500" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Flows to Division & Corporate</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Real-time updates at all levels</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                All {corporateScorecard.kpiScores.length} corporate KPIs are actively tracked and updated in real-time
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">View All KPIs</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Complete KPI performance analytics
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Activity className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Log Achievement</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Submit new KPI progress
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Team Performance</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Review team metrics
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <TrendingUp className="h-8 w-8 text-amber-600 dark:text-amber-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Full Reports</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Detailed analytics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
