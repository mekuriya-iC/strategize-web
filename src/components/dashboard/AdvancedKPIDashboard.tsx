"use client";

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
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  // Team Performance (Managers and Full Access)
  const { data: teamData, loading: teamLoading } = useQuery(GET_TEAM_PERFORMANCE, {
    variables: {
      filters: {
        strategicPeriodId: selectedPeriod?.strategicPeriodId,
        organizationId: user?.organizationId,
      },
    },
    skip: (!hasFullAccess && !isManager) || !selectedPeriod?.strategicPeriodId,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
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
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  const corporateScorecard = corporateData?.realtimeCorporateScorecard;
  const teamPerformance = teamData?.unifiedTeamPerformance;
  const personalPerformance = personalData?.unifiedEmployeePerformance;

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 70) return "text-slate-800 dark:text-slate-100";
    if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 85)
      return { label: "Exceptional", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30" };
    if (percentage >= 70)
      return { label: "Strong", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/30" };
    if (percentage >= 60)
      return { label: "Satisfactory", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30" };
    return { label: "Needs Improvement", color: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100/50 dark:border-red-900/30" };
  };

  if (!selectedPeriod) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Please select a strategic period to view KPI performance data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          KPI Performance Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {hasFullAccess
            ? "Real-time organizational KPI performance and cascade tracking"
            : isManager
            ? "Team performance overview and KPI metrics"
            : "Your personal performance metrics and achievements"}
        </p>
      </div>

      {/* Corporate KPI Overview - Full Access Only */}
      {hasFullAccess && corporateScorecard && (
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">Corporate KPI Performance</CardTitle>
                  <CardDescription className="text-xs">Organization-wide achievement metrics</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${getPerformanceBadge(corporateScorecard.percentageAchieved).color}`}>
                {corporateScorecard.percentageAchieved.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="mb-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">
                  Overall Achievement
                </span>
                <span className={`text-3xl font-bold ${getPerformanceColor(corporateScorecard.percentageAchieved)}`}>
                  {corporateScorecard.percentageAchieved.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-700 dark:bg-slate-300 transition-all"
                  style={{ width: `${Math.min(corporateScorecard.percentageAchieved, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                <span>Score: {corporateScorecard.totalScore.toFixed(2)}</span>
                <span>Target: {corporateScorecard.maxPossibleScore.toFixed(2)}</span>
              </div>
            </div>

            {/* Top KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {corporateScorecard.kpiScores.slice(0, 6).map((kpi: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">
                      {kpi.kpi.name}
                    </span>
                    <span className={`text-xs font-bold ml-2 ${getPerformanceColor(kpi.achievementRate * 100)}`}>
                      {(kpi.achievementRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-500 dark:bg-slate-400 transition-all"
                      style={{ width: `${Math.min(kpi.achievementRate * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5">
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
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team Average</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className={`text-3xl font-bold mb-2 ${getPerformanceColor(teamPerformance.averageScore)}`}>
                {teamPerformance.averageScore.toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-slate-500 transition-all"
                  style={{ width: `${Math.min(teamPerformance.averageScore, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {teamPerformance.results?.length || 0} team members
              </p>
            </CardContent>
          </Card>

          {/* Top Performer */}
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top Performer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className={`text-3xl font-bold mb-2 ${getPerformanceColor(teamPerformance.highestScore)}`}>
                {teamPerformance.highestScore.toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-slate-500 transition-all"
                  style={{ width: `${Math.min(teamPerformance.highestScore, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Highest achievement</span>
              </div>
            </CardContent>
          </Card>

          {/* Needs Attention */}
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lowest Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className={`text-3xl font-bold mb-2 ${getPerformanceColor(teamPerformance.lowestScore)}`}>
                {teamPerformance.lowestScore.toFixed(1)}%
              </div>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-slate-500 transition-all"
                  style={{ width: `${Math.min(teamPerformance.lowestScore, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span>May need support</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal Performance - All Users */}
      {personalPerformance && (
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">Your Performance</CardTitle>
                  <CardDescription className="text-xs">Personal achievement metrics</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${getPerformanceBadge(personalPerformance.overallPercentage).color}`}>
                {personalPerformance.rating}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="mb-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">
                  Overall Score
                </span>
                <span className={`text-4xl font-bold ${getPerformanceColor(personalPerformance.overallPercentage)}`}>
                  {personalPerformance.overallPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-700 dark:bg-slate-300 transition-all"
                  style={{ width: `${Math.min(personalPerformance.overallPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "KPI", val: personalPerformance.breakdown.kpiScore.percentageAchieved, wt: personalPerformance.breakdown.kpiScore.weight, icon: Target },
                { label: "Competency", val: personalPerformance.breakdown.competencyScore.percentageAchieved, wt: personalPerformance.breakdown.competencyScore.weight, icon: Users },
                { label: "Activity", val: personalPerformance.breakdown.activityScore.percentageAchieved, wt: personalPerformance.breakdown.activityScore.weight, icon: Activity },
              ].map(({ label, val, wt, icon: Icon }) => (
                <div key={label} className="p-3.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                    {val.toFixed(1)}%
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-500 transition-all"
                      style={{ width: `${Math.min(val, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
                    Weight: {wt}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cascade Information - Full Access Only */}
      {hasFullAccess && corporateScorecard && (
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">KPI Cascade Flow</CardTitle>
            </div>
            <CardDescription className="text-xs">How individual achievements cascade to corporate objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {[
                { step: "1", title: "Employee Submits Achievement", desc: "Logbook entry with KPI progress" },
                { step: "2", title: "Manager Approves", desc: "Triggers automatic aggregation" },
                { step: "3", title: "Cascades to Department", desc: "Aggregates with other team members" },
                { step: "4", title: "Flows to Division & Corporate", desc: "Real-time updates at all levels" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-950/10">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    {step}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">{title}</p>
                    <p className="text-[10px] text-slate-500">{desc}</p>
                  </div>
                  {step !== "4" && <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />}
                </div>
              ))}
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[10px] text-slate-500">
                All {corporateScorecard.kpiScores.length} corporate KPIs are actively tracked and updated in real-time
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "View All KPIs", desc: "Complete KPI performance analytics", icon: Target },
          { title: "Log Achievement", desc: "Submit new KPI progress", icon: Activity },
          { title: "Team Performance", desc: "Review team metrics", icon: Users },
          { title: "Full Reports", desc: "Detailed analytics", icon: TrendingUp },
        ].map(({ title, desc, icon: Icon }) => (
          <Card key={title} className="hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer">
            <CardContent className="pt-5">
              <Icon className="h-6 w-6 text-slate-450 dark:text-slate-450 mb-2.5" />
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">{title}</h3>
              <p className="text-[10px] text-slate-500">
                {desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
