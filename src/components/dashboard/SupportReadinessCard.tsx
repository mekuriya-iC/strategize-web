"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GET_SUPPORT_PERFORMANCE_REPORT } from "@/lib/graphql/queries/support-performance";
import { useStrategicPeriodStore } from "@/stores";
import type { SupportPerformanceReportData } from "@/types/support-performance";

export default function SupportReadinessCard() {
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);
  const isAnnual = !selectedPeriod?.periodType || selectedPeriod.periodType.toLowerCase() === "annual";
  const { data, loading, error } = useQuery<{ supportPerformanceReport: SupportPerformanceReportData }>(
    GET_SUPPORT_PERFORMANCE_REPORT,
    {
      variables: { filters: { annualStrategicPeriodId: selectedPeriod?.strategicPeriodId } },
      skip: !selectedPeriod?.strategicPeriodId || !isAnnual,
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
    },
  );

  if (!selectedPeriod?.strategicPeriodId || !isAnnual) return null;
  const report = data?.supportPerformanceReport;
  const readiness = report?.readiness;

  return (
    <Card className="max-w-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Support readiness</CardTitle><CardDescription className="mt-1">Readiness only; support outcomes are reported separately.</CardDescription></div>
          <Button asChild size="sm" variant="ghost"><Link href="/dashboard/reports?tab=support">Details <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !readiness ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : error ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4 text-amber-600" />Readiness is unavailable.</p>
        ) : readiness ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Ready" value={readiness.ready} icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />} />
            <Metric label="No local KPI" value={readiness.noLocalKpi} />
            <Metric label="Pending" value={readiness.planningIncomplete + readiness.pendingApproval} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return <div className="rounded-md bg-muted/50 p-2"><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">{icon}{label}</div><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>;
}
