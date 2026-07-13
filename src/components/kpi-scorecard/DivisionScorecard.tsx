"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import {
  Network,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  Info,
  User,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_TOTAL_SCORECARD_SCORE } from "@/lib/graphql/queries/kpi-scorecard";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
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
import { KpiModeBadge } from "@/components/kpis/KpiModeBadge";
import { QuarterPerformanceCell } from "./QuarterPerformanceCell";
import type { KpiQuarterPlan, KpiQuarterResult } from "@/types/graphql";

interface KpiScore {
  aggregatedKpiScoreId: string;
  kpi: {
    kpiId: string;
    name: string;
    description: string;
    kpiMode?: string;
    managerRetentionPercent?: number;
    quarterPlans?: KpiQuarterPlan[];
    quarterResults?: KpiQuarterResult[];
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
  managerActual?: number;
  managerTarget?: number;
  teamActual?: number;
  teamTarget?: number;
  managerAchievementRate?: number;
  teamAchievementRate?: number;
}

interface ScorecardData {
  totalScore: number;
  maxPossibleScore: number;
  percentageAchieved: number;
  kpiScores: KpiScore[];
}

export default function DivisionScorecard({
  capFinalScore = false,
}: {
  capFinalScore?: boolean;
}) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canReadAll = can("evaluations:read_all");

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // Fetch strategic periods
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 50 },
  });

  const periods = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((p: any) => p.isActive);

  // Set active period as default
  useEffect(() => {
    if (activePeriod && !selectedPeriodId) {
      setSelectedPeriodId(activePeriod.strategicPeriodId);
    }
  }, [activePeriod, selectedPeriodId]);

  // Fetch divisions
  const { data: divisionsData } = useQuery(GET_DIVISIONS, {
    variables: { page: 1, limit: 1000 },
  });

  const divisions = divisionsData?.divisions?.items || [];

  // Set first division as default
  useEffect(() => {
    if (divisions.length > 0 && !selectedDivisionId) {
      setSelectedDivisionId(divisions[0].divisionId);
    }
  }, [divisions, selectedDivisionId]);

  // Fetch scorecard data
  const { data: scorecardData, loading: scorecardLoading } = useQuery(
    GET_TOTAL_SCORECARD_SCORE,
    {
      variables: {
        level: "DIVISION",
        entityId: selectedDivisionId,
        periodId: selectedPeriodId,
        capFinalScore,
      },
      skip: !selectedDivisionId || !selectedPeriodId,
      fetchPolicy: "network-only",
    },
  );

  const scorecard: ScorecardData | undefined =
    scorecardData?.totalScorecardScore;

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

  const selectedDivision = divisions.find(
    (d: any) => d.divisionId === selectedDivisionId,
  );

  const selectedPeriod = periods.find(
    (p: any) => p.strategicPeriodId === selectedPeriodId,
  );

  if (!canReadAll) {
    return (
      <Card>
        <CardContent className="p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-center">
            You don't have permission to view division scorecards.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Division KPI Scorecard
          </h2>
          <p className="text-muted-foreground">
            Track division-level KPI performance
          </p>
        </div>
        <Network className="h-8 w-8 text-primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Division Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Division</label>
              <Select
                value={selectedDivisionId}
                onValueChange={setSelectedDivisionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((div: any) => (
                    <SelectItem key={div.divisionId} value={div.divisionId}>
                      {div.name} ({div.departments?.length || 0} departments)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period: any) => (
                    <SelectItem
                      key={period.strategicPeriodId}
                      value={period.strategicPeriodId}
                    >
                      {period.name} {period.isActive ? "(Active)" : ""}
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
              No KPI scorecard data found for this division and period.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure division KPIs are assigned, cascade mappings are created
              from departments to divisions, and scores have been calculated.
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
              <CardTitle>Division KPI Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">KPI Name</th>
                      <th className="text-center p-3 font-medium">Mode</th>
                      <th className="text-center p-3 font-medium">
                        Quarterly Performance
                      </th>
                      <th className="text-right p-3 font-medium">
                        Actual (Aggregated)
                      </th>
                      <th className="text-right p-3 font-medium">Target</th>
                      <th className="text-right p-3 font-medium">
                        Achievement
                      </th>
                      <th className="text-right p-3 font-medium">Weight</th>
                      <th className="text-right p-3 font-medium">Cap</th>
                      <th className="text-right p-3 font-medium">Score</th>
                      <th className="text-right p-3 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.kpiScores.map((kpiScore) => {
                      const achievementPercent = kpiScore.achievementRate * 100;
                      const badge = getAchievementBadge(
                        kpiScore.achievementRate,
                      );
                      const kpiMode = kpiScore.kpi.kpiMode || "AGGREGATED";
                      const hasHybridBreakdown =
                        kpiMode === "HYBRID" &&
                        kpiScore.managerActual !== undefined &&
                        kpiScore.teamActual !== undefined;

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
                            <div className="flex flex-col items-center gap-2">
                              <KpiModeBadge mode={kpiMode} size="sm" />
                              {kpiMode === "AGGREGATED" && (
                                <p className="text-xs text-muted-foreground">
                                  (from departments)
                                </p>
                              )}
                              {kpiMode === "DIRECT" && (
                                <p className="text-xs text-muted-foreground">
                                  (Div Head Only)
                                </p>
                              )}
                              {kpiMode === "HYBRID" &&
                                kpiScore.kpi.managerRetentionPercent && (
                                  <p className="text-xs text-muted-foreground">
                                    {kpiScore.kpi.managerRetentionPercent}% mgr
                                    /{" "}
                                    {100 - kpiScore.kpi.managerRetentionPercent}
                                    % depts
                                  </p>
                                )}
                            </div>
                            {hasHybridBreakdown && (
                              <div className="mt-2 text-xs space-y-1 border-t pt-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    Div Head:
                                  </span>
                                  <span className="font-medium">
                                    {formatNumber(kpiScore.managerActual!)} /{" "}
                                    {formatNumber(kpiScore.managerTarget!)}
                                    {kpiScore.managerAchievementRate !==
                                      undefined && (
                                      <span
                                        className={`ml-1 ${getAchievementColor(kpiScore.managerAchievementRate)}`}
                                      >
                                        (
                                        {formatPercentage(
                                          kpiScore.managerAchievementRate,
                                        )}
                                        )
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    Departments:
                                  </span>
                                  <span className="font-medium">
                                    {formatNumber(kpiScore.teamActual!)} /{" "}
                                    {formatNumber(kpiScore.teamTarget!)}
                                    {kpiScore.teamAchievementRate !==
                                      undefined && (
                                      <span
                                        className={`ml-1 ${getAchievementColor(kpiScore.teamAchievementRate)}`}
                                      >
                                        (
                                        {formatPercentage(
                                          kpiScore.teamAchievementRate,
                                        )}
                                        )
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <QuarterPerformanceCell
                              kpiId={kpiScore.kpi.kpiId}
                              plans={kpiScore.kpi.quarterPlans}
                              results={kpiScore.kpi.quarterResults}
                            />
                          </td>
                          <td className="text-right p-3 font-medium">
                            {formatNumber(kpiScore.actualValue)}
                            <p className="text-xs text-muted-foreground">
                              (from departments)
                            </p>
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
                            {formatNumber(kpiScore.weight)}%
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
                        <Badge
                          {...getAchievementBadge(scorecard.totalScore / 100)}
                        >
                          {
                            getAchievementBadge(scorecard.totalScore / 100)
                              .label
                          }
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Formula Explanation */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-semibold mb-2">
                  How Division Scores are Calculated
                </h4>
                <p className="text-xs text-muted-foreground">
                  <strong>Formula:</strong> Score = Weight × min(Actual /
                  Target, Cap)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  • <strong>Actual:</strong> Sum of department actual values
                  (NOT scores) mapped to this division KPI
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Target:</strong> Division's assigned target value
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Weight:</strong> Percentage contribution to division
                  total score
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Cap:</strong> Maximum achievement rate (e.g., 150%
                  means max 1.5x of weight)
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-semibold">
                  ⚠️ Key: Division scores are calculated using division-level
                  targets, NOT department or individual targets!
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
