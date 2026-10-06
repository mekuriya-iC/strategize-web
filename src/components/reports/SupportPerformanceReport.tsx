"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { AlertTriangle, CheckCircle2, Loader2, Network, ShieldCheck, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { GET_SUPPORT_PERFORMANCE_REPORT } from "@/lib/graphql/queries/support-performance";
import { resolveReportingPeriodContext } from "@/lib/reports/reportingPeriodContext";
import { useStrategicPeriodStore } from "@/stores";
import type {
  SupportPerformanceReportData,
  SupportPerformanceRow,
  SupportPerformanceSourceSummary,
  SupportQuarterOutcome,
} from "@/types/support-performance";

const scopeLabels: Record<string, string> = {
  SELF: "My scope",
  DEPARTMENT: "Department scope",
  DIVISION: "Division scope",
  ORGANIZATION: "Organization scope",
};

const number = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

function outcomeText(value: number | null | undefined, suffix = "") {
  return value == null ? "Pending / not calculated" : `${number(value)}${suffix}`;
}

function QuarterOutcome({ outcome }: { outcome?: SupportQuarterOutcome }) {
  if (!outcome || outcome.actual == null || outcome.achievement == null) {
    return (
      <div className="min-w-32 space-y-1 text-xs text-muted-foreground">
        <p className="font-medium">Pending</p>
        <p>Not calculated</p>
      </div>
    );
  }

  return (
    <div className="min-w-32 space-y-1 text-xs">
      <p><span className="text-muted-foreground">Actual:</span> {number(outcome.actual)}</p>
      <p><span className="text-muted-foreground">Achievement:</span> {number(outcome.achievement * 100)}%</p>
      <Badge variant={outcome.resultStatus === "FINAL" ? "default" : "secondary"} className="text-[10px]">
        {outcome.resultStatus || "Calculated"}
      </Badge>
      <p className="text-muted-foreground">Contribution: {outcomeText(outcome.contribution)}</p>
    </div>
  );
}

function SupportUnitTable({
  rows,
  selectedQuarter,
}: {
  rows: SupportPerformanceRow[];
  selectedQuarter?: number;
}) {
  const visibleQuarters = selectedQuarter ? [selectedQuarter] : [1, 2, 3, 4];
  const columns = useMemo(
    () => [
      {
        id: "localKpi",
        accessor: (row: SupportPerformanceRow) =>
          row.localKpiName || "No local KPI yet",
      },
      {
        id: "annual",
        accessor: (row: SupportPerformanceRow) =>
          selectedQuarter
            ? (row.quarters.find(
                (quarter) => quarter.quarterNumber === selectedQuarter,
              )?.contribution ?? -1)
            : (row.annualContribution ?? -1),
      },
    ],
    [selectedQuarter],
  );

  const { processedRows, getHeaderProps } = useTableColumnControls({
    rows,
    columns,
  });

  return (
    <Table stickyFirstColumn>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortableFilterableHeader
              label="Local KPI"
              {...getHeaderProps("localKpi")}
            />
          </TableHead>
          {visibleQuarters.map((q) => (
            <TableHead key={q}>Q{q}</TableHead>
          ))}
          <TableHead>
            <SortableFilterableHeader
              label={selectedQuarter ? `Q${selectedQuarter} outcome` : "Annual outcome"}
              filterable={false}
              {...getHeaderProps("annual")}
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {processedRows.map((row) => (
          <SupportRow
            key={`${row.objectiveSupportSourceId}-${row.localKpiId ?? "unplanned"}`}
            row={row}
            visibleQuarters={visibleQuarters}
            selectedQuarter={selectedQuarter}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export default function SupportPerformanceReport() {
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);
  const { strategicPeriods, loading: periodsLoading } =
    useActiveStrategicPlanPeriods();
  const context = useMemo(
    () => resolveReportingPeriodContext(selectedPeriod, strategicPeriods),
    [selectedPeriod, strategicPeriods],
  );
  const { data, loading, error } = useQuery<{ supportPerformanceReport: SupportPerformanceReportData }>(
    GET_SUPPORT_PERFORMANCE_REPORT,
    {
      variables: {
        filters: {
          annualStrategicPeriodId: context?.annualPeriod.strategicPeriodId,
          quarterNumber: context?.quarterNumber,
          page: 1,
          limit: 200,
        },
      },
      skip: !context?.annualPeriod.strategicPeriodId,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true,
    },
  );
  const report = data?.supportPerformanceReport;
  const groups = useMemo(() => {
    const grouped = new Map<string, { name: string; units: Map<string, { name: string; rows: SupportPerformanceRow[] }> }>();
    for (const row of report?.rows || []) {
      const corporate = grouped.get(row.sourceCorporateKpiId) || { name: row.sourceCorporateKpiName, units: new Map() };
      const unit = corporate.units.get(row.unitId) || { name: row.unitName, rows: [] };
      unit.rows.push(row);
      corporate.units.set(row.unitId, unit);
      grouped.set(row.sourceCorporateKpiId, corporate);
    }
    return [...grouped.entries()];
  }, [report?.rows]);

  if (!selectedPeriod) return <Message title="Select a reporting period" detail="Choose an annual period or quarter to load support performance." />;
  if (periodsLoading && !context) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!context) return <Message title="Reporting period unavailable" detail="The selected quarter could not be matched to its annual plan." warning />;
  if (loading && !report) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error) return <Message title="Support performance is unavailable" detail={error.message} warning />;
  if (!report) return null;

  const readiness = report.readiness;
  return (
    <div className="space-y-6">
      {/* Scope Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Support Performance Matrix
          </h2>
          <Badge className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            {scopeLabels[report.scope] || report.scope}
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
            {context.quarterNumber ? `Quarter ${context.quarterNumber}` : "Annual Overview"}
          </Badge>
        </div>
      </div>

      {/* Support Readiness Console */}
      <Card className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-7">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
        <CardHeader className="p-0 pb-5">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-zinc-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            Support Readiness Status
          </CardTitle>
          <CardDescription className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Operational planning and approval readiness are tracked separately from calculated performance outcomes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
          <ReadinessMetric label="Assignments" value={readiness.totalAssignments} />
          <ReadinessMetric label="Fully Ready" value={readiness.ready} positive />
          <ReadinessMetric label="Missing Local KPI" value={readiness.noLocalKpi} />
          <ReadinessMetric label="Planning Incomplete" value={readiness.planningIncomplete} />
          <ReadinessMetric label="Pending Approval" value={readiness.pendingApproval} />
        </CardContent>
      </Card>

      {/* Support Contribution Summary */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-7">
        <CardHeader className="p-0 pb-5">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-zinc-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Target className="h-4 w-4" />
            </div>
            Corporate Support Contribution
          </CardTitle>
          <CardDescription className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Achievement and contribution from departments and divisions assigned to support each corporate KPI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {report.sourceSummaries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs font-medium text-slate-400 dark:border-zinc-800">
              No linked support KPI plans are available for this scope.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {report.sourceSummaries.map((summary) => (
                <SourceSummary key={summary.sourceCorporateKpiId} summary={summary} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Outcomes Table Card */}
      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90">
        <div className="border-b border-slate-100 p-6 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Detailed Support Outcomes
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                Authoritative local KPI results for each supporting unit, including achievement and weighted contribution.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs font-medium text-slate-400 dark:border-zinc-800">
              No support relationships are available in this scope.
            </div>
          ) : groups.map(([corporateId, corporate]) => (
            <section key={corporateId} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Corporate Target KPI</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{corporate.name}</h4>
              </div>
              {[...corporate.units.entries()].map(([unitId, unit]) => (
                <div key={unitId} className="border-t border-slate-100 first:border-t-0 dark:border-zinc-800">
                  <div className="bg-slate-50/30 px-5 py-2.5 text-xs dark:bg-zinc-800/20">
                    <span className="text-slate-400">Supporting Unit:</span>{" "}
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{unit.name}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <SupportUnitTable
                      rows={unit.rows}
                      selectedQuarter={context.quarterNumber}
                    />
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SupportRow({
  row,
  visibleQuarters,
  selectedQuarter,
}: {
  row: SupportPerformanceRow;
  visibleQuarters: number[];
  selectedQuarter?: number;
}) {
  const selectedOutcome = selectedQuarter
    ? row.quarters.find((item) => item.quarterNumber === selectedQuarter)
    : undefined;
  const achievement = selectedQuarter
    ? selectedOutcome?.achievement
    : row.annualAchievement;
  const contribution = selectedQuarter
    ? selectedOutcome?.contribution
    : row.annualContribution;
  return (
    <TableRow className="transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/50">
      <TableCell className="min-w-56 font-semibold text-slate-900 dark:text-zinc-100">
        <div>{row.localKpiName || "No local KPI yet"}</div>
        <Badge variant="outline" className="mt-1 rounded-full text-[10px] font-medium">
          {row.readinessStatus.replaceAll("_", " ")}
        </Badge>
      </TableCell>
      {visibleQuarters.map((quarter) => (
        <TableCell key={quarter} className="align-top">
          <QuarterOutcome
            outcome={row.quarters.find(
              (item) => item.quarterNumber === quarter,
            )}
          />
        </TableCell>
      ))}
      <TableCell className="min-w-40 align-top text-xs">
        <p className="font-semibold text-slate-700 dark:text-zinc-300">
          <span className="text-slate-400">Achievement:</span>{" "}
          <span className="font-bold tabular-nums text-slate-900 dark:text-zinc-100">
            {achievement == null ? "Pending" : percent(achievement)}
          </span>
        </p>
        <p className="mt-1 font-semibold text-indigo-600 dark:text-indigo-400">
          <span className="text-slate-400">Contribution:</span>{" "}
          <span className="font-bold tabular-nums">{outcomeText(contribution)}</span>
        </p>
      </TableCell>
    </TableRow>
  );
}

function SourceSummary({
  summary,
}: {
  summary: SupportPerformanceSourceSummary;
}) {
  const hasResults = summary.resultCount > 0;
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
            {summary.sourceCorporateKpiName}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {summary.sourceCorporateObjectiveTitle}
          </p>
        </div>
        <span className="text-xl font-black tabular-nums text-indigo-600 dark:text-indigo-400">
          {hasResults ? percent(summary.achievementRate) : "—"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-800/40">
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Local KPIs</p>
          <p className="mt-1 font-bold tabular-nums text-slate-800 dark:text-zinc-200">{summary.localKpiCount}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-800/40">
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Coverage</p>
          <p className="mt-1 font-bold tabular-nums text-slate-800 dark:text-zinc-200">{percent(summary.resultCoverageRate)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-800/40">
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Contribution</p>
          <p className="mt-1 font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
            {number(summary.achievedContributionWeight)} / {number(summary.plannedContributionWeight)}
          </p>
        </div>
      </div>
    </article>
  );
}

function ReadinessMetric({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{label}</p>
        {positive && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function Message({ title, detail, warning = false }: { title: string; detail: string; warning?: boolean }) {
  return (
    <Card className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
      <CardContent className="flex items-start gap-3.5 p-0">
        {warning && <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />}
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
