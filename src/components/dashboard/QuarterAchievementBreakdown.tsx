"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Minus,
  Network,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  calculateDashboardPace,
  performanceTrafficStatus,
  quarterProgressRate,
  summaryAchievement,
  type PerformanceTrafficStatus,
} from "@/lib/dashboard/performanceDashboard";
import type {
  KpiQuarterPerformanceReport,
  KpiQuarterReportEntityKpiRollup,
  KpiQuarterReportEntityQuarterRollup,
  KpiQuarterReportKpiQuarterRollup,
  ScorecardLevel,
  StrategicPeriod,
} from "@/types/graphql";

interface QuarterAchievementBreakdownProps {
  primaryReport: KpiQuarterPerformanceReport;
  hierarchyReport: KpiQuarterPerformanceReport;
  selectedQuarter: number;
  selectedQuarterPeriod?: StrategicPeriod;
}

const formatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const trafficStyles: Record<
  PerformanceTrafficStatus,
  { label: string; text: string; surface: string; border: string; fill: string }
> = {
  GREEN: {
    label: "On track",
    text: "text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/50",
    fill: "#10b981",
  },
  AMBER: {
    label: "Watch",
    text: "text-amber-700 dark:text-amber-300",
    surface: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800/50",
    fill: "#f59e0b",
  },
  RED: {
    label: "Needs attention",
    text: "text-rose-700 dark:text-rose-300",
    surface: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/50",
    fill: "#f43f5e",
  },
  NO_DATA: {
    label: "Awaiting data",
    text: "text-slate-600 dark:text-slate-300",
    surface: "bg-slate-100 dark:bg-zinc-800",
    border: "border-slate-200 dark:border-zinc-700",
    fill: "#94a3b8",
  },
};

function percent(value: number) {
  return `${formatter.format(Number.isFinite(value) ? value : 0)}%`;
}

function TrafficBadge({ status }: { status: PerformanceTrafficStatus }) {
  const tone = trafficStyles[status];
  return (
    <Badge
      className={`rounded-full ${tone.surface} ${tone.text} border-0 px-2.5 py-0.5 text-xs font-semibold shadow-2xs`}
    >
      {tone.label}
    </Badge>
  );
}

function Trend({
  delta,
  label = "vs previous quarter",
}: {
  delta?: number;
  label?: string;
}) {
  if (delta == null || !Number.isFinite(delta)) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-slate-400 dark:text-zinc-500">
        <Minus className="h-3.5 w-3.5" /> No prior quarter
      </span>
    );
  }
  const Icon =
    delta > 0.05 ? ArrowUpRight : delta < -0.05 ? ArrowDownRight : ArrowRight;
  const isPositive = delta > 0.05;
  const isNegative = delta < -0.05;
  const color = isPositive
    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
    : isNegative
      ? "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900"
      : "text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700";
  const sign = delta > 0 ? "+" : "";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${color}`}
    >
      <Icon className="h-3.5 w-3.5" /> {sign}
      {formatter.format(delta)}pp {label}
    </span>
  );
}

function rollupAchievement(
  rollup: KpiQuarterReportEntityQuarterRollup | undefined,
): number | null {
  if (!rollup || rollup.finalCount + rollup.provisionalCount === 0) return null;
  return summaryAchievement(rollup);
}

function quarterRollupAchievement(
  rollups: KpiQuarterReportKpiQuarterRollup[],
): number | null {
  if (rollups.reduce((sum, row) => sum + row.resultCount, 0) === 0) return null;
  const pace = calculateDashboardPace(rollups, 1);
  return pace.achievement;
}

export function QuarterStrip({
  report,
  selectedQuarter,
  selectedQuarterPeriod,
}: {
  report: KpiQuarterPerformanceReport;
  selectedQuarter: number;
  selectedQuarterPeriod?: StrategicPeriod;
}) {
  const allKpiQuarters = report.kpiQuarterRollups ?? [];
  const activeProgress = quarterProgressRate(selectedQuarterPeriod);

  return (
    <section aria-labelledby="quarter-strip-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3
            id="quarter-strip-heading"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100"
          >
            Quarter achievement
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
            Approved target-allocation results. Trends use percentage-point change.
            “—” means no calculated result yet; not-due quarters are excluded from expected results.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Below 75%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 75–90%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Above 90%
            </span>
          </div>
        </div>
        {selectedQuarterPeriod && (
          <Badge
            variant="outline"
            className="rounded-full border-indigo-200 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            Q{selectedQuarter} time elapsed: {percent(activeProgress * 100)}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((quarterNumber) => {
          const kpis = allKpiQuarters.filter(
            (item) => item.quarterNumber === quarterNumber,
          );
          const achievement = quarterRollupAchievement(kpis);
          const previous = quarterRollupAchievement(
            allKpiQuarters.filter(
              (item) => item.quarterNumber === quarterNumber - 1,
            ),
          );
          const pace = calculateDashboardPace(
            kpis,
            quarterNumber === selectedQuarter ? activeProgress : 1,
          );
          const status =
            achievement == null
              ? "NO_DATA"
              : quarterNumber === selectedQuarter
                ? pace.status
                : performanceTrafficStatus(achievement);
          const tone = trafficStyles[status];
          const summary = report.quarterSummaries.find(
            (item) => item.quarterNumber === quarterNumber,
          );
          const coverage = Number(summary?.resultCoverageRate ?? 0) * 100;
          const isNotDue = Boolean(
            summary &&
              summary.rowCount > 0 &&
              summary.notDueCount === summary.rowCount,
          );
          const isSelected = quarterNumber === selectedQuarter;

          return (
            <Card
              key={quarterNumber}
              className={`group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-sm transition-all duration-300 ${
                isSelected
                  ? "border-indigo-500/50 bg-gradient-to-b from-indigo-50/80 via-white to-indigo-50/30 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-400/50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-indigo-950/20"
                  : "border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-md dark:border-white/[0.08] dark:bg-zinc-900/90"
              }`}
            >
              {/* Top Accent Stripe */}
              <div
                className={`absolute inset-x-0 top-0 h-[3px] transition-opacity ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 opacity-100"
                    : "bg-slate-200 dark:bg-zinc-800 opacity-60 group-hover:opacity-100"
                }`}
              />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Q{quarterNumber}
                    </span>
                    {isSelected && (
                      <Badge className="rounded-full border-0 bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-indigo-500">
                        Selected
                      </Badge>
                    )}
                  </div>
                  {isNotDue ? (
                    <Badge variant="secondary" className="rounded-full text-xs font-semibold">
                      Not due
                    </Badge>
                  ) : (
                    <TrafficBadge status={status} />
                  )}
                </div>

                <div className="mt-4">
                  <p
                    className={`text-3xl font-extrabold tracking-tight tabular-nums ${tone.text} sm:text-4xl`}
                  >
                    {achievement == null ? "—" : percent(achievement)}
                  </p>
                </div>

                <div className="mt-2.5">
                  {achievement == null ? (
                    <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                      Trend available after results
                    </span>
                  ) : (
                    <Trend
                      delta={
                        achievement != null && previous != null
                          ? achievement - previous
                          : undefined
                      }
                    />
                  )}
                </div>
              </div>

              <div className="mt-5">
                <Progress
                  className="h-2 rounded-full"
                  value={
                    achievement == null
                      ? 0
                      : Math.min(Math.max(achievement, 0), 100)
                  }
                  fillColor={tone.fill}
                  trackColor={`${tone.fill}20`}
                />
                <p className="mt-2.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {percent(coverage)}
                  </span>{" "}
                  coverage · {summary?.pendingResultCount ?? 0} pending
                  {Boolean(summary?.notDueCount) &&
                    ` · ${summary?.notDueCount} not due`}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function UnitQuarterCells({
  level,
  entityId,
  report,
}: {
  level: ScorecardLevel;
  entityId: string;
  report: KpiQuarterPerformanceReport;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[1, 2, 3, 4].map((quarterNumber) => {
        const rollup = (report.entityQuarterRollups ?? []).find(
          (item) =>
            item.level === level &&
            item.entityId === entityId &&
            item.quarterNumber === quarterNumber,
        );
        const achievement = rollupAchievement(rollup);
        const status = performanceTrafficStatus(achievement);
        const tone = trafficStyles[status];
        return (
          <div
            key={quarterNumber}
            className={`rounded-xl border px-2 py-1 text-center transition-all ${tone.surface} ${tone.border || "border-transparent"}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Q{quarterNumber}
            </p>
            <p className={`text-xs font-bold tabular-nums ${tone.text}`}>
              {achievement == null ? "—" : percent(achievement)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function UnitRow({
  level,
  entityId,
  entityName,
  report,
  selectedQuarter,
  progress,
  directToCeo = false,
  nested = false,
}: {
  level: ScorecardLevel;
  entityId: string;
  entityName: string;
  report: KpiQuarterPerformanceReport;
  selectedQuarter: number;
  progress: number;
  directToCeo?: boolean;
  nested?: boolean;
}) {
  const currentKpis = (report.entityKpiRollups ?? []).filter(
    (item) =>
      item.level === level &&
      item.entityId === entityId &&
      item.quarterNumber === selectedQuarter,
  );
  const pace = calculateDashboardPace(currentKpis, progress);
  const currentRollup = (report.entityQuarterRollups ?? []).find(
    (item) =>
      item.level === level &&
      item.entityId === entityId &&
      item.quarterNumber === selectedQuarter,
  );
  const previousRollup = (report.entityQuarterRollups ?? []).find(
    (item) =>
      item.level === level &&
      item.entityId === entityId &&
      item.quarterNumber === selectedQuarter - 1,
  );
  const achievement = rollupAchievement(currentRollup);
  const previous = rollupAchievement(previousRollup);
  const status = achievement == null ? "NO_DATA" : pace.status;
  const tone = trafficStyles[status];

  return (
    <div
      className={`grid min-w-0 gap-3.5 rounded-2xl border px-4 py-3.5 shadow-2xs transition-all sm:grid-cols-2 sm:px-5 2xl:grid-cols-[minmax(200px,1fr)_140px_160px_240px] 2xl:items-center ${
        nested
          ? "ml-3 border-l-3 border-l-indigo-500 bg-slate-50/60 dark:border-l-indigo-400 dark:bg-zinc-800/40 sm:ml-6"
          : "border-slate-200/80 bg-white/95 dark:border-white/[0.08] dark:bg-zinc-900/90"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-words text-sm font-bold text-slate-900 dark:text-zinc-100">
            {entityName}
          </span>
          {directToCeo && (
            <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
              Reports to CEO
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
          {currentRollup?.kpiCount ?? 0} KPI
          {currentRollup?.kpiCount === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-slate-700 dark:text-zinc-300">
            {percent(Number(currentRollup?.resultCoverageRate ?? 0) * 100)}
          </span>{" "}
          coverage
        </p>
      </div>
      <div>
        <p className={`text-2xl font-extrabold tabular-nums ${tone.text}`}>
          {achievement == null ? "—" : percent(achievement)}
        </p>
        <div className="mt-1">
          <TrafficBadge status={status} />
        </div>
      </div>
      <div>
        <Trend
          delta={
            achievement != null && previous != null
              ? achievement - previous
              : undefined
          }
        />
      </div>
      <UnitQuarterCells level={level} entityId={entityId} report={report} />
    </div>
  );
}

export function OrganizationAchievement({
  report,
  selectedQuarter,
  selectedQuarterPeriod,
}: {
  report: KpiQuarterPerformanceReport;
  selectedQuarter: number;
  selectedQuarterPeriod?: StrategicPeriod;
}) {
  const divisions = report.availableFilters.divisions;
  const departments = report.availableFilters.departments;
  const progress = quarterProgressRate(selectedQuarterPeriod);
  const directDepartments = departments.filter(
    (department) => !department.parentId,
  );

  return (
    <section
      aria-labelledby="organization-achievement-heading"
      className="space-y-4"
    >
      <div>
        <h3
          id="organization-achievement-heading"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100"
        >
          Division and department achievement
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
          Departments without a parent division are shown as top-level units reporting to the CEO.
        </p>
      </div>
      <Card className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90">
        <CardContent className="space-y-4 p-0">
          {divisions.map((division) => (
            <div key={division.id} className="space-y-2.5">
              <UnitRow
                level="DIVISION"
                entityId={division.id}
                entityName={division.name}
                report={report}
                selectedQuarter={selectedQuarter}
                progress={progress}
              />
              {departments
                .filter((department) => department.parentId === division.id)
                .map((department) => (
                  <UnitRow
                    key={department.id}
                    level="DEPARTMENT"
                    entityId={department.id}
                    entityName={department.name}
                    report={report}
                    selectedQuarter={selectedQuarter}
                    progress={progress}
                    nested
                  />
                ))}
            </div>
          ))}
          {directDepartments.map((department) => (
            <UnitRow
              key={department.id}
              level="DEPARTMENT"
              entityId={department.id}
              entityName={department.name}
              report={report}
              selectedQuarter={selectedQuarter}
              progress={progress}
              directToCeo
            />
          ))}
          {divisions.length === 0 && directDepartments.length === 0 && (
            <p className="py-10 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
              No active divisions or departments are available in this scope.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ContributorNode({
  item,
  depth,
  childrenByParent,
  impactByEntity,
  selectedQuarter,
  path,
}: {
  item: KpiQuarterReportEntityKpiRollup;
  depth: number;
  childrenByParent: Map<string, KpiQuarterReportEntityKpiRollup[]>;
  impactByEntity: Map<string, KpiQuarterReportEntityKpiRollup>;
  selectedQuarter: number;
  path: Set<string>;
}) {
  const key = `${item.kpiId}:${item.entityId}`;
  if (path.has(key)) return null;
  const nextPath = new Set(path).add(key);
  const impact = impactByEntity.get(item.entityId);
  const achievement = item.resultCount > 0 ? item.achievementRate * 100 : null;
  const status = performanceTrafficStatus(achievement);
  const tone = trafficStyles[status];
  const children = (childrenByParent.get(item.kpiId) ?? []).filter(
    (child) => child.quarterNumber === selectedQuarter,
  );

  return (
    <>
      <div
        className="grid gap-2.5 rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-2xs transition-all dark:border-white/[0.06] dark:bg-zinc-900/90 md:grid-cols-[minmax(200px,1fr)_140px_160px] md:items-center"
        style={{ marginLeft: Math.min(depth, 3) * 14 }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {item.level === "DIVISION" ? (
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Network className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
            )}
            <p className="break-words text-sm font-bold text-slate-900 dark:text-zinc-100">
              {item.entityName}
            </p>
          </div>
          <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-zinc-400">
            {item.kpiName}
            {item.level === "DEPARTMENT" && !item.divisionId
              ? " · Reports to CEO"
              : ""}
          </p>
        </div>
        <div>
          <p className={`text-sm font-extrabold tabular-nums ${tone.text}`}>
            {achievement == null
              ? item.planCount > 0 && item.notDueCount === item.planCount
                ? "Not due"
                : "Pending"
              : percent(achievement)}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            local achievement
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 md:text-right">
          {impact ? (
            <>
              <p className="font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                {formatter.format(impact.achievedContributionWeight)} /{" "}
                {formatter.format(impact.plannedContributionWeight)}
              </p>
              <p className="text-[11px]">corporate score weight</p>
            </>
          ) : (
            <p className="text-[11px] italic">Contributes via parent KPI</p>
          )}
        </div>
      </div>
      {children.map((child) => (
        <ContributorNode
          key={`${child.kpiId}:${child.entityId}`}
          item={child}
          depth={depth + 1}
          childrenByParent={childrenByParent}
          impactByEntity={impactByEntity}
          selectedQuarter={selectedQuarter}
          path={nextPath}
        />
      ))}
    </>
  );
}

export function CorporateContributors({
  primaryReport,
  hierarchyReport,
  selectedQuarter,
}: {
  primaryReport: KpiQuarterPerformanceReport;
  hierarchyReport: KpiQuarterPerformanceReport;
  selectedQuarter: number;
}) {
  const hierarchyRows = (hierarchyReport.entityKpiRollups ?? []).filter(
    (item) => item.quarterNumber === selectedQuarter,
  );
  const childrenByParent = new Map<string, KpiQuarterReportEntityKpiRollup[]>();
  for (const row of hierarchyRows) {
    if (!row.parentKpiId) continue;
    childrenByParent.set(row.parentKpiId, [
      ...(childrenByParent.get(row.parentKpiId) ?? []),
      row,
    ]);
  }

  const primaryImpacts = (primaryReport.entityKpiRollups ?? []).filter(
    (item) => item.quarterNumber === selectedQuarter,
  );

  return (
    <section
      aria-labelledby="corporate-contributors-heading"
      className="space-y-4"
    >
      <div>
        <h3
          id="corporate-contributors-heading"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100"
        >
          Corporate KPI contributors
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
          The KPI cascade is shown once. Immediate recipients carry corporate score weight; lower levels contribute through their parent KPI.
        </p>
      </div>
      <div className="space-y-3.5">
        {primaryReport.kpiRollups.map((root) => {
          const children = childrenByParent.get(root.kpiId) ?? [];
          const impactByEntity = new Map(
            primaryImpacts
              .filter((impact) => impact.kpiId === root.kpiId)
              .map((impact) => [impact.entityId, impact]),
          );
          return (
            <details
              key={root.kpiId}
              className="group/contributor overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition-all dark:border-white/[0.08] dark:bg-zinc-900/90"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-indigo-500 sm:px-5 sm:py-4.5 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="break-words text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      {root.objectiveTitle || "Corporate objective"}
                    </p>
                    <h4 className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {root.kpiName}
                    </h4>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full font-semibold"
                  >
                    {root.resultCount > 0
                      ? `${percent(root.achievementRate * 100)} achievement`
                      : "Awaiting data"}
                  </Badge>
                </div>
                <ChevronDown className="ml-auto size-4 shrink-0 text-slate-400 transition-transform duration-200 group-open/contributor:rotate-180" />
              </summary>
              <div className="space-y-2.5 border-t border-slate-100 bg-slate-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-5">
                {children.length === 0 ? (
                  <p className="rounded-xl bg-white/70 px-4 py-5 text-center text-xs font-medium text-slate-500 dark:bg-zinc-900/50 dark:text-zinc-400">
                    No target-allocation contributor results are available for Q{selectedQuarter}.
                  </p>
                ) : (
                  children.map((child) => (
                    <ContributorNode
                      key={`${child.kpiId}:${child.entityId}`}
                      item={child}
                      depth={0}
                      childrenByParent={childrenByParent}
                      impactByEntity={impactByEntity}
                      selectedQuarter={selectedQuarter}
                      path={new Set()}
                    />
                  ))
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export default function QuarterAchievementBreakdown({
  primaryReport,
  hierarchyReport,
  selectedQuarter,
  selectedQuarterPeriod,
}: QuarterAchievementBreakdownProps) {
  return (
    <div className="space-y-7">
      <QuarterStrip
        report={primaryReport}
        selectedQuarter={selectedQuarter}
        selectedQuarterPeriod={selectedQuarterPeriod}
      />
      <OrganizationAchievement
        report={hierarchyReport}
        selectedQuarter={selectedQuarter}
        selectedQuarterPeriod={selectedQuarterPeriod}
      />
      <CorporateContributors
        primaryReport={primaryReport}
        hierarchyReport={hierarchyReport}
        selectedQuarter={selectedQuarter}
      />
    </div>
  );
}

