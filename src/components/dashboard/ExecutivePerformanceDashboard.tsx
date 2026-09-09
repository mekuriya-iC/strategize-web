"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  Network,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CorporateContributors,
  OrganizationAchievement,
  QuarterStrip,
} from "@/components/dashboard/QuarterAchievementBreakdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildCorporateObjectives,
  buildSupportPerformance,
  reportQuarterAchievement,
  summaryAchievement,
} from "@/lib/dashboard/performanceDashboard";
import type {
  KpiQuarterPerformanceReport,
  StrategicPeriod,
} from "@/types/graphql";
import type { SupportPerformanceReportData } from "@/types/support-performance";

interface ExecutivePerformanceDashboardProps {
  primaryReport: KpiQuarterPerformanceReport;
  hierarchyReport: KpiQuarterPerformanceReport;
  supportReport?: SupportPerformanceReportData;
  selectedQuarter?: number;
  selectedQuarterPeriod?: StrategicPeriod;
  scopeLabel: string;
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatPercent(value: number) {
  return `${numberFormatter.format(Number.isFinite(value) ? value : 0)}%`;
}

function formatMetricValue(
  value: number | null,
  measurementUnit: string,
  customUnitLabel?: string | null,
) {
  if (value == null) return "Pending";
  const formatted =
    Math.abs(value) >= 1_000_000
      ? compactFormatter.format(value)
      : numberFormatter.format(value);
  if (measurementUnit === "PERCENTAGE") return `${formatted}%`;
  if (measurementUnit === "CURRENCY") return formatted;
  if (customUnitLabel) return `${formatted} ${customUnitLabel}`;
  return formatted;
}

function weightedRollupAchievement(
  rows: Array<{
    plannedContributionWeight: number;
    achievedContributionWeight: number;
    resultCount: number;
  }>,
): number | null {
  if (rows.reduce((sum, row) => sum + row.resultCount, 0) === 0) return null;
  const planned = rows.reduce(
    (sum, row) => sum + Number(row.plannedContributionWeight || 0),
    0,
  );
  const achieved = rows.reduce(
    (sum, row) => sum + Number(row.achievedContributionWeight || 0),
    0,
  );
  return planned > 0 ? (achieved / planned) * 100 : 0;
}

function QuarterHistory({
  values,
  selectedQuarter,
  className = "",
}: {
  values: Array<number | null>;
  selectedQuarter?: number;
  className?: string;
}) {
  return (
    <div className={`mt-3 grid max-w-md grid-cols-4 gap-1.5 ${className}`}>
      {values.map((value, index) => {
        const quarterNumber = index + 1;
        const tone = value == null ? null : performanceTone(value);
        return (
          <div
            key={quarterNumber}
            className={`rounded-md border px-2 py-1 text-center ${quarterNumber === selectedQuarter ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20" : "bg-background/70"}`}
          >
            <p className="text-[11px] font-medium uppercase text-muted-foreground">
              Q{quarterNumber}
            </p>
            <p
              className={`text-xs font-semibold tabular-nums ${tone?.text ?? "text-muted-foreground"}`}
            >
              {value == null ? "—" : formatPercent(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function performanceTone(value: number | null) {
  if (value == null) {
    return {
      label: "Awaiting data",
      text: "text-slate-600 dark:text-slate-300",
      surface: "bg-slate-100 dark:bg-slate-800",
      fill: "#94a3b8",
    };
  }
  if (value >= 100) {
    return {
      label: "On track",
      text: "text-emerald-700 dark:text-emerald-300",
      surface: "bg-emerald-50 dark:bg-emerald-950/30",
      fill: "#059669",
    };
  }
  if (value >= 80) {
    return {
      label: "Watch",
      text: "text-amber-700 dark:text-amber-300",
      surface: "bg-amber-50 dark:bg-amber-950/30",
      fill: "#d97706",
    };
  }
  return {
    label: "Needs attention",
    text: "text-red-700 dark:text-red-300",
    surface: "bg-red-50 dark:bg-red-950/30",
    fill: "#dc2626",
  };
}

function PulseCard({
  eyebrow,
  value,
  detail,
  icon,
  progress,
  accent = "#3b5bdb",
}: {
  eyebrow: string;
  value: string;
  detail: string;
  icon: ReactNode;
  progress?: number;
  accent?: string;
}) {
  return (
    <Card className="min-w-0 gap-3 rounded-xl border-primary/15 border-t-2 border-t-primary/60 bg-gradient-to-br from-primary/[0.07] via-card to-card py-4 shadow-sm">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {eyebrow}
            </p>
            <p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {value}
            </p>
          </div>
          <div className="hidden shrink-0 rounded-lg bg-primary/10 p-2 text-primary sm:block">
            {icon}
          </div>
        </div>
        <p className="mt-2 min-h-4 text-xs text-muted-foreground">{detail}</p>
        {progress != null && (
          <Progress
            className="mt-3 h-1.5"
            value={Math.min(Math.max(progress, 0), 100)}
            fillColor={accent}
            trackColor={`${accent}20`}
          />
        )}
      </CardContent>
    </Card>
  );
}

function DashboardHeader({
  periodName,
  selectedQuarter,
  scopeLabel,
}: {
  periodName: string;
  selectedQuarter?: number;
  scopeLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-card to-violet-500/[0.08] p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">
              Live performance
            </Badge>
            <Badge variant="outline">{periodName}</Badge>
            <Badge variant="outline">
              {selectedQuarter ? `Q${selectedQuarter}` : "Annual / YTD"}
            </Badge>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Performance dashboard
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {scopeLabel} · Quarterly results, organizational performance, and
            contribution detail.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="shrink-0 bg-background lg:self-center"
        >
          <Link href="/dashboard/reports">
            Open detailed reports <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CorporateScorecards({
  report,
  selectedQuarter,
}: {
  report: KpiQuarterPerformanceReport;
  selectedQuarter?: number;
}) {
  const objectives = buildCorporateObjectives(report.kpiRollups);
  const quarterRollups = report.kpiQuarterRollups ?? [];

  return (
    <section
      className="space-y-3"
      aria-labelledby="corporate-scorecards-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3
            id="corporate-scorecards-heading"
            className="text-lg font-semibold"
          >
            {report.scope === "ORGANIZATION"
              ? "Corporate scorecards"
              : "Direct scorecards"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Weighted results from the approved target-allocation chain.
          </p>
        </div>
        <Badge variant="secondary">
          {objectives.length} objective{objectives.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {objectives.length === 0 ? (
        <Card className="border-dashed py-8">
          <CardContent className="text-center text-sm text-muted-foreground">
            No direct KPI results are available for this period.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {objectives.map((objective) => {
            const hasResult = objective.kpis.some((kpi) => kpi.resultCount > 0);
            const tone = performanceTone(
              hasResult ? objective.achievement : null,
            );
            const objectiveHistory = [1, 2, 3, 4].map((quarterNumber) =>
              weightedRollupAchievement(
                quarterRollups.filter(
                  (row) =>
                    row.objectiveId === objective.objectiveId &&
                    row.quarterNumber === quarterNumber,
                ),
              ),
            );
            return (
              <details
                key={objective.objectiveId}
                className="group overflow-hidden rounded-xl border bg-card"
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 transition-colors hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-ring sm:px-5 [&::-webkit-details-marker]:hidden">
                  <div className="grid min-w-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-x-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {objective.weight != null && (
                        <Badge variant="outline">
                          {objective.weight}% weight
                        </Badge>
                      )}
                      <Badge
                        className={`${tone.surface} ${tone.text} border-0`}
                      >
                        {hasResult
                          ? `${formatPercent(objective.achievement)} `
                          : ""}
                        {tone.label}
                      </Badge>
                      <Badge variant="secondary">Direct</Badge>
                    </div>
                    <h4 className="mt-2 break-words text-base font-semibold lg:col-start-1">
                      {objective.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground lg:col-start-1">
                      {objective.kpis.length} corporate KPI
                      {objective.kpis.length === 1 ? "" : "s"} · achieved score
                      weight {numberFormatter.format(objective.achievedWeight)}{" "}
                      of {numberFormatter.format(objective.plannedWeight)}
                    </p>
                    <Progress
                      className="mt-3 h-1.5 lg:col-start-1"
                      value={Math.min(Math.max(objective.achievement, 0), 100)}
                      fillColor={tone.fill}
                      trackColor={`${tone.fill}20`}
                    />
                    <QuarterHistory
                      values={objectiveHistory}
                      selectedQuarter={selectedQuarter}
                      className="lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:w-full lg:self-center"
                    />
                  </div>
                  <ChevronDown className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t bg-slate-50/70 p-3 dark:bg-slate-950/30">
                  <div className="space-y-2">
                    {objective.kpis.map((kpi) => {
                      const kpiTone = performanceTone(
                        kpi.resultCount > 0 ? kpi.achievement : null,
                      );
                      const kpiHistory = [1, 2, 3, 4].map((quarterNumber) =>
                        weightedRollupAchievement(
                          quarterRollups.filter(
                            (row) =>
                              row.kpiId === kpi.kpiId &&
                              row.quarterNumber === quarterNumber,
                          ),
                        ),
                      );
                      return (
                        <div
                          key={kpi.kpiId}
                          className="rounded-xl border bg-background px-4 py-3"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: kpiTone.fill }}
                                />
                                <p className="break-words text-sm font-semibold">
                                  {kpi.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {kpi.weight}% KPI weight
                                </Badge>
                              </div>
                              <Progress
                                className="mt-2 h-1"
                                value={Math.min(
                                  Math.max(kpi.achievement, 0),
                                  100,
                                )}
                                fillColor={kpiTone.fill}
                                trackColor={`${kpiTone.fill}18`}
                              />
                              <QuarterHistory
                                values={kpiHistory}
                                selectedQuarter={selectedQuarter}
                              />
                            </div>
                            <div className="grid min-w-0 grid-cols-3 gap-2 rounded-lg bg-muted/35 p-3 text-left sm:gap-4 lg:w-[390px] lg:text-right">
                              <MetricValue
                                label="Target"
                                value={formatMetricValue(
                                  kpi.target,
                                  kpi.measurementUnit,
                                  kpi.customUnitLabel,
                                )}
                              />
                              <MetricValue
                                label="Actual"
                                value={formatMetricValue(
                                  kpi.actual,
                                  kpi.measurementUnit,
                                  kpi.customUnitLabel,
                                )}
                              />
                              <MetricValue
                                label="Achievement"
                                value={
                                  kpi.resultCount > 0
                                    ? formatPercent(kpi.achievement)
                                    : "Pending"
                                }
                                className={kpiTone.text}
                                detail={`${numberFormatter.format(kpi.resultCoverage)}% data coverage`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MetricValue({
  label,
  value,
  detail,
  className = "",
}: {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={`break-words text-sm font-semibold tabular-nums ${className}`}
      >
        {value}
      </p>
      {detail && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {detail}
        </p>
      )}
    </div>
  );
}

function SupportImpactSection({
  report,
  selectedQuarter,
}: {
  report?: SupportPerformanceReportData;
  selectedQuarter?: number;
}) {
  if (!report) return null;
  const support = buildSupportPerformance(
    report.rows,
    report.sourceSummaries,
    selectedQuarter,
  );

  return (
    <section className="space-y-3" aria-labelledby="support-impact-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="support-impact-heading" className="text-lg font-semibold">
              Support achievement
            </h3>
            <Badge className="border-0 bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300">
              Separate impact signal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Weighted attainment of local support KPIs. These percentages do not
            increase corporate achievement.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {report.readiness.ready} ready · {report.readiness.noLocalKpi} without
          local KPIs ·{" "}
          {report.readiness.planningIncomplete +
            report.readiness.pendingApproval}{" "}
          pending
        </p>
      </div>

      {support.length === 0 ? (
        <Card className="border-dashed py-8">
          <CardContent className="text-center text-sm text-muted-foreground">
            No support KPI results are available in this scope.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {support.map((item) => {
            const tone = performanceTone(item.achievement);
            return (
              <Card key={item.sourceKpiId} className="gap-4 py-4">
                <CardHeader className="px-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                        <Network className="h-3.5 w-3.5" /> Supports corporate
                        KPI
                      </div>
                      <CardTitle className="mt-2 break-words text-sm">
                        {item.sourceKpiName}
                      </CardTitle>
                      <CardDescription className="mt-1 break-words text-xs">
                        {item.sourceObjectiveTitle}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold tabular-nums ${tone.text}`}
                      >
                        {formatPercent(item.achievement)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        support attainment
                      </p>
                    </div>
                  </div>
                  <Progress
                    className="mt-3 h-1.5"
                    value={Math.min(Math.max(item.achievement, 0), 100)}
                    fillColor="#7c3aed"
                    trackColor="#7c3aed20"
                  />
                </CardHeader>
                <CardContent className="space-y-2 px-4">
                  {item.rows.length === 0 ? (
                    <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Supporting KPI details continue in the full support
                      report.
                    </p>
                  ) : (
                    item.rows.slice(0, 4).map((row) => (
                      <div
                        key={row.id}
                        className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium">
                            {row.localKpiName}
                          </p>
                          <p className="break-words text-xs text-muted-foreground">
                            {row.unitName}
                            {row.expectedImpact
                              ? ` · ${row.expectedImpact}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums">
                          {row.achievement == null
                            ? "Pending"
                            : formatPercent(row.achievement)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QuarterExecutionCurve({
  report,
}: {
  report: KpiQuarterPerformanceReport;
}) {
  const data = [1, 2, 3, 4].map((quarterNumber) => {
    const quarter = report.quarterSummaries.find(
      (item) => item.quarterNumber === quarterNumber,
    );
    const hasResult =
      Number(quarter?.finalCount || 0) +
        Number(quarter?.provisionalCount || 0) >
      0;
    return {
      quarter: `Q${quarterNumber}`,
      actual: hasResult
        ? reportQuarterAchievement(report, quarterNumber)
        : null,
    };
  });

  return (
    <Card className="gap-3 border-primary/15 bg-gradient-to-b from-primary/[0.06] to-card py-4 shadow-none">
      <CardHeader className="px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">Quarterly execution curve</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Calculated quarter achievement against the 100% target. Pending
              quarters remain empty.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-primary" /> Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dashed border-primary" />
              Target
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[260px] px-2 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 16, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="directAchievementFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.26} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              opacity={0.25}
            />
            <XAxis
              dataKey="quarter"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tick={{ fill: "var(--muted-foreground)" }}
              domain={[
                0,
                (max: number) =>
                  Number.isFinite(max)
                    ? Math.max(110, Math.ceil(max / 10) * 10)
                    : 110,
              ]}
            />
            <Tooltip
              formatter={(value) =>
                value == null ? "Pending" : formatPercent(Number(value))
              }
              contentStyle={{
                borderRadius: 12,
                borderColor: "var(--border)",
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={100}
              ifOverflow="extendDomain"
              stroke="var(--primary)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: "Target 100%",
                position: "insideTopRight",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <Area
              type="linear"
              dataKey="actual"
              name="Achievement"
              stroke="var(--primary)"
              strokeWidth={3}
              fill="url(#directAchievementFill)"
              connectNulls={false}
              dot={{
                r: 5,
                fill: "var(--primary)",
                stroke: "var(--card)",
                strokeWidth: 2,
              }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
      <div className="mx-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {data.every((quarter) => quarter.actual == null)
          ? "No calculated quarter results yet. The dashed line is the target; achievement points appear as results become available. Pending results are not treated as zero."
          : "Each point is a calculated quarterly result. Gaps indicate pending results; a single result appears as a dot until another quarter is available."}
      </div>
    </Card>
  );
}

export default function ExecutivePerformanceDashboard({
  primaryReport,
  hierarchyReport,
  supportReport,
  selectedQuarter,
  selectedQuarterPeriod,
  scopeLabel,
}: ExecutivePerformanceDashboardProps) {
  const directAchievement = summaryAchievement(primaryReport.summary);
  const hasDirectResult =
    primaryReport.summary.finalCount + primaryReport.summary.provisionalCount >
    0;
  const coverage = Number(primaryReport.summary.resultCoverageRate || 0) * 100;
  const objectives = new Set(
    primaryReport.kpiRollups.flatMap((item) =>
      item.objectiveId ? [item.objectiveId] : [],
    ),
  );
  const readiness = supportReport?.readiness;

  return (
    <section
      className="min-w-0 space-y-5 text-foreground [--muted-foreground:#526175] [--ring:var(--primary)] dark:[--muted-foreground:#a8b4c5] dark:[--primary:#a5a5ff]"
      aria-labelledby="performance-command-center"
    >
      <DashboardHeader
        periodName={primaryReport.annualStrategicPeriodName}
        selectedQuarter={selectedQuarter}
        scopeLabel={scopeLabel}
      />

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Executive pulse
            </p>
            <h3
              id="performance-command-center"
              className="mt-1 text-lg font-semibold"
            >
              Performance at a glance
            </h3>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
            Approved logbooks only
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 [&>div:first-child]:col-span-2 md:[&>div:first-child]:col-span-1">
          <PulseCard
            eyebrow="Direct achievement"
            value={
              hasDirectResult ? formatPercent(directAchievement) : "Pending"
            }
            detail={`${numberFormatter.format(primaryReport.summary.achievedContributionWeight)} of ${numberFormatter.format(primaryReport.summary.plannedContributionWeight)} planned score weight`}
            icon={<TrendingUp className="h-4 w-4" />}
            progress={directAchievement}
            accent={
              performanceTone(hasDirectResult ? directAchievement : null).fill
            }
          />
          <PulseCard
            eyebrow="Strategic goals"
            value={`${objectives.size}`}
            detail="Objectives represented by direct KPIs"
            icon={<Target className="h-4 w-4" />}
          />
          <PulseCard
            eyebrow="Direct KPIs"
            value={`${primaryReport.summary.kpiCount}`}
            detail={`${primaryReport.summary.finalCount} final · ${primaryReport.summary.provisionalCount} live`}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <PulseCard
            eyebrow="Result coverage"
            value={formatPercent(coverage)}
            detail={`${primaryReport.summary.pendingResultCount} result${primaryReport.summary.pendingResultCount === 1 ? "" : "s"} pending`}
            icon={<Activity className="h-4 w-4" />}
            progress={coverage}
            accent="#4f46e5"
          />
          <PulseCard
            eyebrow="Support network"
            value={`${readiness?.totalAssignments ?? 0}`}
            detail={`${readiness?.ready ?? 0} ready · ${readiness?.noLocalKpi ?? 0} need local KPIs`}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="min-w-0 gap-0 overflow-hidden rounded-2xl border bg-card shadow-sm"
      >
        <div className="border-b bg-muted/30 p-2 sm:p-3">
          <TabsList
            aria-label="Performance sections"
            className="grid h-auto w-full grid-cols-2 gap-1 bg-transparent p-0 sm:flex sm:flex-wrap"
          >
            <TabsTrigger
              value="overview"
              className="min-h-11 px-3 data-[state=active]:text-primary"
            >
              <Activity /> Overview
            </TabsTrigger>
            <TabsTrigger
              value="scorecards"
              className="min-h-11 px-3 data-[state=active]:text-primary"
            >
              <Target /> Scorecards
            </TabsTrigger>
            <TabsTrigger
              value="units"
              className="min-h-11 px-3 data-[state=active]:text-primary"
            >
              <Building2 />
              <span className="sm:hidden">Units</span>
              <span className="hidden sm:inline">Divisions & departments</span>
            </TabsTrigger>
            <TabsTrigger
              value="contributors"
              className="min-h-11 px-3 data-[state=active]:text-primary"
            >
              <Network /> Contributors
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="min-h-11 px-3 data-[state=active]:text-primary"
            >
              <ShieldCheck /> Support
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="min-w-0 space-y-6 p-3 sm:p-6">
          {selectedQuarter && (
            <QuarterStrip
              report={primaryReport}
              selectedQuarter={selectedQuarter}
              selectedQuarterPeriod={selectedQuarterPeriod}
            />
          )}
          <div className="border-t pt-6">
            <QuarterExecutionCurve report={primaryReport} />
          </div>
        </TabsContent>
        <TabsContent value="scorecards" className="min-w-0 p-3 sm:p-6">
          <CorporateScorecards
            report={primaryReport}
            selectedQuarter={selectedQuarter}
          />
        </TabsContent>
        <TabsContent value="units" className="min-w-0 p-3 sm:p-6">
          {selectedQuarter ? (
            <OrganizationAchievement
              report={hierarchyReport}
              selectedQuarter={selectedQuarter}
              selectedQuarterPeriod={selectedQuarterPeriod}
            />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              Select a quarter to explore division and department achievement.
            </p>
          )}
        </TabsContent>
        <TabsContent value="contributors" className="min-w-0 p-3 sm:p-6">
          {selectedQuarter ? (
            <CorporateContributors
              primaryReport={primaryReport}
              hierarchyReport={hierarchyReport}
              selectedQuarter={selectedQuarter}
            />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              Select a quarter to explore KPI contributors.
            </p>
          )}
        </TabsContent>
        <TabsContent value="support" className="min-w-0 p-3 sm:p-6">
          {supportReport ? (
            <SupportImpactSection
              report={supportReport}
              selectedQuarter={selectedQuarter}
            />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              Support performance is not available for this selection.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-start gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          Direct and support results are intentionally reported as separate
          performance streams.
        </span>
        <Link
          href="/dashboard/reports"
          className="shrink-0 font-medium text-primary hover:underline"
        >
          Audit the numbers
        </Link>
      </div>
    </section>
  );
}
