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
      {/* Scope & Filter Console */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-2xs backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/70 sm:p-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-xl border border-indigo-200/80 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Building2 className="h-3.5 w-3.5" />
              {globalContext.annualPeriod.name}
            </span>

            <Select
              value={selectedQuarter}
              onValueChange={setSelectedQuarterOverride}
            >
              <SelectTrigger className="h-9 w-36 rounded-xl border border-slate-200/90 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
                <SelectValue placeholder="All quarters" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                <SelectItem value={ALL} className="rounded-lg text-xs font-medium">All quarters</SelectItem>
                {[1, 2, 3, 4].map((quarter) => (
                  <SelectItem key={quarter} value={String(quarter)} className="rounded-lg text-xs font-medium">
                    Quarter {quarter}
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
              <SelectTrigger className="h-9 w-48 rounded-xl border border-slate-200/90 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
                <SelectValue placeholder="All divisions" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                <SelectItem value={ALL} className="rounded-lg text-xs font-medium">All divisions</SelectItem>
                {report.availableFilters.divisions.map((division) => (
                  <SelectItem key={division.id} value={division.id} className="rounded-lg text-xs font-medium">
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
              <SelectTrigger className="h-9 w-48 rounded-xl border border-slate-200/90 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                <SelectItem value={ALL} className="rounded-lg text-xs font-medium">All departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id} className="rounded-lg text-xs font-medium">
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="h-9 w-48 rounded-xl border border-slate-200/90 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
                <SelectItem value={ALL} className="rounded-lg text-xs font-medium">All employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id} className="rounded-lg text-xs font-medium">
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleExport}
            variant="outline"
            className="h-9 rounded-xl border-slate-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-slate-50 dark:border-zinc-800"
          >
            <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
            Export Scope Data
          </Button>
        </div>
      </div>

      {/* Primary Scope Performance Card */}
      <Card className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-zinc-900/90">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" />
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-indigo-50/20 to-slate-50/80 p-6 dark:border-zinc-800 dark:from-zinc-900/90 dark:via-indigo-950/20 dark:to-zinc-900/90 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  {title}
                </CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Target-allocation quarter plans and calculated results
                  {selectedQuarter === ALL
                    ? " across the entire annual period"
                    : ` for Quarter ${selectedQuarter}`}
                  .
                </CardDescription>
              </div>
            </div>
            {summary.kpiCount > 0 && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tone.badge}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {tone.label}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-7 p-6 sm:p-7">
          {summary.kpiCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center dark:border-zinc-800">
              <Target className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="font-bold text-slate-800 dark:text-zinc-200">No applicable KPI plans</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                No target-allocation KPI quarter plans exist for this level and filter selection.
              </p>
            </div>
          ) : (
            <>
              {/* Primary Score Progress */}
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-800/30">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Weighted Achievement
                    </span>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
                      <span className="font-bold text-slate-700 dark:text-zinc-200">{number(summary.achievedContributionWeight)}</span> of <span className="font-bold text-slate-700 dark:text-zinc-200">{number(summary.plannedContributionWeight)}</span> planned score weight
                    </p>
                  </div>
                  <span className={`text-4xl font-black tracking-tight tabular-nums sm:text-5xl ${tone.text}`}>
                    {hasResults ? `${achievement.toFixed(1)}%` : "—"}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{
                      width: `${hasResults ? Math.min(100, Math.max(0, achievement)) : 0}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    {percent(summary.resultCoverageRate)} result coverage
                  </span>
                  <span>
                    {summary.pendingResultCount} pending · {summary.notDueCount || 0} not due
                  </span>
                </div>
              </div>

              {/* KPI Breakdown Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-zinc-100">
                    <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Strategic KPI Breakdown
                  </h3>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold">
                    {report.kpiRollups.length} KPIs
                  </Badge>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
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
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                              {kpi.kpiName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                              {kpi.objectiveTitle || "Strategic Priority KPI"}
                            </p>
                          </div>
                          <span className={`text-lg font-extrabold tabular-nums ${kpiTone.text}`}>
                            {kpiHasResults
                              ? `${kpiAchievement.toFixed(1)}%`
                              : "—"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
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

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
                          <span className="font-semibold text-slate-600 dark:text-zinc-300">
                            {percent(kpi.resultCoverageRate)} coverage
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {kpi.resultCount}/{Math.max(0, kpi.planCount - (kpi.notDueCount || 0))} results
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

      {/* Performance Insights */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-7">
        <CardHeader className="p-0 pb-5">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Performance Insights & Health Check
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Support relationships remain visible in the Support tab and are not mixed into the direct target-allocation score.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-0 sm:grid-cols-2 xl:grid-cols-5">
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
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-800/40">
      <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-bold tabular-nums text-slate-800 dark:text-zinc-200" title={value}>
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
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{label}</p>
        {positive && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-zinc-100">{value}</p>
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
    <Card className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
      <CardContent className="flex items-start gap-3.5 p-0">
        {warning && (
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
        )}
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
