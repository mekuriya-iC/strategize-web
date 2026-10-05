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
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Support performance</h2>
        <Badge variant="secondary">{scopeLabels[report.scope] || report.scope}</Badge>
        <Badge variant="outline">
          {context.quarterNumber ? `Q${context.quarterNumber}` : "Annual"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Support readiness</CardTitle>
          <CardDescription>Operational readiness is shown separately and is not a performance outcome.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ReadinessMetric label="Assignments" value={readiness.totalAssignments} />
          <ReadinessMetric label="Ready" value={readiness.ready} positive />
          <ReadinessMetric label="No local KPI" value={readiness.noLocalKpi} />
          <ReadinessMetric label="Planning incomplete" value={readiness.planningIncomplete} />
          <ReadinessMetric label="Pending approval" value={readiness.pendingApproval} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Support contribution summary</CardTitle>
          <CardDescription>
            Achievement and contribution from the departments and divisions assigned to support each corporate KPI. These values remain separate from the direct target-allocation score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.sourceSummaries.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No linked support KPI plans are available for this scope.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {report.sourceSummaries.map((summary) => (
                <SourceSummary key={summary.sourceCorporateKpiId} summary={summary} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />Support outcomes</CardTitle>
          <CardDescription>Authoritative local KPI results for each supporting unit, including achievement and weighted contribution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {groups.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No support relationships are available in this scope.</div>
          ) : groups.map(([corporateId, corporate]) => (
            <section key={corporateId} className="overflow-hidden rounded-lg border">
              <div className="bg-muted/50 px-4 py-3"><p className="text-xs font-medium uppercase text-muted-foreground">Corporate KPI</p><h3 className="font-semibold">{corporate.name}</h3></div>
              {[...corporate.units.entries()].map(([unitId, unit]) => (
                <div key={unitId} className="border-t">
                  <div className="px-4 py-2 text-sm"><span className="text-muted-foreground">Supported by unit:</span> <span className="font-medium">{unit.name}</span></div>
                  <div>
                    <SupportUnitTable
                      rows={unit.rows}
                      selectedQuarter={context.quarterNumber}
                    />
                  </div>
                </div>
              ))}
            </section>
          ))}
        </CardContent>
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
    <TableRow>
      <TableCell className="min-w-52">
        <p className="font-medium">{row.localKpiName || "No local KPI yet"}</p>
        <Badge variant="outline" className="mt-1 text-[10px]">
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
      <TableCell className="min-w-36 align-top text-xs">
        <p>
          <span className="text-muted-foreground">Achievement:</span>{" "}
          {achievement == null ? "Pending" : percent(achievement)}
        </p>
        <p className="mt-1 font-medium">
          <span className="text-muted-foreground">Contribution:</span>{" "}
          {outcomeText(contribution)}
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
    <article className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{summary.sourceCorporateKpiName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.sourceCorporateObjectiveTitle}
          </p>
        </div>
        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {hasResults ? percent(summary.achievementRate) : "—"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">Local KPIs</p>
          <p className="mt-1 font-semibold">{summary.localKpiCount}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">Coverage</p>
          <p className="mt-1 font-semibold">{percent(summary.resultCoverageRate)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">Contribution</p>
          <p className="mt-1 font-semibold">
            {number(summary.achievedContributionWeight)} / {number(summary.plannedContributionWeight)}
          </p>
        </div>
      </div>
    </article>
  );
}

function ReadinessMetric({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return <div className="rounded-lg border p-3"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label}</p>{positive && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</div><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>;
}

function Message({ title, detail, warning = false }: { title: string; detail: string; warning?: boolean }) {
  return <Card className="border-dashed"><CardContent className="flex items-start gap-3 p-6">{warning && <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />}<div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div></CardContent></Card>;
}
