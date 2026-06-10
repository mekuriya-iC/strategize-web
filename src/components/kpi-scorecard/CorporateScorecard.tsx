"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import {
  Building2,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_TOTAL_SCORECARD_SCORE } from "@/lib/graphql/queries/kpi-scorecard";
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
    description?: string;
  };
  actualValue: number;
  targetValue: number;
  weight: number;
  cap: number;
  achievementRate: number;
  score: number;
  calculatedAt: string;
}

interface ScorecardData {
  totalScore: number;
  uncappedTotalScore: number;
  maxPossibleScore: number;
  finalScoreCapApplied: boolean;
  percentageAchieved: number;
  kpiScores: KpiScore[];
}

interface StrategicPeriod {
  strategicPeriodId: string;
  name: string;
  isActive?: boolean;
}

export default function CorporateScorecard({
  capFinalScore = false,
}: {
  capFinalScore?: boolean;
}) {
  const { can } = usePermissions();
  const canReadAll = can("evaluations:read_all");
  const organizationId = useOrganizationId();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 50 },
  });

  const periods: StrategicPeriod[] = periodsData?.strategicPeriods?.items || [];
  const activePeriod = periods.find((period) => period.isActive);

  useEffect(() => {
    if (activePeriod && !selectedPeriodId) {
      setSelectedPeriodId(activePeriod.strategicPeriodId);
    }
  }, [activePeriod, selectedPeriodId]);

  const { data: scorecardData, loading: scorecardLoading } = useQuery(
    GET_TOTAL_SCORECARD_SCORE,
    {
      variables: {
        level: "CORPORATE",
        entityId: organizationId,
        periodId: selectedPeriodId,
        capFinalScore,
      },
      skip: !organizationId || !selectedPeriodId,
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

  const formatNumber = (num: number): string => num.toFixed(2);
  const formatPercentage = (num: number): string =>
    `${(num * 100).toFixed(1)}%`;

  if (!canReadAll) {
    return (
      <Card>
        <CardContent className="p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-center">
            You do not have permission to view corporate scorecards.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-center">
            No organization is available for the current user.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Corporate KPI Scorecard
          </h2>
          <p className="text-muted-foreground">
            Track corporate-level KPI performance aggregated from mapped
            divisions.
          </p>
        </div>
        <Building2 className="h-8 w-8 text-primary" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="max-w-md">
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
                {periods.map((period) => (
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
        </CardContent>
      </Card>

      {scorecardLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading scorecard data...</p>
          </CardContent>
        </Card>
      )}

      {!scorecardLoading && !scorecard && selectedPeriodId && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No KPI scorecard data found for corporate and this period.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure corporate KPIs are assigned, division-to-corporate
              mappings are created, and scores have been calculated.
            </p>
          </CardContent>
        </Card>
      )}

      {!scorecardLoading && scorecard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  out of {formatNumber(scorecard.maxPossibleScore)}% assigned
                  weight
                </p>
                <Progress
                  value={Math.min(
                    (scorecard.totalScore / scorecard.maxPossibleScore) * 100,
                    100,
                  )}
                  className="mt-2"
                />
                {scorecard.finalScoreCapApplied && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Uncapped total: {formatNumber(scorecard.uncappedTotalScore)}
                    %
                  </p>
                )}
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Corporate KPIs
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

          <Card>
            <CardHeader>
              <CardTitle>Corporate KPI Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">KPI Name</th>
                      <th className="text-right p-3 font-medium">Actual</th>
                      <th className="text-right p-3 font-medium">Target</th>
                      <th className="text-right p-3 font-medium">
                        Achievement
                      </th>
                      <th className="text-right p-3 font-medium">Weight</th>
                      <th className="text-right p-3 font-medium">Cap</th>
                      <th className="text-right p-3 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.kpiScores.map((kpiScore) => (
                      <tr
                        key={kpiScore.aggregatedKpiScoreId}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-3">
                          <p className="font-medium">{kpiScore.kpi.name}</p>
                          {kpiScore.kpi.description && (
                            <p className="text-xs text-muted-foreground">
                              {kpiScore.kpi.description}
                            </p>
                          )}
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
                          {formatNumber(kpiScore.weight)}%
                        </td>
                        <td className="text-right p-3">
                          {formatPercentage(kpiScore.cap)}
                        </td>
                        <td className="text-right p-3 font-bold text-primary">
                          {formatNumber(kpiScore.score)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-semibold mb-2">
                  How Corporate Scores are Calculated
                </h4>
                <p className="text-xs text-muted-foreground">
                  <strong>Formula:</strong> Score = Weight × min(Actual /
                  Target, Cap)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  • <strong>Actual:</strong> Sum of mapped lower-level actual
                  values, usually division actuals, not scores
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Target:</strong> Corporate assigned target value
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Weight:</strong> Percentage contribution to
                  corporate total score
                </p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Cap:</strong> Maximum achievement rate, e.g. 150%
                  means max 1.5x of weight
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
