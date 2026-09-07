"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { AlertTriangle } from "lucide-react";
import ExecutivePerformanceDashboard from "@/components/dashboard/ExecutivePerformanceDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { GET_KPI_QUARTER_PERFORMANCE_REPORT } from "@/lib/graphql/queries/quarterly-performance";
import { GET_SUPPORT_PERFORMANCE_REPORT } from "@/lib/graphql/queries/support-performance";
import {
  findEnclosingAnnualPeriod,
  getQuarterLabelForPeriod,
  isQuarterlyPeriod,
} from "@/lib/strategic-periods/periodDates";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import type {
  KpiQuarterPerformanceReport,
  ScorecardLevel,
} from "@/types/graphql";
import type { SupportPerformanceReportData } from "@/types/support-performance";

const scopeLabels = {
  SELF: "My performance",
  DEPARTMENT: "Department performance",
  DIVISION: "Division performance",
  ORGANIZATION: "Organization performance",
} as const;

function primaryLevelForRole(role?: string): ScorecardLevel {
  if (["SUPER_ADMIN", "ADMIN", "HR"].includes(role || "")) {
    return "CORPORATE";
  }
  if (role === "DIRECTOR") return "DIVISION";
  if (role === "MANAGER") return "DEPARTMENT";
  return "INDIVIDUAL";
}

function LoadingDashboard() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-muted" />
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

    const parsedQuarter = isQuarterlyPeriod(selectedPeriod)
      ? Number(
          getQuarterLabelForPeriod(selectedPeriod, strategicPeriods).replace(
            "Q",
            "",
          ),
        )
      : undefined;

    return {
      annualPeriod,
      quarterNumber:
        parsedQuarter && parsedQuarter >= 1 && parsedQuarter <= 4
          ? parsedQuarter
          : undefined,
    };
  }, [selectedPeriod, strategicPeriods]);

  const annualStrategicPeriodId = context?.annualPeriod.strategicPeriodId;
  const sharedDirectFilters = {
    annualStrategicPeriodId,
    quarterNumber: context?.quarterNumber,
    cascadeType: "TARGET_ALLOCATION",
    page: 1,
    limit: 1,
  };
  const skip = !selectionValidated || !annualStrategicPeriodId;

  const {
    data: primaryData,
    loading: primaryLoading,
    error: primaryError,
  } = useQuery<{
    kpiQuarterPerformanceReport: KpiQuarterPerformanceReport;
  }>(GET_KPI_QUARTER_PERFORMANCE_REPORT, {
    variables: {
      filters: {
        ...sharedDirectFilters,
        level: primaryLevelForRole(user?.role),
      },
    },
    skip,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const {
    data: hierarchyData,
    loading: hierarchyLoading,
    error: hierarchyError,
  } = useQuery<{
    kpiQuarterPerformanceReport: KpiQuarterPerformanceReport;
  }>(GET_KPI_QUARTER_PERFORMANCE_REPORT, {
    variables: { filters: sharedDirectFilters },
    skip,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const { data: supportData, error: supportError } = useQuery<{
    supportPerformanceReport: SupportPerformanceReportData;
  }>(GET_SUPPORT_PERFORMANCE_REPORT, {
    variables: {
      filters: {
        annualStrategicPeriodId,
        quarterNumber: context?.quarterNumber,
        page: 1,
        limit: 200,
      },
    },
    skip,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  if (
    !selectionValidated ||
    !selectedPeriod ||
    periodsLoading ||
    primaryLoading ||
    hierarchyLoading
  ) {
    return <LoadingDashboard />;
  }

  if (!context) return null;

  if (primaryError || hierarchyError) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Performance dashboard is unavailable</p>
            <p className="text-muted-foreground">
              Direct KPI data could not be loaded. The Portfolio Overview above is
              unaffected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryReport = primaryData?.kpiQuarterPerformanceReport;
  const hierarchyReport = hierarchyData?.kpiQuarterPerformanceReport;
  if (!primaryReport || !hierarchyReport) return null;

  return (
    <div className="space-y-3">
      {supportError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Support KPI results are temporarily unavailable. Direct achievement is
          still complete and remains unaffected.
        </div>
      )}
      <ExecutivePerformanceDashboard
        primaryReport={primaryReport}
        hierarchyReport={hierarchyReport}
        supportReport={supportData?.supportPerformanceReport}
        selectedQuarter={context.quarterNumber}
        scopeLabel={scopeLabels[primaryReport.scope] || "Performance"}
      />
    </div>
  );
}
