"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_TEAM_PERFORMANCE,
  GET_EMPLOYEE_PERFORMANCE,
} from "@/lib/graphql/queries/unified-performance";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import { useAuthStore } from "@/stores";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Award,
  Download,
  Target,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface PerformanceReportProps {
  onExport?: (data: unknown) => void;
}

const FULL_ACCESS_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "HR", "CEO"]);
const MANAGER_ROLES = new Set(["DIRECTOR", "MANAGER"]);

export default function PerformanceReport({
  onExport,
}: PerformanceReportProps) {
  const [strategicPeriodId, setStrategicPeriodId] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const user = useAuthStore((state) => state.user);

  const role = user?.role as string | undefined;
  const hasFullAccess = !!role && FULL_ACCESS_ROLES.has(role);
  const isManager = !!role && MANAGER_ROLES.has(role);
  const canViewTeam = hasFullAccess || isManager;

  // Fetch strategic periods
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 20 },
  });
  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((period: any) => period.isActive);

  useEffect(() => {
    if (!strategicPeriodId && activePeriod?.strategicPeriodId) {
      setStrategicPeriodId(activePeriod.strategicPeriodId);
    }
  }, [activePeriod, strategicPeriodId]);

  // Get team performance data
  const { data: teamData, loading: teamLoading } = useQuery(
    GET_TEAM_PERFORMANCE,
    {
      variables: {
        organizationId: user?.organizationId,
        strategicPeriodId:
          strategicPeriodId !== "all" ? strategicPeriodId : undefined,
        includeInactive: false,
      },
      skip: !user?.organizationId || !canViewTeam,
      fetchPolicy: "cache-and-network",
    },
  );

  // Get my performance data
  const { data: myData, loading: myLoading } = useQuery(
    GET_EMPLOYEE_PERFORMANCE,
    {
      variables: {
        employeeId: user?.employeeId,
        organizationId: user?.organizationId,
        strategicPeriodId:
          strategicPeriodId !== "all" ? strategicPeriodId : undefined,
      },
      skip: !user?.employeeId || !user?.organizationId,
      fetchPolicy: "cache-and-network",
    },
  );

  const reportData = useMemo(() => {
    const teamPerformance = teamData?.teamPerformance;
    const myPerformance = myData?.employeePerformance;

    let results = [];
    if (canViewTeam && teamPerformance?.results) {
      results = teamPerformance.results;
    } else if (myPerformance) {
      results = [myPerformance];
    }

    // Filter by employee if selected
    const filteredResults =
      employeeFilter !== "all"
        ? results.filter((r: any) => r.employeeId === employeeFilter)
        : results;

    // Calculate metrics
    const totalEmployees = filteredResults.length;
    const avgOverallScore =
      totalEmployees > 0
        ? filteredResults.reduce(
            (sum: number, r: any) => sum + r.overallPercentage,
            0,
          ) / totalEmployees
        : 0;

    const avgKpiScore =
      totalEmployees > 0
        ? filteredResults.reduce(
            (sum: number, r: any) =>
              sum + r.breakdown.kpiScore.percentageAchieved,
            0,
          ) / totalEmployees
        : 0;

    const avgCompetencyScore =
      totalEmployees > 0
        ? filteredResults.reduce(
            (sum: number, r: any) =>
              sum + r.breakdown.competencyScore.percentageAchieved,
            0,
          ) / totalEmployees
        : 0;

    const avgActivityScore =
      totalEmployees > 0
        ? filteredResults.reduce(
            (sum: number, r: any) =>
              sum + r.breakdown.activityScore.percentageAchieved,
            0,
          ) / totalEmployees
        : 0;

    // Excellence rate (>=90%)
    const excellentCount = filteredResults.filter(
      (r: any) => r.overallPercentage >= 90,
    ).length;
    const excellenceRate =
      totalEmployees > 0 ? (excellentCount / totalEmployees) * 100 : 0;

    // Top performers
    const topPerformers = [...filteredResults]
      .sort((a: any, b: any) => b.overallPercentage - a.overallPercentage)
      .slice(0, 5);

    // Improvement areas (low performers)
    const improvementAreas = [...filteredResults]
      .filter((r: any) => r.overallPercentage < 70)
      .sort((a: any, b: any) => a.overallPercentage - b.overallPercentage)
      .slice(0, 5);

    return {
      results: filteredResults,
      teamPerformance,
      totalEmployees,
      avgOverallScore,
      avgKpiScore,
      avgCompetencyScore,
      avgActivityScore,
      excellenceRate,
      topPerformers,
      improvementAreas,
    };
  }, [teamData, myData, canViewTeam, employeeFilter]);

  const rawEmployees = useMemo(
    () =>
      canViewTeam
        ? (teamData?.teamPerformance?.results || []).map(
            (result: any) => result.employee,
          )
        : myData?.employeePerformance?.employee
          ? [myData.employeePerformance.employee]
          : [],
    [canViewTeam, myData, teamData],
  );

  const loading = teamLoading || myLoading;

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

  const handleExport = () => {
    onExport?.({
      role,
      strategicPeriodId,
      employeeFilter,
      metrics: {
        totalEmployees: reportData.totalEmployees,
        avgOverallScore: reportData.avgOverallScore,
        avgKpiScore: reportData.avgKpiScore,
        avgCompetencyScore: reportData.avgCompetencyScore,
        avgActivityScore: reportData.avgActivityScore,
        excellenceRate: reportData.excellenceRate,
      },
      results: reportData.results,
      topPerformers: reportData.topPerformers,
      improvementAreas: reportData.improvementAreas,
      generatedAt: new Date().toISOString(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading performance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Select
            value={strategicPeriodId}
            onValueChange={setStrategicPeriodId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Strategic period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategic Periods</SelectItem>
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

          {canViewTeam && rawEmployees.length > 0 && (
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {rawEmployees.map((emp: any) => (
                  <SelectItem key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName || emp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              {canViewTeam ? "Team members" : "Personal view"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getScoreColor(reportData.avgOverallScore)}`}
            >
              {reportData.avgOverallScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Average performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getScoreColor(reportData.avgKpiScore)}`}
            >
              {reportData.avgKpiScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">70% weight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">360° Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getScoreColor(reportData.avgCompetencyScore)}`}
            >
              {reportData.avgCompetencyScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">25% weight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Excellence Rate
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {reportData.excellenceRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Score ≥ 90%</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {reportData.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Highest scoring {canViewTeam ? "team members" : "performance"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topPerformers.map((result: any, index: number) => (
                <div
                  key={result.employeeId}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <UserAvatar
                    src={result.employee?.picture}
                    alt={result.employee?.fullName}
                    fallbackText={result.employee?.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {result.employee?.fullName || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.employee?.title || "No title"}
                      {result.employee?.departments?.[0] &&
                        ` • ${result.employee.departments[0].name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(result.overallPercentage)}`}
                    >
                      {result.overallPercentage.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {result.rating || "Not rated"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Performance Breakdown ({reportData.results.length})
          </CardTitle>
          <CardDescription>
            Unified performance scores with component breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.results.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No performance data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Performance results will appear here once data is available
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">KPI Score</TableHead>
                    <TableHead className="text-center">360° Score</TableHead>
                    <TableHead className="text-center">
                      Activity Score
                    </TableHead>
                    <TableHead className="text-center">Overall Score</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.results.map((result: any) => (
                    <TableRow key={result.employeeId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={result.employee?.picture}
                            alt={result.employee?.fullName}
                            fallbackText={result.employee?.fullName}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {result.employee?.fullName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {result.employee?.title || "No title"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`font-semibold ${getScoreColor(result.breakdown.kpiScore.percentageAchieved)}`}
                        >
                          {result.breakdown.kpiScore.percentageAchieved.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.breakdown.kpiScore.weightedScore.toFixed(2)}{" "}
                          pts
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`font-semibold ${getScoreColor(result.breakdown.competencyScore.percentageAchieved)}`}
                        >
                          {result.breakdown.competencyScore.percentageAchieved.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.breakdown.competencyScore.weightedScore.toFixed(
                            2,
                          )}{" "}
                          pts
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`font-semibold ${getScoreColor(result.breakdown.activityScore.percentageAchieved)}`}
                        >
                          {result.breakdown.activityScore.percentageAchieved.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.breakdown.activityScore.weightedScore.toFixed(
                            2,
                          )}{" "}
                          pts
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getScoreBadge(result.overallPercentage)}
                        >
                          {result.overallPercentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {result.rating || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvement Areas */}
      {reportData.improvementAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Improvement Areas</CardTitle>
            <CardDescription>Team members who may need support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.improvementAreas.map((result: any) => (
                <div
                  key={result.employeeId}
                  className="flex items-center gap-4 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                >
                  <UserAvatar
                    src={result.employee?.picture}
                    alt={result.employee?.fullName}
                    fallbackText={result.employee?.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {result.employee?.fullName || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.employee?.title || "No title"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${getScoreColor(result.overallPercentage)}`}
                    >
                      {result.overallPercentage.toFixed(1)}%
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Needs support
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
