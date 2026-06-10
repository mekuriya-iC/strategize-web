"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  TrendingUp,
  Award,
  Target,
  Users,
  Loader2,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import { GET_TEAM_PERFORMANCE } from "@/lib/graphql/queries/unified-performance";
import { useAuthStore } from "@/stores";
import UnifiedPerformanceOverview from "@/components/performance/UnifiedPerformanceOverview";

export default function PerformancePage() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("");

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role as string | undefined;
  const hasTeamView =
    !!userRole &&
    ["SUPER_ADMIN", "ADMIN", "HR", "CEO", "DIRECTOR", "MANAGER"].includes(
      userRole,
    );

  // Default to team performance for managers/admins, my performance for employees
  const [activeView, setActiveView] = useState<
    "my-performance" | "team-performance"
  >("my-performance");

  // Fetch strategic periods for filter
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 20 },
  });
  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((period: any) => period.isActive);

  useEffect(() => {
    if (!periodFilter && activePeriod?.strategicPeriodId) {
      setPeriodFilter(activePeriod.strategicPeriodId);
    }
  }, [activePeriod, periodFilter]);

  useEffect(() => {
    if (hasTeamView) {
      setActiveView("team-performance");
    }
  }, [hasTeamView]);

  // Fetch team performance if viewing team
  const { data: teamData, loading: teamLoading } = useQuery(
    GET_TEAM_PERFORMANCE,
    {
      variables: {
        organizationId: user?.organizationId,
        strategicPeriodId: periodFilter !== "all" ? periodFilter : undefined,
        includeInactive: false,
      },
      skip: !user?.organizationId || activeView !== "team-performance",
    },
  );

  const teamPerformance = teamData?.teamPerformance;
  const teamResults = teamPerformance?.results || [];

  // Filter by search
  const filteredResults = teamResults.filter((result: any) =>
    result.employee.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90)
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (percentage >= 80)
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (percentage >= 70)
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (percentage >= 60)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  if (teamLoading && activeView === "team-performance") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading team performance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Unified Performance System
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Combined performance metrics from KPIs, 360° evaluations, and activity
          data
        </p>
      </div>

      {/* View Toggle */}
      {hasTeamView ? (
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as any)}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-performance">My Performance</TabsTrigger>
            <TabsTrigger value="team-performance">Team Performance</TabsTrigger>
          </TabsList>

          {/* My Performance View */}
          <TabsContent value="my-performance" className="space-y-6">
            {user?.employeeId && user?.organizationId && (
              <UnifiedPerformanceOverview
                employeeId={user.employeeId}
                organizationId={user.organizationId}
                strategicPeriodId={
                  periodFilter !== "all" ? periodFilter : undefined
                }
              />
            )}
          </TabsContent>

          {/* Team Performance View */}
          <TabsContent value="team-performance" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {periods.map((period: any) => (
                    <SelectItem
                      key={period.strategicPeriodId}
                      value={period.strategicPeriodId}
                    >
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Cards */}
            {teamPerformance && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Team Size
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teamResults.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Team members
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Score
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(teamPerformance.averageScore)}`}
                    >
                      {teamPerformance.averageScore.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Team average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Top Score
                    </CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(teamPerformance.highestScore)}`}
                    >
                      {teamPerformance.highestScore.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Highest performer
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Excellence Rate
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      {teamResults.length > 0
                        ? (
                            (teamResults.filter(
                              (r: any) => r.overallPercentage >= 90,
                            ).length /
                              teamResults.length) *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Score ≥ 90%</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Top Performer */}
            {teamPerformance?.topPerformer && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performer</CardTitle>
                  <CardDescription>Highest scoring team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold">
                      🏆
                    </div>
                    <UserAvatar
                      src={teamPerformance.topPerformer.employee.picture}
                      alt={teamPerformance.topPerformer.employee.fullName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        {teamPerformance.topPerformer.employee.fullName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {teamPerformance.topPerformer.employee.title ||
                          "No title"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${getScoreColor(teamPerformance.topPerformer.overallPercentage)}`}
                      >
                        {teamPerformance.topPerformer.overallPercentage.toFixed(
                          1,
                        )}
                        %
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {teamPerformance.topPerformer.rating}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Results */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Team Performance ({filteredResults.length})
                </CardTitle>
                <CardDescription>
                  Unified performance scores for all team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredResults.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No performance data
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Performance results will appear here once team members
                      have data
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredResults.map((result: any) => (
                      <div
                        key={result.employeeId}
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        <UserAvatar
                          src={result.employee.picture}
                          alt={result.employee.fullName}
                          fallbackText={result.employee.fullName}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {result.employee.fullName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {result.employee.title || "No title"}
                            {result.employee.departments?.[0] &&
                              ` • ${result.employee.departments[0].name}`}
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">KPI</p>
                            <p
                              className={`font-semibold ${getScoreColor(result.breakdown.kpiScore.percentageAchieved)}`}
                            >
                              {result.breakdown.kpiScore.percentageAchieved.toFixed(
                                0,
                              )}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">360°</p>
                            <p
                              className={`font-semibold ${getScoreColor(result.breakdown.competencyScore.percentageAchieved)}`}
                            >
                              {result.breakdown.competencyScore.percentageAchieved.toFixed(
                                0,
                              )}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Activity
                            </p>
                            <p
                              className={`font-semibold ${getScoreColor(result.breakdown.activityScore.percentageAchieved)}`}
                            >
                              {result.breakdown.activityScore.percentageAchieved.toFixed(
                                0,
                              )}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Overall
                            </p>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getScoreBadge(result.overallPercentage)}`}
                            >
                              {result.overallPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Non-manager/admin view - only my performance
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {periods.map((period: any) => (
                  <SelectItem
                    key={period.strategicPeriodId}
                    value={period.strategicPeriodId}
                  >
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {user?.employeeId && user?.organizationId && (
            <UnifiedPerformanceOverview
              employeeId={user.employeeId}
              organizationId={user.organizationId}
              strategicPeriodId={
                periodFilter !== "all" ? periodFilter : undefined
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
