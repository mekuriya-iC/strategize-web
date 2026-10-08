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
  Sparkles,
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
  performanceTrafficStatus,
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
    <div className={`mt-3 grid max-w-md grid-cols-4 gap-2 ${className}`}>
      {values.map((value, index) => {
        const quarterNumber = index + 1;
        const tone = value == null ? null : performanceTone(value);
        const isSelected = quarterNumber === selectedQuarter;
        return (
          <div
            key={quarterNumber}
            className={`rounded-xl border px-2.5 py-1.5 text-center transition-all ${
              isSelected
                ? "border-indigo-500/60 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500/30 dark:border-indigo-400/60 dark:bg-indigo-950/40"
                : "border-slate-200/70 bg-white/70 dark:border-white/[0.06] dark:bg-zinc-900/50"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Q{quarterNumber}
            </p>
            <p
              className={`text-xs font-bold tabular-nums ${tone?.text ?? "text-slate-400 dark:text-zinc-500"}`}
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
  const status = performanceTrafficStatus(value);
  if (status === "NO_DATA") {
    return {
      label: "Awaiting data",
      text: "text-slate-600 dark:text-slate-300",
      surface: "bg-slate-100 dark:bg-zinc-800",
      border: "border-slate-200 dark:border-zinc-700",
      fill: "#94a3b8",
    };
  }
  if (status === "GREEN") {
    return {
      label: "On track",
      text: "text-emerald-700 dark:text-emerald-300",
      surface: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800/60",
      fill: "#10b981",
    };
  }
  if (status === "AMBER") {
    return {
      label: "Watch",
      text: "text-amber-700 dark:text-amber-300",
      surface: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800/60",
      fill: "#f59e0b",
    };
  }
  return {
    label: "Needs attention",
    text: "text-rose-700 dark:text-rose-300",
    surface: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/60",
    fill: "#f43f5e",
  };
}

function PulseCard({
  eyebrow,
  value,
  detail,
  icon,
  progress,
  accent = "#4f46e5",
}: {
  eyebrow: string;
  value: string;
  detail: string;
  icon: ReactNode;
  progress?: number;
  accent?: string;
}) {
  return (
    <Card className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/60 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/60">
      {/* Top accent glow line */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] opacity-80 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${accent}, #8b5cf6)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {eyebrow}
          </p>
          <p className="mt-2 break-words text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-zinc-100">
            {value}
          </p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${accent}15`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <p className="min-h-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
          {detail}
        </p>
        {progress != null && (
          <Progress
            className="mt-3 h-1.5 rounded-full"
            value={Math.min(Math.max(progress, 0), 100)}
            fillColor={accent}
            trackColor={`${accent}18`}
          />
        )}
      </div>
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
    <div className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/70 p-6 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-violet-950/30 sm:p-8">
      {/* Decorative ambient background mesh */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/20 blur-3xl dark:from-indigo-500/20 dark:to-violet-500/25" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge className="flex items-center gap-1.5 border-0 bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-700 backdrop-blur-sm dark:bg-indigo-400/10 dark:text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
              </span>
              Live performance
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-slate-300/80 bg-white/70 px-3 py-0.5 text-xs font-medium text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-800/70 dark:text-zinc-300"
            >
              {periodName}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-indigo-300/80 bg-indigo-50/70 px-3 py-0.5 text-xs font-semibold text-indigo-700 backdrop-blur-sm dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-300"
            >
              {selectedQuarter ? `Q${selectedQuarter}` : "Annual / YTD"}
            </Badge>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
            Performance dashboard
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-base">
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              {scopeLabel}
            </span>{" "}
            · Quarterly results, organizational performance, and contribution detail.
          </p>
        </div>

        <Button
          asChild
          className="group shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-500/20 dark:bg-white dark:text-slate-900 dark:hover:bg-indigo-100 lg:self-center"
        >
          <Link href="/dashboard/reports" className="flex items-center gap-2">
            <span>Open detailed reports</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
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
  const includesSupportKpis = report.kpiRollups.some(
    (item) => item.cascadeType === "SUPPORT",
  );

  return (
    <section
      className="space-y-4"
      aria-labelledby="corporate-scorecards-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3
            id="corporate-scorecards-heading"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100"
          >
            {report.scope === "ORGANIZATION"
              ? "Corporate scorecards"
              : includesSupportKpis
                ? "Owned scorecards"
                : "Direct scorecards"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
            {includesSupportKpis
              ? "Weighted results from approved target-allocation and local support KPIs."
              : "Weighted results from the approved target-allocation chain."}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full px-3 py-1 font-semibold"
        >
          {objectives.length} objective{objectives.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {objectives.length === 0 ? (
        <Card className="rounded-2xl border-dashed py-10 text-center">
          <CardContent className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            No KPI results are available for this period.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3.5">
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
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-200 hover:border-slate-300 dark:border-white/[0.08] dark:bg-zinc-900/90"
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 transition-colors hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-zinc-800/40 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                  <div className="grid min-w-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-x-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {objective.weight != null && (
                        <Badge
                          variant="outline"
                          className="rounded-full font-semibold"
                        >
                          {objective.weight}% weight
                        </Badge>
                      )}
                      <Badge
                        className={`rounded-full ${tone.surface} ${tone.text} border-0 font-semibold`}
                      >
                        {hasResult
                          ? `${formatPercent(objective.achievement)} `
                          : ""}
                        {objective.kpis.every((kpi) => kpi.isNotDue)
                          ? "Not due this quarter"
                          : tone.label}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="rounded-full font-medium"
                      >
                        Direct
                      </Badge>
                    </div>
                    <h4 className="mt-2 break-words text-base font-bold text-slate-900 dark:text-zinc-100 lg:col-start-1">
                      {objective.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 lg:col-start-1">
                      {objective.kpis.length} corporate KPI
                      {objective.kpis.length === 1 ? "" : "s"} · achieved score
                      weight {numberFormatter.format(objective.achievedWeight)}{" "}
                      of {numberFormatter.format(objective.plannedWeight)}
                    </p>
                    <Progress
                      className="mt-3 h-1.5 rounded-full lg:col-start-1"
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
                  <ChevronDown className="mt-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="border-t border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40 sm:p-5">
                  <div className="space-y-2.5">
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
                          className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/[0.06] dark:bg-zinc-900/90"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shadow-xs"
                                  style={{ backgroundColor: kpiTone.fill }}
                                />
                                <p className="break-words text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                  {kpi.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="rounded-full text-[10px] font-semibold"
                                >
                                  {kpi.weight}% KPI weight
                                </Badge>
                              </div>
                              <Progress
                                className="mt-2.5 h-1.5 rounded-full"
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
                            <div className="grid min-w-0 grid-cols-3 gap-2 rounded-xl bg-slate-50/90 p-3 text-left dark:bg-zinc-800/50 sm:gap-4 lg:w-[400px] lg:text-right">
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
                                value={
                                  kpi.isNotDue
                                    ? "—"
                                    : formatMetricValue(
                                        kpi.actual,
                                        kpi.measurementUnit,
                                        kpi.customUnitLabel,
                                      )
                                }
                              />
                              <MetricValue
                                label="Achievement"
                                value={
                                  kpi.resultCount > 0
                                    ? formatPercent(kpi.achievement)
                                    : kpi.isNotDue
                                      ? "Not due"
                                      : "Pending"
                                }
                                className={kpiTone.text}
                                detail={
                                  kpi.isNotDue
                                    ? "Excluded from results"
                                    : `${numberFormatter.format(kpi.resultCoverage)}% data coverage`
                                }
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-0.5 break-words text-sm font-bold tabular-nums text-slate-900 dark:text-zinc-100 ${className}`}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-zinc-400">
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
    <section className="space-y-4" aria-labelledby="support-impact-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="support-impact-heading"
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100"
            >
              Support achievement
            </h3>
            <Badge className="rounded-full border-0 bg-violet-100 px-3 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              Separate impact signal
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
            Weighted attainment of local support KPIs. These percentages do not
            increase corporate achievement.
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          {report.readiness.ready} ready · {report.readiness.noLocalKpi} without
          local KPIs ·{" "}
          {report.readiness.planningIncomplete +
            report.readiness.pendingApproval}{" "}
          pending
        </p>
      </div>

      {support.length === 0 ? (
        <Card className="rounded-2xl border-dashed py-10 text-center">
          <CardContent className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            No support KPI results are available in this scope.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {support.map((item) => {
            const tone = performanceTone(item.achievement);
            return (
              <Card
                key={item.sourceKpiId}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      <Network className="h-3.5 w-3.5" /> Supports corporate KPI
                    </div>
                    <h4 className="mt-1.5 break-words text-base font-bold text-slate-900 dark:text-zinc-100">
                      {item.sourceKpiName}
                    </h4>
                    <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-zinc-400">
                      {item.sourceObjectiveTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-extrabold tabular-nums ${tone.text}`}
                    >
                      {formatPercent(item.achievement)}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      support attainment
                    </p>
                  </div>
                </div>
                <Progress
                  className="mt-4 h-1.5 rounded-full"
                  value={Math.min(Math.max(item.achievement, 0), 100)}
                  fillColor="#7c3aed"
                  trackColor="#7c3aed20"
                />
                <div className="mt-4 space-y-2">
                  {item.rows.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                      Supporting KPI details continue in the full support report.
                    </p>
                  ) : (
                    item.rows.slice(0, 4).map((row) => (
                      <div
                        key={row.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            {row.localKpiName}
                          </p>
                          <p className="break-words text-xs text-slate-500 dark:text-zinc-400">
                            {row.unitName}
                            {row.expectedImpact
                              ? ` · ${row.expectedImpact}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-slate-800 dark:text-zinc-200">
                          {row.achievement == null
                            ? "Pending"
                            : formatPercent(row.achievement)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

const CustomGraphDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || payload?.actual == null) return null; // Don't show dot if no data
  
  const isSelected = payload?.isCurrent;
  const isRealData = payload?.isRealData;
  
  return (
    <g key={`dot-${payload?.step || cx}`}>
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={12}
          fill="#5b5bf7"
          fillOpacity={0.25}
          className="animate-pulse"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 7 : isRealData ? 6 : 4.5}
        fill={isRealData ? "#10b981" : "#5b5bf7"}
        stroke="#ffffff"
        strokeWidth={2.5}
        opacity={isRealData ? 1 : 0.6}
      />
      {isRealData && (
        <circle
          cx={cx}
          cy={cy}
          r={9}
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          opacity={0.4}
        />
      )}
    </g>
  );
};

const CustomFloatingTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const dataItem = payload[0]?.payload;
  const val = dataItem?.actual;
  const subtitle = dataItem?.name || dataItem?.details || "Execution Progress";

  return (
    <div className="relative -top-3 z-50 flex flex-col items-center pointer-events-none transition-all duration-150">
      <div className="rounded-2xl bg-[#5b5bf7] px-4 py-2.5 text-center text-white shadow-xl min-w-[130px]">
        <p className="text-base font-extrabold tracking-tight tabular-nums">
          {val != null ? formatPercent(val) : "0%"}
        </p>
        <p className="text-[10px] font-medium opacity-90">{subtitle}</p>
      </div>
      {/* Downward Arrow Pointer */}
      <div className="h-0 w-0 border-x-6 border-t-6 border-x-transparent border-t-[#5b5bf7]" />
    </div>
  );
};

function QuarterExecutionCurve({
  report,
  selectedQuarter,
}: {
  report: KpiQuarterPerformanceReport;
  selectedQuarter?: number;
}) {
  // Get REAL quarterly achievement data
  const q1Actual = reportQuarterAchievement(report, 1);
  const q2Actual = reportQuarterAchievement(report, 2);
  const q3Actual = reportQuarterAchievement(report, 3);
  const q4Actual = reportQuarterAchievement(report, 4);

  const q1Summary = report.quarterSummaries?.find((q) => q.quarterNumber === 1);
  const q2Summary = report.quarterSummaries?.find((q) => q.quarterNumber === 2);
  const q3Summary = report.quarterSummaries?.find((q) => q.quarterNumber === 3);
  const q4Summary = report.quarterSummaries?.find((q) => q.quarterNumber === 4);

  // Check if quarters have REAL data (not just plans)
  const hasQ1 = Number(q1Summary?.finalCount || 0) + Number(q1Summary?.provisionalCount || 0) > 0;
  const hasQ2 = Number(q2Summary?.finalCount || 0) + Number(q2Summary?.provisionalCount || 0) > 0;
  const hasQ3 = Number(q3Summary?.finalCount || 0) + Number(q3Summary?.provisionalCount || 0) > 0;
  const hasQ4 = Number(q4Summary?.finalCount || 0) + Number(q4Summary?.provisionalCount || 0) > 0;

  // Collect only quarters with actual data
  const realQuarters: Array<{ quarter: number; achievement: number; summary: any }> = [];
  if (hasQ1) realQuarters.push({ quarter: 1, achievement: q1Actual, summary: q1Summary });
  if (hasQ2) realQuarters.push({ quarter: 2, achievement: q2Actual, summary: q2Summary });
  if (hasQ3) realQuarters.push({ quarter: 3, achievement: q3Actual, summary: q3Summary });
  if (hasQ4) realQuarters.push({ quarter: 4, achievement: q4Actual, summary: q4Summary });

  // Build graph points - Show ALL quarters on X-axis, but only connect data where it exists
  const graphPoints: Array<{
    step: string;
    name: string;
    actual: number | null;
    details: string;
    isCurrent: boolean;
    isRealData: boolean;
  }> = [];

  // Always show all 4 quarters on X-axis with equal spacing
  [1, 2, 3, 4].forEach((quarterNum) => {
    const hasData = realQuarters.find(q => q.quarter === quarterNum);
    
    if (hasData) {
      // Quarter with REAL DATA - show the curve point
      graphPoints.push({
        step: `Q${quarterNum}`,
        name: `Q${quarterNum} Result`,
        actual: hasData.achievement,
        details: `${hasData.summary?.finalCount || 0} final, ${hasData.summary?.provisionalCount || 0} live`,
        isCurrent: selectedQuarter === quarterNum,
        isRealData: true,
      });
    } else {
      // Quarter WITHOUT data - show placeholder on X-axis but no curve point
      graphPoints.push({
        step: `Q${quarterNum}`,
        name: `Q${quarterNum} Awaiting`,
        actual: null, // null = no line drawn to this point
        details: "Awaiting data",
        isCurrent: selectedQuarter === quarterNum,
        isRealData: false,
      });
    }
  });

  // Calculate movement between consecutive quarters
  let delta: number | null = null;
  let deltaLabel = "";
  
  if (realQuarters.length >= 2) {
    const lastTwo = realQuarters.slice(-2);
    delta = lastTwo[1].achievement - lastTwo[0].achievement;
    deltaLabel = `Q${lastTwo[0].quarter}→Q${lastTwo[1].quarter}`;
  }

  const isIncrease = delta != null && delta > 0;
  const isDecrease = delta != null && delta < 0;

  // Find latest quarter with data
  const latestQuarter = realQuarters.length > 0 ? realQuarters[realQuarters.length - 1].quarter : null;
  const latestResult = realQuarters.length > 0 ? realQuarters[realQuarters.length - 1].achievement : 0;

  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-8">
      {/* Header matching reference mockup */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-xl">
            Quarterly execution curve
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            {realQuarters.length === 0 
              ? "Awaiting first logbook entries to begin tracking"
              : realQuarters.length === 4
                ? "Complete annual tracking - all 4 quarters achieved"
                : `Tracking ${realQuarters.length} of 4 quarters · Curve continues as Q${realQuarters.length + 1}${realQuarters.length < 3 ? `, Q${realQuarters.length + 2}` : ''}${realQuarters.length < 2 ? `, Q${realQuarters.length + 3}` : ''} data becomes available`
            }
          </p>
        </div>

        {/* Milestone Quick Summary Chips - Only show quarters with data */}
        <div className="flex flex-wrap items-center gap-2.5">
          {realQuarters.map((qData) => {
            const colorSchemes: Record<number, { border: string; bg: string; textLabel: string; textValue: string; borderDark: string; bgDark: string }> = {
              1: { border: "border-slate-200/70", bg: "bg-slate-50/70", textLabel: "text-slate-500 dark:text-zinc-400", textValue: "text-slate-900 dark:text-zinc-100", borderDark: "dark:border-zinc-800", bgDark: "dark:bg-zinc-800/60" },
              2: { border: "border-emerald-200/70", bg: "bg-emerald-50/70", textLabel: "text-emerald-700 dark:text-emerald-300", textValue: "text-emerald-950 dark:text-emerald-200", borderDark: "dark:border-emerald-900/50", bgDark: "dark:bg-emerald-950/40" },
              3: { border: "border-blue-200/70", bg: "bg-blue-50/70", textLabel: "text-blue-700 dark:text-blue-300", textValue: "text-blue-950 dark:text-blue-200", borderDark: "dark:border-blue-900/50", bgDark: "dark:bg-blue-950/40" },
              4: { border: "border-indigo-200/70", bg: "bg-indigo-50/70", textLabel: "text-indigo-700 dark:text-indigo-300", textValue: "text-indigo-950 dark:text-indigo-200", borderDark: "dark:border-indigo-900/50", bgDark: "dark:bg-indigo-950/40" },
            };
            const colors = colorSchemes[qData.quarter] || colorSchemes[1];

            return (
              <div key={qData.quarter} className={`flex items-center gap-2 rounded-xl border ${colors.border} ${colors.borderDark} ${colors.bg} ${colors.bgDark} px-3 py-1.5 text-xs`}>
                <span className={`font-semibold ${colors.textLabel}`}>Q{qData.quarter}:</span>
                <span className={`font-bold tabular-nums ${colors.textValue}`}>
                  {formatPercent(qData.achievement)}
                </span>
              </div>
            );
          })}

          {delta != null && (
            <Badge
              className={`flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold ${
                isIncrease
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : isDecrease
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <TrendingUp className={`h-3.5 w-3.5 ${isDecrease ? 'rotate-180' : ''}`} />
              {deltaLabel}: {isIncrease ? '+' : ''}{delta.toFixed(1)}%
            </Badge>
          )}

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            <span>Performance Curve</span>
          </div>

          {realQuarters.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40" />
              </span>
              <span>{realQuarters.length} Quarter{realQuarters.length > 1 ? 's' : ''} Tracked</span>
            </div>
          )}

          {realQuarters.length === 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>No Data Yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Execution Curve Chart */}
      <div className="relative mt-2 h-[340px] w-full sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={graphPoints}
            margin={{ top: 30, right: 30, left: -10, bottom: 15 }}
          >
            <CartesianGrid
              strokeDasharray="0 0"
              vertical={false}
              stroke="#f1f5f9"
              className="dark:stroke-zinc-800"
            />
            <XAxis
              dataKey="step"
              tickLine={{ stroke: "#94a3b8", strokeWidth: 1.5 }}
              axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              fontSize={12}
              fontWeight={700}
              tick={(props) => {
                const { x, y, payload } = props;
                const hasData = graphPoints.find(p => p.step === payload.value && p.actual != null);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={16}
                      textAnchor="middle"
                      fill={hasData ? "#64748b" : "#cbd5e1"}
                      fontSize={12}
                      fontWeight={hasData ? 700 : 600}
                    >
                      {payload.value}
                    </text>
                    {!hasData && payload.value && (
                      <text
                        x={0}
                        y={0}
                        dy={32}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={9}
                        fontWeight={500}
                      >
                        awaiting
                      </text>
                    )}
                  </g>
                );
              }}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              fontWeight={600}
              tick={{ fill: "#94a3b8" }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={<CustomFloatingTooltip />}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            {realQuarters.length > 0 && (
              <ReferenceLine
                y={100}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: "100% Target", position: "right", fill: "#94a3b8", fontSize: 11 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="actual"
              name="Achievement"
              stroke="#f59e0b"
              strokeWidth={3}
              fill="url(#executionGradient)"
              fillOpacity={0.1}
              dot={<CustomGraphDot />}
              activeDot={{ r: 8, fill: "#5b5bf7", stroke: "#ffffff", strokeWidth: 3 }}
              isAnimationActive={true}
              connectNulls={false} // Stop line at last real data point, don't connect to null values
            />
            <defs>
              <linearGradient id="executionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
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
  const allNotDue =
    primaryReport.summary.rowCount > 0 &&
    primaryReport.summary.notDueCount === primaryReport.summary.rowCount;
  const objectives = new Set(
    primaryReport.kpiRollups.flatMap((item) =>
      item.objectiveId ? [item.objectiveId] : [],
    ),
  );
  const readiness = supportReport?.readiness;
  const includesSupportKpis = primaryReport.kpiRollups.some(
    (item) => item.cascadeType === "SUPPORT",
  );
  const ownershipLabel = includesSupportKpis ? "Owned" : "Direct";

  return (
    <section
      className="min-w-0 space-y-6 text-foreground"
      aria-labelledby="performance-command-center"
    >
      <DashboardHeader
        periodName={primaryReport.annualStrategicPeriodName}
        selectedQuarter={selectedQuarter}
        scopeLabel={scopeLabel}
      />

      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Executive pulse
            </p>
            <h3
              id="performance-command-center"
              className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100"
            >
              Performance at a glance
            </h3>
          </div>
          <Badge
            variant="outline"
            className="hidden rounded-full border-emerald-300/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Approved logbooks only
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5 [&>div:first-child]:col-span-2 md:[&>div:first-child]:col-span-1">
          <PulseCard
            eyebrow={`${ownershipLabel} achievement`}
            value={
              hasDirectResult
                ? formatPercent(directAchievement)
                : allNotDue
                  ? "Not due"
                  : "Pending"
            }
            detail={`${numberFormatter.format(primaryReport.summary.achievedContributionWeight)} of ${numberFormatter.format(primaryReport.summary.plannedContributionWeight)} planned weight`}
            icon={<TrendingUp className="h-5 w-5" />}
            progress={directAchievement}
            accent={
              performanceTone(hasDirectResult ? directAchievement : null).fill
            }
          />
          <PulseCard
            eyebrow="Strategic goals"
            value={`${objectives.size}`}
            detail={`Objectives represented by ${ownershipLabel.toLowerCase()} KPIs`}
            icon={<Target className="h-5 w-5" />}
            accent="#8b5cf6"
          />
          <PulseCard
            eyebrow={`${ownershipLabel} KPIs`}
            value={`${primaryReport.summary.kpiCount}`}
            detail={`${primaryReport.summary.finalCount} final · ${primaryReport.summary.provisionalCount} live`}
            icon={<BarChart3 className="h-5 w-5" />}
            accent="#3b82f6"
          />
          <PulseCard
            eyebrow="Result coverage"
            value={formatPercent(coverage)}
            detail={`${primaryReport.summary.pendingResultCount} pending${primaryReport.summary.notDueCount ? ` · ${primaryReport.summary.notDueCount} not due` : ""}`}
            icon={<Activity className="h-5 w-5" />}
            progress={coverage}
            accent="#06b6d4"
          />
          <PulseCard
            eyebrow="Support network"
            value={`${readiness?.totalAssignments ?? 0}`}
            detail={`${readiness?.ready ?? 0} ready · ${readiness?.noLocalKpi ?? 0} need KPIs`}
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="#10b981"
          />
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/80"
      >
        <div className="border-b border-slate-200/80 bg-slate-50/70 p-2 dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-3">
          <TabsList
            aria-label="Performance sections"
            className="flex w-full flex-wrap gap-1 bg-transparent p-0"
          >
            <TabsTrigger
              value="overview"
              className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
            >
              <Activity className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger
              value="scorecards"
              className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
            >
              <Target className="h-4 w-4" /> Scorecards
            </TabsTrigger>
            <TabsTrigger
              value="units"
              className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
            >
              <Building2 className="h-4 w-4" />
              <span className="sm:hidden">Units</span>
              <span className="hidden sm:inline">Divisions & departments</span>
            </TabsTrigger>
            <TabsTrigger
              value="contributors"
              className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
            >
              <Network className="h-4 w-4" /> Contributors
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-indigo-400 sm:text-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Support
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="min-w-0 space-y-6 p-4 sm:p-6">
          {selectedQuarter && (
            <QuarterStrip
              report={primaryReport}
              selectedQuarter={selectedQuarter}
              selectedQuarterPeriod={selectedQuarterPeriod}
            />
          )}
          <div className="border-t border-slate-100 pt-6 dark:border-zinc-800">
            <QuarterExecutionCurve report={primaryReport} />
          </div>
        </TabsContent>

        <TabsContent value="scorecards" className="min-w-0 p-4 sm:p-6">
          <CorporateScorecards
            report={primaryReport}
            selectedQuarter={selectedQuarter}
          />
        </TabsContent>

        <TabsContent value="units" className="min-w-0 p-4 sm:p-6">
          {selectedQuarter ? (
            <OrganizationAchievement
              report={hierarchyReport}
              selectedQuarter={selectedQuarter}
              selectedQuarterPeriod={selectedQuarterPeriod}
            />
          ) : (
            <p className="p-4 text-sm font-medium text-slate-500 dark:text-zinc-400">
              Select a quarter to explore division and department achievement.
            </p>
          )}
        </TabsContent>

        <TabsContent value="contributors" className="min-w-0 p-4 sm:p-6">
          {selectedQuarter ? (
            <CorporateContributors
              primaryReport={primaryReport}
              hierarchyReport={hierarchyReport}
              selectedQuarter={selectedQuarter}
            />
          ) : (
            <p className="p-4 text-sm font-medium text-slate-500 dark:text-zinc-400">
              Select a quarter to explore KPI contributors.
            </p>
          )}
        </TabsContent>

        <TabsContent value="support" className="min-w-0 p-4 sm:p-6">
          {supportReport ? (
            <SupportImpactSection
              report={supportReport}
              selectedQuarter={selectedQuarter}
            />
          ) : (
            <p className="p-4 text-sm font-medium text-slate-500 dark:text-zinc-400">
              Support performance is not available for this selection.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-3.5 text-xs text-slate-600 dark:border-white/[0.08] dark:bg-zinc-900/60 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 font-medium">
          <Building2 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          {includesSupportKpis
            ? "Your unit score includes the support KPIs it owns; the Support tab keeps their corporate impact separately auditable."
            : "Direct and support results are intentionally reported as separate performance streams."}
        </span>
        <Link
          href="/dashboard/reports"
          className="shrink-0 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
        >
          Audit the numbers →
        </Link>
      </div>
    </section>
  );
}
