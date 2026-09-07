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
  CircleGauge,
  Network,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
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
  buildCorporateObjectives,
  buildSupportPerformance,
  reportQuarterAchievement,
  summaryAchievement,
} from "@/lib/dashboard/performanceDashboard";
import type { KpiQuarterPerformanceReport } from "@/types/graphql";
import type { SupportPerformanceReportData } from "@/types/support-performance";

interface ExecutivePerformanceDashboardProps {
  primaryReport: KpiQuarterPerformanceReport;
  hierarchyReport: KpiQuarterPerformanceReport;
  supportReport?: SupportPerformanceReportData;
  selectedQuarter?: number;
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

function performanceTone(value: number) {
  if (value >= 100) {
    return {
      label: "On track",
      text: "text-emerald-700 dark:text-emerald-300",
      surface: "bg-emerald-50 dark:bg-emerald-950/30",
      fill: "#059669",
    };
  }
  if (value >= 75) {
    return {
      label: "Watch",
      text: "text-blue-700 dark:text-blue-300",
      surface: "bg-blue-50 dark:bg-blue-950/30",
      fill: "#3b5bdb",
    };
  }
  return {
    label: "Needs attention",
    text: "text-amber-700 dark:text-amber-300",
    surface: "bg-amber-50 dark:bg-amber-950/30",
    fill: "#d97706",
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
    <Card className="gap-3 border-border/70 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {value}
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
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
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-[linear-gradient(135deg,rgba(79,70,229,0.08),rgba(255,255,255,0.95)_42%,rgba(16,185,129,0.07))] p-5 dark:border-indigo-900/50 dark:bg-[linear-gradient(135deg,rgba(79,70,229,0.18),rgba(15,23,42,0.9)_45%,rgba(16,185,129,0.1))]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-indigo-600 hover:bg-indigo-600">
              Live performance
            </Badge>
            <Badge variant="outline">{periodName}</Badge>
            <Badge variant="outline">
              {selectedQuarter ? `Q${selectedQuarter}` : "Annual / YTD"}
            </Badge>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            Performance command center
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {scopeLabel}. Corporate achievement contains target-allocation KPIs
            only; support achievement is calculated and displayed separately.
          </p>
        </div>
        <Button asChild variant="outline" className="bg-background/80">
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
}: {
  report: KpiQuarterPerformanceReport;
}) {
  const objectives = buildCorporateObjectives(report.kpiRollups);

  return (
    <section className="space-y-3" aria-labelledby="corporate-scorecards-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 id="corporate-scorecards-heading" className="text-lg font-semibold">
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
          {objectives.map((objective, index) => {
            const tone = performanceTone(objective.achievement);
            return (
              <details
                key={objective.objectiveId}
                open={index === 0}
                className="group overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(15,23,42,0.04)]"
              >
                <summary className="flex cursor-pointer list-none items-start gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {objective.weight != null && (
                        <Badge variant="outline">{objective.weight}% weight</Badge>
                      )}
                      <Badge className={`${tone.surface} ${tone.text} border-0`}>
                        {formatPercent(objective.achievement)} {tone.label}
                      </Badge>
                      <Badge variant="secondary">Direct</Badge>
                    </div>
                    <h4 className="mt-2 truncate text-base font-semibold">
                      {objective.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {objective.kpis.length} corporate KPI
                      {objective.kpis.length === 1 ? "" : "s"} · achieved score
                      weight {numberFormatter.format(objective.achievedWeight)} of{" "}
                      {numberFormatter.format(objective.plannedWeight)}
                    </p>
                    <Progress
                      className="mt-3 h-1.5"
                      value={Math.min(Math.max(objective.achievement, 0), 100)}
                      fillColor={tone.fill}
                      trackColor={`${tone.fill}20`}
                    />
                  </div>
                  <ChevronDown className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t bg-slate-50/70 p-3 dark:bg-slate-950/30">
                  <div className="space-y-2">
                    {objective.kpis.map((kpi) => {
                      const kpiTone = performanceTone(kpi.achievement);
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
                                <p className="truncate text-sm font-semibold">
                                  {kpi.name}
                                </p>
                                <Badge variant="outline" className="text-[10px]">
                                  {kpi.weight}% KPI weight
                                </Badge>
                              </div>
                              <Progress
                                className="mt-2 h-1"
                                value={Math.min(Math.max(kpi.achievement, 0), 100)}
                                fillColor={kpiTone.fill}
                                trackColor={`${kpiTone.fill}18`}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-5 text-right lg:w-[430px]">
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
                                value={formatPercent(kpi.achievement)}
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
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`truncate text-sm font-bold tabular-nums ${className}`}>
        {value}
      </p>
      {detail && <p className="truncate text-[9px] text-muted-foreground">{detail}</p>}
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
          <div className="flex items-center gap-2">
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
          {report.readiness.planningIncomplete + report.readiness.pendingApproval}{" "}
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                        <Network className="h-3.5 w-3.5" /> Supports corporate KPI
                      </div>
                      <CardTitle className="mt-2 truncate text-sm">
                        {item.sourceKpiName}
                      </CardTitle>
                      <CardDescription className="mt-1 truncate text-xs">
                        {item.sourceObjectiveTitle}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${tone.text}`}>
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
                      Supporting KPI details continue in the full support report.
                    </p>
                  ) : (
                    item.rows.slice(0, 4).map((row) => (
                      <div
                        key={row.id}
                        className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {row.localKpiName}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {row.unitName}
                            {row.expectedImpact ? ` · ${row.expectedImpact}` : ""}
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

function DivisionBenchmarks({ report }: { report: KpiQuarterPerformanceReport }) {
  const divisions = report.rollups
    .filter((rollup) => rollup.level === "DIVISION")
    .map((rollup) => ({
      id: rollup.entityId,
      name: rollup.entityName,
      achievement: summaryAchievement(rollup),
      coverage: Number(rollup.resultCoverageRate || 0) * 100,
      kpiCount: rollup.kpiCount,
    }))
    .sort((left, right) => right.achievement - left.achievement);

  if (divisions.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="division-benchmarks-heading">
      <div>
        <h3 id="division-benchmarks-heading" className="text-lg font-semibold">
          Division benchmarks
        </h3>
        <p className="text-sm text-muted-foreground">
          Direct target-allocation KPI performance by business unit.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {divisions.map((division) => {
          const tone = performanceTone(division.achievement);
          return (
            <Card
              key={division.id}
              className="min-w-[230px] flex-1 gap-3 border-border/70 py-4"
            >
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{division.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {division.kpiCount} direct KPI{division.kpiCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <CircleGauge className="h-5 w-5" style={{ color: tone.fill }} />
                </div>
                <p className="mt-4 text-3xl font-bold tabular-nums">
                  {formatPercent(division.achievement)}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                  <span className={tone.text}>{tone.label}</span>
                  <span className="text-muted-foreground">
                    {numberFormatter.format(division.coverage)}% coverage
                  </span>
                </div>
                <Progress
                  className="mt-3 h-1.5"
                  value={Math.min(Math.max(division.achievement, 0), 100)}
                  fillColor={tone.fill}
                  trackColor={`${tone.fill}20`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-sm">Division achievement comparison</CardTitle>
          <CardDescription className="text-xs">
            Weight-normalized direct achievement; pending plans remain in the denominator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          {divisions.map((division) => {
            const tone = performanceTone(division.achievement);
            return (
              <div key={division.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium">{division.name}</span>
                  <span className={`font-semibold tabular-nums ${tone.text}`}>
                    {formatPercent(division.achievement)}
                  </span>
                </div>
                <Progress
                  className="h-2"
                  value={Math.min(Math.max(division.achievement, 0), 100)}
                  fillColor={tone.fill}
                  trackColor={`${tone.fill}18`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
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
      Number(quarter?.finalCount || 0) + Number(quarter?.provisionalCount || 0) >
      0;
    return {
      quarter: `Q${quarterNumber}`,
      actual: hasResult
        ? reportQuarterAchievement(report, quarterNumber)
        : null,
      target: 100,
    };
  });

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">Quarterly execution curve</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Direct achievement trajectory against the 100% target line.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-indigo-600" /> Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dashed border-slate-400" />
              Target
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[260px] px-2 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="directAchievementFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.26} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} opacity={0.25} />
            <XAxis dataKey="quarter" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
              fontSize={10}
              domain={[0, (max: number) => Math.max(110, Math.ceil(max / 10) * 10)]}
            />
            <Tooltip
              formatter={(value) =>
                value == null ? "Pending" : formatPercent(Number(value))
              }
              contentStyle={{
                borderRadius: 12,
                borderColor: "hsl(var(--border))",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#94a3b8"
              strokeDasharray="5 5"
              dot={false}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#4f46e5"
              strokeWidth={3}
              fill="url(#directAchievementFill)"
              connectNulls={false}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function ExecutivePerformanceDashboard({
  primaryReport,
  hierarchyReport,
  supportReport,
  selectedQuarter,
  scopeLabel,
}: ExecutivePerformanceDashboardProps) {
  const directAchievement = summaryAchievement(primaryReport.summary);
  const coverage = Number(primaryReport.summary.resultCoverageRate || 0) * 100;
  const objectives = new Set(
    primaryReport.kpiRollups.flatMap((item) =>
      item.objectiveId ? [item.objectiveId] : [],
    ),
  );
  const readiness = supportReport?.readiness;

  return (
    <section className="space-y-7" aria-labelledby="performance-command-center">
      <DashboardHeader
        periodName={primaryReport.annualStrategicPeriodName}
        selectedQuarter={selectedQuarter}
        scopeLabel={scopeLabel}
      />

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Executive pulse
            </p>
            <h3 id="performance-command-center" className="mt-1 text-lg font-semibold">
              Verified performance at a glance
            </h3>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
            Approved logbooks only
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <PulseCard
            eyebrow="Direct achievement"
            value={formatPercent(directAchievement)}
            detail={`${numberFormatter.format(primaryReport.summary.achievedContributionWeight)} of ${numberFormatter.format(primaryReport.summary.plannedContributionWeight)} planned score weight`}
            icon={<TrendingUp className="h-4 w-4" />}
            progress={directAchievement}
            accent={performanceTone(directAchievement).fill}
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

      <CorporateScorecards report={primaryReport} />
      <SupportImpactSection report={supportReport} selectedQuarter={selectedQuarter} />
      <DivisionBenchmarks report={hierarchyReport} />
      <QuarterExecutionCurve report={primaryReport} />

      <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Direct and support results are intentionally reported as separate performance streams.
        </span>
        <Link href="/dashboard/reports" className="font-medium text-primary hover:underline">
          Audit the numbers
        </Link>
      </div>
    </section>
  );
}
