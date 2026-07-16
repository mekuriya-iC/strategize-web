"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { AlertTriangle, CheckCircle2, Loader2, Network, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GET_SUPPORT_PERFORMANCE_REPORT } from "@/lib/graphql/queries/support-performance";
import { useStrategicPeriodStore } from "@/stores";
import type { SupportPerformanceReportData, SupportPerformanceRow, SupportQuarterOutcome } from "@/types/support-performance";

const scopeLabels: Record<string, string> = {
  SELF: "My scope",
  DEPARTMENT: "Department scope",
  DIVISION: "Division scope",
  ORGANIZATION: "Organization scope",
};

const number = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

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
      <p><span className="text-muted-foreground">Achievement:</span> {number(outcome.achievement)}%</p>
      <Badge variant={outcome.resultStatus === "FINAL" ? "default" : "secondary"} className="text-[10px]">
        {outcome.resultStatus || "Calculated"}
      </Badge>
      <p className="text-muted-foreground">Contribution: {outcomeText(outcome.contribution)}</p>
    </div>
  );
}

export default function SupportPerformanceReport() {
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);
  const isAnnual = !selectedPeriod?.periodType || selectedPeriod.periodType.toLowerCase() === "annual";
  const { data, loading, error } = useQuery<{ supportPerformanceReport: SupportPerformanceReportData }>(
    GET_SUPPORT_PERFORMANCE_REPORT,
    {
      variables: { filters: { annualStrategicPeriodId: selectedPeriod?.strategicPeriodId } },
      skip: !selectedPeriod?.strategicPeriodId || !isAnnual,
      fetchPolicy: "cache-and-network",
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

  if (!selectedPeriod) return <Message title="Select an annual strategic period" detail="Choose a period to load support performance." />;
  if (!isAnnual) return <Message title="Annual period required" detail="Support performance is reported against the selected annual period." />;
  if (loading && !report) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error) return <Message title="Support performance is unavailable" detail={error.message} warning />;
  if (!report) return null;

  const readiness = report.readiness;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Support performance</h2>
        <Badge variant="secondary">{scopeLabels[report.scope] || report.scope}</Badge>
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
          <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />Support outcomes</CardTitle>
          <CardDescription>Server-returned local KPI results. No corporate outcome or combined support score is calculated here.</CardDescription>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Local KPI</TableHead>{[1,2,3,4].map((q) => <TableHead key={q}>Q{q}</TableHead>)}<TableHead>Annual contribution</TableHead></TableRow></TableHeader>
                      <TableBody>{unit.rows.map((row) => <SupportRow key={`${row.objectiveSupportSourceId}-${row.localKpiId ?? "unplanned"}`} row={row} />)}</TableBody>
                    </Table>
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

function SupportRow({ row }: { row: SupportPerformanceRow }) {
  return <TableRow><TableCell className="min-w-52"><p className="font-medium">{row.localKpiName || "No local KPI yet"}</p><Badge variant="outline" className="mt-1 text-[10px]">{row.readinessStatus.replaceAll("_", " ")}</Badge></TableCell>{[1,2,3,4].map((quarter) => <TableCell key={quarter} className="align-top"><QuarterOutcome outcome={row.quarters.find((item) => item.quarterNumber === quarter)} /></TableCell>)}<TableCell className="align-top font-medium">{outcomeText(row.annualContribution)}</TableCell></TableRow>;
}

function ReadinessMetric({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return <div className="rounded-lg border p-3"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label}</p>{positive && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</div><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>;
}

function Message({ title, detail, warning = false }: { title: string; detail: string; warning?: boolean }) {
  return <Card className="border-dashed"><CardContent className="flex items-start gap-3 p-6">{warning && <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />}<div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div></CardContent></Card>;
}
