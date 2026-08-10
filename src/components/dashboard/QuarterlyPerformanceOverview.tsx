"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import SuperAdminOrganizationPerformance from "@/components/dashboard/SuperAdminOrganizationPerformance";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { GET_KPI_QUARTER_PERFORMANCE_REPORT } from "@/lib/graphql/queries/quarterly-performance";
import {
  findEnclosingAnnualPeriod,
  getQuarterLabelForPeriod,
  isQuarterlyPeriod,
} from "@/lib/strategic-periods/periodDates";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import type {
  KpiQuarterPerformanceReport,
  KpiQuarterReportSummary,
} from "@/types/graphql";

const formatNumber = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    Number(value || 0),
  );

const formatPercent = (rate: number) => `${formatNumber(Number(rate || 0) * 100)}%`;

const scopeLabels = {
  SELF: "My performance",
  DEPARTMENT: "Department performance",
  DIVISION: "Division performance",
  ORGANIZATION: "Organization performance",
} as const;

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuarterCard({
  quarter,
  selected,
}: {
  quarter: KpiQuarterReportSummary & { quarterNumber: number };
  selected: boolean;
}) {
  const achievement = Number(quarter.averageAchievementRate || 0) * 100;
  const hasResults = quarter.rowCount > 0;

  return (
    <div
      className={`rounded-lg border p-3 ${selected ? "border-primary bg-primary/5" : "bg-card"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">Q{quarter.quarterNumber}</span>
        <Badge variant={quarter.finalCount > 0 ? "default" : "secondary"}>
          {quarter.finalCount > 0 ? "Final" : hasResults ? "Provisional" : "No data"}
        </Badge>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-xl font-semibold tabular-nums">
          {hasResults ? `${formatNumber(achievement)}%` : "—"}
        </span>
        <span className="text-xs text-muted-foreground">
          {quarter.kpiCount} KPI{quarter.kpiCount === 1 ? "" : "s"}
        </span>
      </div>
      <Progress value={Math.min(Math.max(achievement, 0), 100)} className="mt-2 h-1.5" />
      <p className="mt-2 text-xs text-muted-foreground">
        Annual contribution: {formatNumber(quarter.annualContribution)}%
      </p>
    </div>
  );
}

export default function QuarterlyPerformanceOverview() {
  const user = useAuthStore((state) => state.user);
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);
  const selectionValidated = useStrategicPeriodStore(
    (state) => state.selectionValidated,
  );
  const { strategicPeriods, loading: periodsLoading } =
    useActiveStrategicPlanPeriods();

  const context = useMemo(() => {
    if (!selectedPeriod) return null;

    const annualPeriod = findEnclosingAnnualPeriod(selectedPeriod, strategicPeriods);
    if (!annualPeriod) return null;

    const quarterNumber = isQuarterlyPeriod(selectedPeriod)
      ? Number(getQuarterLabelForPeriod(selectedPeriod, strategicPeriods).replace("Q", ""))
      : undefined;

    return {
      annualPeriod,
      quarterNumber:
        quarterNumber && quarterNumber >= 1 && quarterNumber <= 4
          ? quarterNumber
          : undefined,
    };
  }, [selectedPeriod, strategicPeriods]);

  const { data, loading, error } = useQuery<{
    kpiQuarterPerformanceReport: KpiQuarterPerformanceReport;
  }>(GET_KPI_QUARTER_PERFORMANCE_REPORT, {
    variables: {
      filters: {
        annualStrategicPeriodId: context?.annualPeriod.strategicPeriodId,
        page: 1,
        limit: 5,
      },
    },
    skip: !selectionValidated || !context?.annualPeriod.strategicPeriodId,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  if (!selectionValidated || !selectedPeriod || periodsLoading || loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-5 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!context) return null;

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Quarterly performance is unavailable</p>
            <p className="text-muted-foreground">
              Annual dashboard metrics remain available. Open Quarterly Reports for details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const report = data?.kpiQuarterPerformanceReport;
  if (!report) return null;

  const selectedQuarterSummary = context.quarterNumber
    ? report.quarterSummaries.find(
        (quarter) => quarter.quarterNumber === context.quarterNumber,
      )
    : undefined;
  const summary = selectedQuarterSummary ||
    (context.quarterNumber
      ? {
          rowCount: 0,
          kpiCount: 0,
          originalTarget: 0,
          carryIn: 0,
          effectiveTarget: 0,
          actual: 0,
          averageAchievementRate: 0,
          annualContribution: 0,
          carryOut: 0,
          finalCount: 0,
          provisionalCount: 0,
          pendingResultCount: 0,
        }
      : report.summary);
  const selectedLabel = context.quarterNumber
    ? `Q${context.quarterNumber}`
    : "Annual / YTD";
  const scopeLabel = scopeLabels[report.scope] || "Quarterly performance";
  const carryDetail =
    Number(summary.carryIn || 0) === 0
      ? "No carry-in adjustment"
      : `Original ${formatNumber(summary.originalTarget)} · Carry ${summary.carryIn > 0 ? "+" : ""}${formatNumber(summary.carryIn)}`;
  const statusCount = summary.pendingResultCount + summary.provisionalCount;
  const attentionItems = [
    summary.pendingResultCount > 0
      ? `${summary.pendingResultCount} KPI quarter${summary.pendingResultCount === 1 ? " has" : "s have"} no approved achievement yet`
      : null,
    summary.provisionalCount > 0
      ? `${summary.provisionalCount} calculated result${summary.provisionalCount === 1 ? " is" : "s are"} provisional until quarter close`
      : null,
    Number(summary.carryOut || 0) !== 0
      ? `${summary.carryOut > 0 ? "+" : ""}${formatNumber(summary.carryOut)} projected carry`
      : null,
  ].filter(Boolean) as string[];

  return (
    <section className="space-y-4" aria-labelledby="quarterly-performance-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="quarterly-performance-heading" className="text-lg font-semibold">
              {scopeLabel}
            </h2>
            <Badge variant="outline">{report.annualStrategicPeriodName}</Badge>
            <Badge>{selectedLabel}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved achievement only. Pending logbooks are excluded from official results.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/reports">
            Full quarterly report <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {summary.rowCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No quarterly performance in {selectedLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No approved quarterly plans or calculated results are available for your authorized scope.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Effective target"
              value={formatNumber(summary.effectiveTarget)}
              detail={carryDetail}
              icon={<Target className="h-4 w-4" />}
            />
            <MetricCard
              label="Approved actual"
              value={formatNumber(summary.actual)}
              detail={`${summary.kpiCount} KPI${summary.kpiCount === 1 ? "" : "s"} in scope`}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <MetricCard
              label="Achievement"
              value={formatPercent(summary.averageAchievementRate)}
              detail={`${summary.finalCount} final · ${summary.provisionalCount} provisional`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              label="Annual contribution"
              value={`${formatNumber(summary.annualContribution)}%`}
              detail="Weighted contribution from this view"
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>

          {user?.role === "SUPER_ADMIN" && report.scope === "ORGANIZATION" && (
            <SuperAdminOrganizationPerformance report={report} />
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quarter trend</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((quarterNumber) => {
                  const quarter = report.quarterSummaries.find(
                    (item) => item.quarterNumber === quarterNumber,
                  ) || {
                    quarterNumber,
                    rowCount: 0,
                    kpiCount: 0,
                    originalTarget: 0,
                    carryIn: 0,
                    effectiveTarget: 0,
                    actual: 0,
                    averageAchievementRate: 0,
                    annualContribution: 0,
                    carryOut: 0,
                    finalCount: 0,
                    provisionalCount: 0,
                    pendingResultCount: 0,
                  };

                  return (
                    <QuarterCard
                      key={quarterNumber}
                      quarter={quarter}
                      selected={context.quarterNumber === quarterNumber}
                    />
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  Quarter status
                  {statusCount > 0 && <Badge variant="secondary">{statusCount}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attentionItems.length === 0 ? (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    Quarterly performance is calculated and up to date.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {attentionItems.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
