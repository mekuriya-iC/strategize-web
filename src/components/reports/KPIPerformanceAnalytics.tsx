"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  Loader2,
  Target,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import { GET_KPI_QUARTER_PERFORMANCE_REPORT } from "@/lib/graphql/queries/quarterly-performance";
import { resolveReportingPeriodContext } from "@/lib/reports/reportingPeriodContext";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import type {
  KpiQuarterPerformanceReport,
  KpiQuarterReportFilterOption,
  KpiQuarterReportKpiRollup,
  ScorecardLevel,
} from "@/types/graphql";

interface KPIPerformanceAnalyticsProps {
  onExport?: (data: unknown) => void;
}

type PerformanceTone = {
  label: string;
  badge: string;
  text: string;
};

const ALL = "all";

function performanceTone(
  percentage: number,
  hasResults: boolean,
): PerformanceTone {
  if (!hasResults) {
    return {
      label: "Awaiting results",
      badge: "border-slate-200 bg-slate-100 text-slate-700",
      text: "text-slate-600 dark:text-slate-300",
    };
  }
  if (percentage > 90) {
    return {
      label: "On track",
      badge: "border-emerald-200 bg-emerald-100 text-emerald-700",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (percentage >= 75) {
    return {
      label: "Watch",
      badge: "border-amber-200 bg-amber-100 text-amber-800",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    label: "Needs attention",
    badge: "border-rose-200 bg-rose-100 text-rose-700",
    text: "text-rose-600 dark:text-rose-400",
  };
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
}

function filterByParent(
  options: KpiQuarterReportFilterOption[],
  parentId: string,
) {
  if (parentId === ALL) return options;
  return options.filter(
    (option) =>
      option.parentId === parentId || option.parentIds.includes(parentId),
  );
}

function levelForSelection(
  divisionId: string,
  departmentId: string,
  employeeId: string,
): ScorecardLevel {
  if (employeeId !== ALL) return "INDIVIDUAL";
  if (departmentId !== ALL) return "DEPARTMENT";
  if (divisionId !== ALL) return "DIVISION";
  return "CORPORATE";
}

function scopeTitle(
  level: ScorecardLevel,
  report: KpiQuarterPerformanceReport,
  selectedId: string,
) {
  const lookup =
    level === "DIVISION"
      ? report.availableFilters.divisions
      : level === "DEPARTMENT"
        ? report.availableFilters.departments
        : level === "INDIVIDUAL"
          ? report.availableFilters.employees
          : [];
  const name = lookup.find((item) => item.id === selectedId)?.name;
  if (level === "DIVISION") return name || "Division performance";
  if (level === "DEPARTMENT") return name || "Department performance";
  if (level === "INDIVIDUAL") return name || "Employee performance";
  return "Corporate Level Performance";
}

function kpiUnit(kpi: KpiQuarterReportKpiRollup) {
  return kpi.customUnitLabel || kpi.measurementUnit || "";
}

export default function KPIPerformanceAnalytics({
  onExport,
}: KPIPerformanceAnalyticsProps) {
  const user = useAuthStore((state) => state.user);
  const selectedPeriod = useStrategicPeriodStore(
    (state) => state.selectedPeriod,
  );
  const { strategicPeriods, loading: periodsLoading } =
    useActiveStrategicPlanPeriods();
  const globalContext = useMemo(
    () => resolveReportingPeriodContext(selectedPeriod, strategicPeriods),
    [selectedPeriod, strategicPeriods],
  );
  const selectedAnnualId =
    globalContext?.annualPeriod.strategicPeriodId || "";
  const [selectedQuarterOverride, setSelectedQuarterOverride] = useState<
    string | null
  >(null);
  const selectedQuarter =
    selectedQuarterOverride ??
    (globalContext?.quarterNumber ? String(globalContext.quarterNumber) : ALL);
  const [selectedDivisionId, setSelectedDivisionId] = useState(ALL);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(ALL);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(ALL);

  const reportLevel = levelForSelection(
    selectedDivisionId,
    selectedDepartmentId,
    selectedEmployeeId,
  );
  const reportFilters = useMemo(
    () => ({
      annualStrategicPeriodId: selectedAnnualId,
      ...(selectedQuarter === ALL
        ? {}
        : { quarterNumber: Number(selectedQuarter) }),
      ...(selectedDivisionId === ALL
        ? {}
        : { divisionId: selectedDivisionId }),
      ...(selectedDepartmentId === ALL
        ? {}
        : { departmentId: selectedDepartmentId }),
      ...(selectedEmployeeId === ALL
        ? {}
        : { employeeId: selectedEmployeeId }),
      level: reportLevel,
      cascadeType: "TARGET_ALLOCATION",
      page: 1,
      limit: 200,
    }),
    [
      reportLevel,
      selectedAnnualId,
      selectedDepartmentId,
      selectedDivisionId,
      selectedEmployeeId,
      selectedQuarter,
    ],
  );

  const { data, loading, error } = useQuery<{
    kpiQuarterPerformanceReport: KpiQuarterPerformanceReport;
  }>(GET_KPI_QUARTER_PERFORMANCE_REPORT, {
    variables: { filters: reportFilters },
    skip: !selectedAnnualId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });
  const report = data?.kpiQuarterPerformanceReport;

  const departments = useMemo(
    () =>
      filterByParent(
        report?.availableFilters.departments || [],
        selectedDivisionId,
      ),
    [report?.availableFilters.departments, selectedDivisionId],
  );
  const employees = useMemo(() => {
    const parentId =
      selectedDepartmentId !== ALL
        ? selectedDepartmentId
        : selectedDivisionId;
    return filterByParent(report?.availableFilters.employees || [], parentId);
  }, [
    report?.availableFilters.employees,
    selectedDepartmentId,
    selectedDivisionId,
  ]);

  if (periodsLoading && !globalContext) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!globalContext || !selectedAnnualId) {
    return (
      <Message
        title="Select a reporting period"
        detail="Choose an annual period or quarter from the dashboard header to load KPI performance."
      />
    );
  }
  if (error) {
    return (
      <Message
        title="KPI performance is unavailable"
        detail={error.message}
        warning
      />
    );
  }
  if (loading && !report) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!report) return null;

  const summary = report.summary;
  const hasResults = summary.finalCount + summary.provisionalCount > 0;
  const achievement = summary.weightedAchievementRate * 100;
  const tone = performanceTone(achievement, hasResults);
  const selectedEntityId =
    selectedEmployeeId !== ALL
      ? selectedEmployeeId
      : selectedDepartmentId !== ALL
        ? selectedDepartmentId
        : selectedDivisionId;
  const title = scopeTitle(reportLevel, report, selectedEntityId);
  const reportedKpis = report.kpiRollups.filter(
    (item) => item.resultCount > 0,
  );
  const notDue = report.kpiRollups.reduce(
    (sum, item) => sum + (item.notDueCount || 0),
    0,
  );

  const handleExport = () => {
    onExport?.({
      period: report.annualStrategicPeriodName,
      quarter:
        selectedQuarter === ALL ? "Annual" : `Q${selectedQuarter}`,
      scope: report.scope,
      level: reportLevel,
      filters: reportFilters,
      summary: report.summary,
      kpis: report.kpiRollups,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.fullName,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="h-9 px-3 text-sm font-normal">
            {globalContext.annualPeriod.name}
          </Badge>

          <Select
            value={selectedQuarter}
            onValueChange={setSelectedQuarterOverride}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All quarters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All quarters</SelectItem>
              {[1, 2, 3, 4].map((quarter) => (
                <SelectItem key={quarter} value={String(quarter)}>
                  Q{quarter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDivisionId}
            onValueChange={(value) => {
              setSelectedDivisionId(value);
              setSelectedDepartmentId(ALL);
              setSelectedEmployeeId(ALL);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All divisions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All divisions</SelectItem>
              {report.availableFilters.divisions.map((division) => (
                <SelectItem key={division.id} value={division.id}>
                  {division.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDepartmentId}
            onValueChange={(value) => {
              setSelectedDepartmentId(value);
              setSelectedEmployeeId(ALL);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedEmployeeId}
            onValueChange={setSelectedEmployeeId}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card className="overflow-hidden border-2 border-indigo-200 shadow-sm dark:border-indigo-900/40">
        <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-indigo-900/30 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500 p-2 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>
                  Target-allocation quarter plans and calculated results
                  {selectedQuarter === ALL
                    ? " across the annual period"
                    : ` for Q${selectedQuarter}`}
                  .
                </CardDescription>
              </div>
            </div>
            {summary.kpiCount > 0 && (
              <Badge className={`border px-3 py-1 ${tone.badge}`}>
                {tone.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {summary.kpiCount === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Target className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="font-medium">No applicable KPI plans</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No target-allocation KPI quarter plans exist for this
                level and filter selection. This is no data, not 0% achievement.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Weighted achievement
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {number(summary.achievedContributionWeight)} of {number(summary.plannedContributionWeight)} planned score weight
                    </p>
                  </div>
                  <span className={`text-4xl font-bold ${tone.text}`}>
                    {hasResults ? `${achievement.toFixed(1)}%` : "—"}
                  </span>
                </div>
                <Progress
                  value={hasResults ? Math.min(100, Math.max(0, achievement)) : 0}
                  className="h-3"
                />
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>{percent(summary.resultCoverageRate)} result coverage</span>
                  <span>
                    {summary.pendingResultCount} pending · {summary.notDueCount || 0} not due
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4" />
                  KPI breakdown
                </h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  {report.kpiRollups.map((kpi) => {
                    const kpiHasResults = kpi.resultCount > 0;
                    const kpiAchievement = kpi.achievementRate * 100;
                    const kpiTone = performanceTone(
                      kpiAchievement,
                      kpiHasResults,
                    );
                    return (
                      <article
                        key={kpi.kpiId}
                        className="rounded-xl border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{kpi.kpiName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {kpi.objectiveTitle || "Strategic KPI"}
                            </p>
                          </div>
                          <span className={`font-bold ${kpiTone.text}`}>
                            {kpiHasResults
                              ? `${kpiAchievement.toFixed(1)}%`
                              : "—"}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <Metric
                            label="Target"
                            value={`${number(kpi.target)} ${kpiUnit(kpi)}`.trim()}
                          />
                          <Metric
                            label="Actual"
                            value={
                              kpi.actual == null
                                ? "Pending"
                                : `${number(kpi.actual)} ${kpiUnit(kpi)}`.trim()
                            }
                          />
                          <Metric
                            label="Contribution"
                            value={number(kpi.achievedContributionWeight)}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{percent(kpi.resultCoverageRate)} coverage</span>
                          <span>
                            {kpi.resultCount}/{Math.max(0, kpi.planCount - (kpi.notDueCount || 0))} applicable results
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance insights</CardTitle>
          <CardDescription>
            Support relationships remain visible in the Support tab and are not
            mixed into the direct target-allocation score.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Insight label="Applicable KPIs" value={summary.kpiCount} />
          <Insight label="KPIs with results" value={reportedKpis.length} />
          <Insight
            label="On track (>90%)"
            value={reportedKpis.filter((kpi) => kpi.achievementRate > 0.9).length}
            positive
          />
          <Insight
            label="Needs attention (<75%)"
            value={reportedKpis.filter((kpi) => kpi.achievementRate < 0.75).length}
          />
          <Insight label="Quarter plans not due" value={notDue} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}

function Insight({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {positive && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Message({
  title,
  detail,
  warning = false,
}: {
  title: string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-start gap-3 p-6">
        {warning && (
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
        )}
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
