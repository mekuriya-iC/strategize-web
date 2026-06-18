"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { TrendingUp, Target, Award, AlertCircle, ArrowRight, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_REALTIME_INDIVIDUAL_SCORECARD } from "@/lib/graphql/queries/kpi-scorecard";
import { GET_KPI_ASSIGNMENTS_EMPLOYEE } from "@/lib/graphql/queries/kpis";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface KpiScore {
  aggregatedKpiScoreId: string;
  kpi: {
    kpiId: string;
    name: string;
    description: string;
  };
  level: string;
  actualValue: number;
  targetValue: number;
  weight: number;
  cap: number;
  achievementRate: number;
  cappedRate: number;
  score: number;
  calculatedAt: string;
}

interface ScorecardData {
  totalScore: number;
  maxPossibleScore: number;
  percentageAchieved: number;
  kpiScores: KpiScore[];
}

export default function IndividualScorecard({
  capFinalScore = false,
  strategicPeriodId,
}: {
  capFinalScore?: boolean;
  strategicPeriodId?: string;
}) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canReadAll = can("evaluations:read_all");

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    user?.employeeId || "",
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // Enforce: Regular employees can only view their own scorecard
  useEffect(() => {
    if (!canReadAll && selectedEmployeeId !== user?.employeeId) {
      setSelectedEmployeeId(user?.employeeId || "");
    }
  }, [canReadAll, user?.employeeId, selectedEmployeeId]);

  // Fetch strategic periods
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 50 },
  });

  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((p: any) => p.status === "ACTIVE");

  // Prefer the parent-selected period, otherwise fall back to the active period.
  useEffect(() => {
    if (strategicPeriodId && strategicPeriodId !== selectedPeriodId) {
      setSelectedPeriodId(strategicPeriodId);
      return;
    }

    if (activePeriod && !selectedPeriodId) {
      setSelectedPeriodId(activePeriod.strategicPeriodId);
    }
  }, [activePeriod, selectedPeriodId, strategicPeriodId]);

  // Fetch employees (for HR/Admin)
  const { data: employeesData } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 1000 },
    skip: !canReadAll,
  });

  const employees = employeesData?.employees?.items || [];

  // Fetch scorecard data - REAL-TIME CALCULATION
  const { data: scorecardData, loading: scorecardLoading } = useQuery(
    GET_REALTIME_INDIVIDUAL_SCORECARD,
    {
      variables: {
        employeeId: selectedEmployeeId,
        periodId: selectedPeriodId,
        capFinalScore,
      },
      skip: !selectedEmployeeId || !selectedPeriodId,
      fetchPolicy: "network-only", // Always fetch fresh data
    },
  );

  // Fetch KPI assignments to get parentWeightAllocation
  const { data: assignmentsData } = useQuery(GET_KPI_ASSIGNMENTS_EMPLOYEE, {
    variables: {
      employeeId: selectedEmployeeId,
      strategicPeriodId: selectedPeriodId,
      page: 1,
      limit: 1000,
    },
    skip: !selectedEmployeeId || !selectedPeriodId,
  });

  const scorecard: ScorecardData | undefined =
    scorecardData?.realtimeIndividualScorecard;

  const assignments = assignmentsData?.kpiAssignmentsEmployee?.items || [];

  // Create a map of kpiId to assignment for quick lookup
  const assignmentMap = new Map(
    assignments.map((a: any) => [a.kpi.kpiId, a])
  );

  const getAchievementColor = (rate: number): string => {
    if (rate >= 1.0) return "text-green-600";
    if (rate >= 0.75) return "text-blue-600";
    if (rate >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getAchievementBadge = (
    rate: number,
  ): { label: string; variant: any } => {
    if (rate >= 1.3)
      return { label: "Exceeds Expectations", variant: "default" };
    if (rate >= 1.0)
      return { label: "Meets Expectations", variant: "secondary" };
    if (rate >= 0.75) return { label: "Needs Improvement", variant: "outline" };
    return { label: "Below Expectations", variant: "destructive" };
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Please log in to view your scorecard.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalScoreRate =
    scorecard && scorecard.maxPossibleScore > 0
      ? scorecard.totalScore / scorecard.maxPossibleScore
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Individual KPI Scorecard
          </h2>
          <p className="text-muted-foreground">
            Track your KPI performance and achievements
          </p>
        </div>
        <TrendingUp className="h-8 w-8 text-primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Selector (HR/Admin only) */}
            {canReadAll && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Employee
                </label>
                <Select
                  value={selectedEmployeeId}
                  onValueChange={setSelectedEmployeeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} - {emp.title || "N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Period Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Strategic Period
              </label>
              <Select
                value={selectedPeriodId}
                onValueChange={setSelectedPeriodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={activePeriod ? `${activePeriod.name} (Active)` : "Select period"} />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period: any) => (
                    <SelectItem
                      key={period.strategicPeriodId}
                      value={period.strategicPeriodId}
                    >
                      {period.name} {period.status === "ACTIVE" ? "(Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {scorecardLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading scorecard data...</p>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!scorecardLoading && !scorecard && selectedPeriodId && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No KPI assignments found for this period.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              KPIs must be assigned to you with targets and weights to see your scorecard.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Scores are calculated automatically from your approved logbook entries.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scorecard Summary */}
      {!scorecardLoading && scorecard && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Score Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Score
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(scorecard.totalScore)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  out of {formatNumber(scorecard.maxPossibleScore)}% possible
                </p>
                <Progress
                  value={
                    (scorecard.totalScore / scorecard.maxPossibleScore) * 100
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Achievement Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Achievement Rate
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getAchievementColor(scorecard.percentageAchieved / 100)}`}
                >
                  {formatNumber(scorecard.percentageAchieved)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  of weighted targets
                </p>
                <div className="mt-2">
                  <Badge
                    {...getAchievementBadge(scorecard.percentageAchieved / 100)}
                  >
                    {
                      getAchievementBadge(scorecard.percentageAchieved / 100)
                        .label
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Total KPIs Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active KPIs
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scorecard.kpiScores.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  KPIs tracked this period
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Last calculated:{" "}
                  {scorecard.kpiScores[0]
                    ? new Date(
                        scorecard.kpiScores[0].calculatedAt,
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* KPI Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>KPI Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">KPI Name</th>
                      <th className="text-center p-3 font-medium">Level</th>
                      <th className="text-right p-3 font-medium">Actual</th>
                      <th className="text-right p-3 font-medium">Target</th>
                      <th className="text-right p-3 font-medium">
                        Achievement
                      </th>
                      <th className="text-right p-3 font-medium">
                        Weight Allocation
                      </th>
                      <th className="text-right p-3 font-medium">Cap</th>
                      <th className="text-right p-3 font-medium">Score</th>
                      <th className="text-right p-3 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.kpiScores.map((kpiScore) => {
                      const achievementPercent = kpiScore.achievementRate * 100;
                      const assignment = assignmentMap.get(kpiScore.kpi.kpiId);
                      const hasParentWeight = Boolean(
                        assignment &&
                        (assignment as any).parentWeightAllocation !== null &&
                        (assignment as any).parentWeightAllocation !== (assignment as any).weight
                      );

                      return (
                        <tr
                          key={kpiScore.aggregatedKpiScoreId}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{kpiScore.kpi.name}</p>
                              {kpiScore.kpi.description && (
                                <p className="text-xs text-muted-foreground">
                                  {kpiScore.kpi.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="text-center p-3">
                            <Badge variant="outline" className="text-xs">
                              {kpiScore.level}
                            </Badge>
                          </td>
                          <td className="text-right p-3 font-medium">
                            {formatNumber(kpiScore.actualValue)}
                          </td>
                          <td className="text-right p-3">
                            {formatNumber(kpiScore.targetValue)}
                          </td>
                          <td
                            className={`text-right p-3 font-medium ${getAchievementColor(kpiScore.achievementRate)}`}
                          >
                            {formatPercentage(kpiScore.achievementRate)}
                          </td>
                          <td className="text-right p-3">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {formatNumber(kpiScore.weight)}%
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Local
                                </span>
                              </div>
                              {hasParentWeight && assignment ? (
                                <div className="flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                  >
                                    {formatNumber((assignment as any).parentWeightAllocation)}%
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    To Dept
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="text-right p-3">
                            {formatPercentage(kpiScore.cap)}
                          </td>
                          <td className="text-right p-3 font-bold text-primary">
                            {formatNumber(kpiScore.score)}%
                          </td>
                          <td className="text-right p-3">
                            <div className="flex items-center justify-end gap-2">
                              <Progress
                                value={Math.min(achievementPercent, 100)}
                                className="w-20"
                              />
                              <span className="text-xs text-muted-foreground w-12">
                                {formatNumber(achievementPercent)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 font-bold">
                    <tr>
                      <td className="p-3">Total</td>
                      <td className="text-right p-3" colSpan={6}></td>
                      <td className="text-right p-3 text-primary text-lg">
                        {formatNumber(scorecard.totalScore)}%
                      </td>
                      <td className="text-right p-3">
                        <Badge {...getAchievementBadge(totalScoreRate)}>
                          {
                            getAchievementBadge(totalScoreRate).label
                          }
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Formula Explanation */}
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                <h4 className="text-sm font-semibold mb-2">
                  How Scores are Calculated
                </h4>
                <p className="text-xs text-muted-foreground">
                  <strong>Formula:</strong> Score = Weight × min(Actual /
                  Target, Cap)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  • <strong>Actual:</strong> Sum of approved logbook
                  achievements for this KPI
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Target:</strong> Your assigned target value
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Weight:</strong> Percentage contribution to total
                  score
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Cap:</strong> Maximum achievement rate (e.g., 150%
                  means max 1.5x of weight)
                </p>

                {/* Weight Allocation Explanation */}
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Understanding Weight Allocation
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Each KPI can have two weight values:
                  </p>
                  <div className="ml-4 mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      • <strong>Local Weight:</strong> Used for your personal performance tracking and scorecard display
                    </p>
                    <p className="text-xs text-muted-foreground">
                      • <strong>Parent Contribution:</strong> The weight sent to your department when you achieve 100%
                    </p>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      <strong>Example:</strong> Your KPI shows 8% locally for your tracking, but contributes 6% to the department when fully achieved. This allows flexible local display while maintaining proper cascade aggregation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
