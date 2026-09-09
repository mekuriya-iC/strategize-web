"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Minus,
  Network,
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
  { label: string; text: string; surface: string; fill: string }
> = {
  GREEN: {
    label: "On track",
    text: "text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-50 dark:bg-emerald-950/30",
    fill: "#059669",
  },
  AMBER: {
    label: "Watch",
    text: "text-amber-700 dark:text-amber-300",
    surface: "bg-amber-50 dark:bg-amber-950/30",
    fill: "#d97706",
  },
  RED: {
    label: "Needs attention",
    text: "text-red-700 dark:text-red-300",
    surface: "bg-red-50 dark:bg-red-950/30",
    fill: "#dc2626",
  },
  NO_DATA: {
    label: "Awaiting data",
    text: "text-slate-600 dark:text-slate-300",
    surface: "bg-slate-100 dark:bg-slate-900/50",
    fill: "#94a3b8",
  },
};

function percent(value: number) {
  return `${formatter.format(Number.isFinite(value) ? value : 0)}%`;
}

function TrafficBadge({ status }: { status: PerformanceTrafficStatus }) {
  const tone = trafficStyles[status];
  return (
    <Badge className={`${tone.surface} ${tone.text} border-0`}>
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
      <span className="inline-flex items-center gap-1 text-slate-500">
        <Minus className="h-3.5 w-3.5" /> No prior quarter
      </span>
    );
  }
  const Icon =
    delta > 0.05 ? ArrowUpRight : delta < -0.05 ? ArrowDownRight : ArrowRight;
  const color =
    delta > 0.05
      ? "text-emerald-600"
      : delta < -0.05
        ? "text-red-600"
        : "text-slate-500";
  const sign = delta > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
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
    <section aria-labelledby="quarter-strip-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="quarter-strip-heading" className="text-lg font-semibold">
            Quarter achievement
          </h3>
          <p className="text-sm text-muted-foreground">
            Approved target-allocation results. Trends use percentage-point
            change. “—” means no calculated result yet; a measured zero appears
            as 0%.
          </p>
        </div>
        {selectedQuarterPeriod && (
          <p className="text-xs text-muted-foreground">
            Q{selectedQuarter} time elapsed: {percent(activeProgress * 100)}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          return (
            <Card
              key={quarterNumber}
              className={`min-w-0 gap-3 rounded-xl border-primary/15 bg-gradient-to-br from-primary/[0.06] to-card py-4 shadow-none ${quarterNumber === selectedQuarter ? "border-primary/50 from-primary/[0.12] ring-1 ring-primary/20" : ""}`}
            >
              <CardContent className="px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">Q{quarterNumber}</p>
                    {quarterNumber === selectedQuarter && (
                      <Badge variant="outline">Selected</Badge>
                    )}
                  </div>
                  <TrafficBadge status={status} />
                </div>
                <p
                  className={`mt-4 text-3xl font-bold tabular-nums ${tone.text}`}
                >
                  {achievement == null ? "—" : percent(achievement)}
                </p>
                <div className="mt-2 text-xs">
                  {achievement == null ? (
                    <span className="text-muted-foreground">
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
                <Progress
                  className="mt-3 h-1.5"
                  value={
                    achievement == null
                      ? 0
                      : Math.min(Math.max(achievement, 0), 100)
                  }
                  fillColor={tone.fill}
                  trackColor={`${tone.fill}20`}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {percent(coverage)} result coverage ·{" "}
                  {summary?.pendingResultCount ?? 0} pending
                </p>
              </CardContent>
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
            className={`rounded-md px-2 py-1 text-center ${tone.surface}`}
          >
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              Q{quarterNumber}
            </p>
            <p className={`text-xs font-semibold tabular-nums ${tone.text}`}>
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
      className={`grid min-w-0 gap-3 rounded-xl border px-3 py-3 sm:grid-cols-2 sm:px-4 2xl:grid-cols-[minmax(180px,1fr)_130px_150px_230px] 2xl:items-center ${nested ? "ml-3 border-l-2 border-l-primary/25 bg-muted/25 sm:ml-6" : "bg-background"}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-words text-sm font-semibold">
            {entityName}
          </span>
          {directToCeo && <Badge variant="secondary">Reports to CEO</Badge>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {currentRollup?.kpiCount ?? 0} KPI
          {currentRollup?.kpiCount === 1 ? "" : "s"} ·{" "}
          {percent(Number(currentRollup?.resultCoverageRate ?? 0) * 100)}{" "}
          coverage
        </p>
      </div>
      <div>
        <p className={`text-xl font-bold tabular-nums ${tone.text}`}>
          {achievement == null ? "—" : percent(achievement)}
        </p>
        <TrafficBadge status={status} />
      </div>
      <div className="text-xs">
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
      className="space-y-3"
    >
      <div>
        <h3
          id="organization-achievement-heading"
          className="text-lg font-semibold"
        >
          Division and department achievement
        </h3>
        <p className="text-sm text-muted-foreground">
          Departments without a division are shown as top-level units reporting
          to the CEO.
        </p>
      </div>
      <Card className="gap-3 py-4">
        <CardContent className="space-y-3 px-4">
          {divisions.map((division) => (
            <div key={division.id} className="space-y-2">
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
            <p className="py-8 text-center text-sm text-muted-foreground">
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
        className="grid gap-2 rounded-lg border px-3 py-2 md:grid-cols-[minmax(180px,1fr)_130px_150px] md:items-center"
        style={{ marginLeft: Math.min(depth, 3) * 10 }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {item.level === "DIVISION" ? (
              <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            ) : (
              <Network className="h-3.5 w-3.5 text-slate-500" />
            )}
            <p className="break-words text-sm font-semibold">
              {item.entityName}
            </p>
          </div>
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {item.kpiName}
            {item.level === "DEPARTMENT" && !item.divisionId
              ? " · Reports to CEO"
              : ""}
          </p>
        </div>
        <div>
          <p className={`text-sm font-bold tabular-nums ${tone.text}`}>
            {achievement == null ? "Pending" : percent(achievement)}
          </p>
          <p className="text-xs text-muted-foreground">local achievement</p>
        </div>
        <div className="text-xs text-muted-foreground md:text-right">
          {impact ? (
            <>
              <p className="font-semibold tabular-nums text-foreground">
                {formatter.format(impact.achievedContributionWeight)} /{" "}
                {formatter.format(impact.plannedContributionWeight)}
              </p>
              <p>corporate score weight</p>
            </>
          ) : (
            <p>Contributes through parent KPI</p>
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
      className="space-y-3"
    >
      <div>
        <h3
          id="corporate-contributors-heading"
          className="text-lg font-semibold"
        >
          Corporate KPI contributors
        </h3>
        <p className="text-sm text-muted-foreground">
          The KPI cascade is shown once. Immediate recipients carry corporate
          score weight; lower levels contribute through their parent KPI.
        </p>
      </div>
      <div className="space-y-3">
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
              className="group/contributor overflow-hidden rounded-xl border bg-card"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="break-words text-xs font-medium text-muted-foreground">
                      {root.objectiveTitle || "Corporate objective"}
                    </p>
                    <h4 className="mt-1 break-words text-sm font-semibold">
                      {root.kpiName}
                    </h4>
                  </div>
                  <Badge variant="outline">
                    {root.resultCount > 0
                      ? `${percent(root.achievementRate * 100)} achievement`
                      : "Awaiting data"}
                  </Badge>
                </div>
                <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-open/contributor:rotate-180" />
              </summary>
              <div className="space-y-2 border-t bg-muted/20 p-3 sm:p-4">
                {children.length === 0 ? (
                  <p className="rounded-lg bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
                    No target-allocation contributor results are available for Q
                    {selectedQuarter}.
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
