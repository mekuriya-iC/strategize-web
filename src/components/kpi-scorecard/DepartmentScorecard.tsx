"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import {
  Building2,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_TOTAL_SCORECARD_SCORE } from "@/lib/graphql/queries/kpi-scorecard";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
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

export default function DepartmentScorecard({
  capFinalScore = false,
}: {
  capFinalScore?: boolean;
}) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canReadAll = can("evaluations:read_all");

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
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

  // Fetch departments
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 1000 },
  });

  const departments = departmentsData?.departments?.items || [];

  // Set first department as default
  useEffect(() => {
    if (departments.length > 0 && !selectedDepartmentId) {
      setSelectedDepartmentId(departments[0].departmentId);
    }
  }, [departments, selectedDepartmentId]);

  // Fetch scorecard data
  const { data: scorecardData, loading: scorecardLoading } = useQuery(
    GET_TOTAL_SCORECARD_SCORE,
    {
      variables: {
        level: "DEPARTMENT",
        entityId: selectedDepartmentId,
        periodId: selectedPeriodId,
        capFinalScore,
      },
      skip: !selectedDepartmentId || !selectedPeriodId,
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

  const selectedDepartment = departments.find(
    (d: any) => d.departmentId === selectedDepartmentId,
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
            You don't have permission to view department scorecards.
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
            Department KPI Scorecard
          </h2>
          <p className="text-muted-foreground">
            Track department-level KPI performance
          </p>
        </div>
        <Building2 className="h-8 w-8 text-primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Department
              </label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem
                      key={dept.departmentId}
                      value={dept.departmentId}
                    >
                      {dept.name} - {dept.division?.name || "No Division"}
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
              No KPI scorecard data found for this department and period.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure department KPIs are assigned, cascade mappings are
              created, and scores have been calculated.
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
              <CardTitle>Department KPI Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">KPI Name</th>
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
                          <td className="text-right p-3 font-medium">
                            {formatNumber(kpiScore.actualValue)}
                            <p className="text-xs text-muted-foreground">
                              (from individuals)
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
                      <td className="text-right p-3" colSpan={5}></td>
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
                  How Department Scores are Calculated
                </h4>
                <p className="text-xs text-muted-foreground">
                  <strong>Formula:</strong> Score = Weight × min(Actual /
                  Target, Cap)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  • <strong>Actual:</strong> Sum of individual employee actual
                  values (NOT scores) mapped to this department KPI
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Target:</strong> Department's assigned target value
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Weight:</strong> Percentage contribution to
                  department total score
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Cap:</strong> Maximum achievement rate (e.g., 150%
                  means max 1.5x of weight)
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-semibold">
                  ⚠️ Key: Department scores are calculated using
                  department-level targets, NOT individual targets!
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
