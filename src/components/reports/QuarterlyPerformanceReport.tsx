"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  FilterX,
  Loader2,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { GET_KPI_QUARTER_PERFORMANCE_REPORT } from "@/lib/graphql/queries/quarterly-performance";
import { exportReport } from "@/lib/utils/exportReport";
import { summaryAchievement } from "@/lib/dashboard/performanceDashboard";
import { useStrategicPeriodStore } from "@/stores";
import type {
  KpiMode,
  KpiQuarterPerformanceReport,
  KpiQuarterPlanStatus,
  KpiQuarterReportRow,
  KpiQuarterReportRollup,
  KpiQuarterReportSummary,
  KpiQuarterResultStatus,
  ScorecardLevel,
} from "@/types/graphql";

const ALL = "ALL";

interface ReportFilters {
  quarter: string;
  divisionId: string;
  departmentId: string;
  employeeId: string;
  level: string;
  kpiMode: string;
  planStatus: string;
  resultStatus: string;
  search: string;
}

const EMPTY_FILTERS: ReportFilters = {
  quarter: ALL,
  divisionId: ALL,
  departmentId: ALL,
  employeeId: ALL,
  level: ALL,
  kpiMode: ALL,
  planStatus: ALL,
  resultStatus: ALL,
  search: "",
};

export default function QuarterlyPerformanceReport() {
  const selectedPeriod = useStrategicPeriodStore(
    (state) => state.selectedPeriod,
  );
  const { can } = usePermissions();
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<KpiQuarterReportRow | null>(
    null,
  );
  const deferredSearch = useDebouncedValue(filters.search.trim(), 350);
  const isAnnual =
    !selectedPeriod?.periodType ||
    selectedPeriod.periodType.toLowerCase() === "annual";

  const variables = useMemo(
    () => ({
      filters: {
        annualStrategicPeriodId: selectedPeriod?.strategicPeriodId,
        quarterNumber:
          filters.quarter === ALL ? undefined : Number(filters.quarter),
        divisionId: filters.divisionId === ALL ? undefined : filters.divisionId,
        departmentId:
          filters.departmentId === ALL ? undefined : filters.departmentId,
        employeeId: filters.employeeId === ALL ? undefined : filters.employeeId,
        level:
          filters.level === ALL ? undefined : (filters.level as ScorecardLevel),
        kpiMode:
          filters.kpiMode === ALL ? undefined : (filters.kpiMode as KpiMode),
        planStatus:
          filters.planStatus === ALL
            ? undefined
            : (filters.planStatus as KpiQuarterPlanStatus),
        resultStatus:
          filters.resultStatus === ALL
            ? undefined
            : (filters.resultStatus as KpiQuarterResultStatus),
        search: deferredSearch || undefined,
        page,
        limit: 50,
      },
    }),
    [deferredSearch, filters, page, selectedPeriod?.strategicPeriodId],
  );

  const { data, loading, error, refetch } = useQuery<{
    kpiQuarterPerformanceReport: KpiQuarterPerformanceReport;
  }>(GET_KPI_QUARTER_PERFORMANCE_REPORT, {
    variables,
    skip: !selectedPeriod?.strategicPeriodId || !isAnnual,
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const report = data?.kpiQuarterPerformanceReport;
  const available = report?.availableFilters;

  const rollupSource = useMemo(
    () => report?.rollups?.slice(0, 20) ?? [],
    [report?.rollups],
  );
  const rollupColumns = useMemo(
    () => [
      {
        id: "entity",
        accessor: (row: KpiQuarterReportRollup) => row.entityName,
      },
      {
        id: "level",
        accessor: (row: KpiQuarterReportRollup) => row.level,
        filterFn: (row: KpiQuarterReportRollup, value: string) =>
          row.level === value,
      },
      {
        id: "kpiCount",
        accessor: (row: KpiQuarterReportRollup) => row.kpiCount,
      },
      {
        id: "achievement",
        accessor: (row: KpiQuarterReportRollup) => weightedAchievement(row),
      },
      {
        id: "contribution",
        accessor: (row: KpiQuarterReportRollup) => row.annualContribution,
      },
      {
        id: "coverage",
        accessor: (row: KpiQuarterReportRollup) => row.resultCoverageRate,
      },
    ],
    [],
  );
  const { processedRows: processedRollups, getHeaderProps: getRollupHeaderProps } =
    useTableColumnControls({
      rows: rollupSource,
      columns: rollupColumns,
    });

  const resultRows = useMemo(() => report?.rows ?? [], [report?.rows]);
  const resultColumns = useMemo(
    () => [
      {
        id: "kpi",
        accessor: (row: KpiQuarterReportRow) => row.kpiName,
      },
      {
        id: "quarter",
        accessor: (row: KpiQuarterReportRow) => row.quarterNumber,
        filterFn: (row: KpiQuarterReportRow, value: string) =>
          String(row.quarterNumber) === value,
      },
      {
        id: "mode",
        accessor: (row: KpiQuarterReportRow) => row.kpiMode,
        filterFn: (row: KpiQuarterReportRow, value: string) =>
          row.kpiMode === value,
      },
      {
        id: "original",
        accessor: (row: KpiQuarterReportRow) => row.originalTarget,
      },
      {
        id: "carryIn",
        accessor: (row: KpiQuarterReportRow) => row.carryIn,
      },
      {
        id: "effective",
        accessor: (row: KpiQuarterReportRow) => row.effectiveTarget,
      },
      {
        id: "actual",
        accessor: (row: KpiQuarterReportRow) => row.actual,
      },
      {
        id: "achievement",
        accessor: (row: KpiQuarterReportRow) => row.achievementRate,
      },
      {
        id: "contribution",
        accessor: (row: KpiQuarterReportRow) => row.annualContribution,
      },
      {
        id: "carryOut",
        accessor: (row: KpiQuarterReportRow) => row.carryOut,
      },
      {
        id: "status",
        accessor: (row: KpiQuarterReportRow) =>
          row.isNotDue ? "Not due this quarter" : row.resultStatus ?? row.planStatus ?? "",
        filterFn: (row: KpiQuarterReportRow, value: string) =>
          (row.isNotDue ? "Not due this quarter" : row.resultStatus ?? row.planStatus ?? "") === value,
      },
    ],
    [],
  );
  const { processedRows: processedResults, getHeaderProps: getResultHeaderProps } =
    useTableColumnControls({
      rows: resultRows,
      columns: resultColumns,
    });

  const selectedDivisionIds = useMemo(() => {
    if (!available || filters.divisionId === ALL) return null;
    const ids = new Set([filters.divisionId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const division of available.divisions) {
        if (
          division.parentId &&
          ids.has(division.parentId) &&
          !ids.has(division.id)
        ) {
          ids.add(division.id);
          changed = true;
        }
      }
    }
    return ids;
  }, [available, filters.divisionId]);
  const departments = useMemo(() => {
    if (!available) return [];
    if (!selectedDivisionIds) return available.departments;
    return available.departments.filter(
      (department) =>
        !!department.parentId && selectedDivisionIds.has(department.parentId),
    );
  }, [available, selectedDivisionIds]);
  const employees = useMemo(() => {
    if (!available) return [];
    if (filters.departmentId !== ALL) {
      return available.employees.filter((employee) =>
        employee.parentIds.includes(filters.departmentId),
      );
    }
    if (selectedDivisionIds) {
      const departmentIds = new Set(
        available.departments
          .filter(
            (department) =>
              !!department.parentId &&
              selectedDivisionIds.has(department.parentId),
          )
          .map((department) => department.id),
      );
      return available.employees.filter((employee) =>
        employee.parentIds.some((id) => departmentIds.has(id)),
      );
    }
    return available.employees;
  }, [available, filters.departmentId, selectedDivisionIds]);

  const updateFilter = <K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const handleDivisionChange = (divisionId: string) => {
    setFilters((current) => ({
      ...current,
      divisionId,
      departmentId: ALL,
      employeeId: ALL,
    }));
    setPage(1);
  };

  const handleDepartmentChange = (departmentId: string) => {
    setFilters((current) => ({
      ...current,
      departmentId,
      employeeId: ALL,
    }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const drillIntoRollup = (level: ScorecardLevel, entityId: string) => {
    if (level === "DIVISION") handleDivisionChange(entityId);
    if (level === "DEPARTMENT") handleDepartmentChange(entityId);
    if (level === "INDIVIDUAL") {
      setFilters((current) => ({
        ...current,
        divisionId: ALL,
        departmentId: ALL,
        employeeId: entityId,
      }));
      setPage(1);
    }
  };

  const exportRows = () => {
    if (!report) return;
    const rows = report.rows.map((row) => ({
      period: report.annualStrategicPeriodName,
      quarter: `Q${row.quarterNumber}`,
      level: row.level,
      entity: row.entityName,
      division: row.divisionName ?? "",
      department: row.departmentName ?? "",
      employee: row.employeeName ?? "",
      kpi: row.kpiName,
      mode: row.kpiMode,
      planStatus: row.planStatus,
      resultStatus: row.isNotDue ? "NOT_DUE" : row.resultStatus ?? "NOT_CALCULATED",
      originalTarget: row.originalTarget,
      carryIn: row.carryIn,
      effectiveTarget: row.effectiveTarget,
      approvedActual: row.actual ?? "",
      achievementPercent:
        row.achievementRate == null ? "" : row.achievementRate * 100,
      annualContribution: row.annualContribution ?? "",
      carryOut: row.carryOut ?? "",
    }));
    exportReport(rows, "quarterly-kpi-performance", "csv");
    toast.success("Quarterly performance report exported");
  };

  if (!selectedPeriod) {
    return (
      <ReportMessage
        title="Select an annual strategic period"
        message="Choose the annual period from the dashboard selector to load quarterly performance."
      />
    );
  }

  if (!isAnnual) {
    return (
      <ReportMessage
        title="An annual period is required"
        message={`“${selectedPeriod.name}” is not annual. Select its annual parent period to compare Q1–Q4.`}
      />
    );
  }

  if (error) {
    return (
      <ReportMessage
        title="Quarterly report could not be loaded"
        message={error.message}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-2xl">
              Quarterly KPI Performance
            </h2>
            {report && (
              <Badge
                variant="outline"
                className="rounded-full border-indigo-200/80 bg-indigo-50/80 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                {scopeLabel(report.scope)}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
            Approved logbook achievement, quarterly carry, and annual contribution for{" "}
            <span className="font-semibold text-slate-700 dark:text-zinc-300">
              {selectedPeriod.name}
            </span>.
          </p>
        </div>
        {can("reports:export") && (
          <Button
            variant="outline"
            onClick={exportRows}
            disabled={!report?.rows.length}
            className="rounded-xl border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:bg-slate-50 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80"
          >
            <Download className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Export current view
          </Button>
        )}
      </div>

      {/* Advanced Filter Suite */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-zinc-900/90 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Report Filters & Drilldown
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Available organization filters are already constrained to your secure scope.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FilterX className="mr-1.5 h-3.5 w-3.5" />
            Reset all filters
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search by KPI name..."
              maxLength={100}
              className="h-10 rounded-xl border-slate-200/80 bg-white/90 pl-10 text-xs shadow-xs transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/90"
            />
          </div>
          <FilterSelect
            value={filters.quarter}
            onChange={(value) => updateFilter("quarter", value)}
            placeholder="Quarter"
            options={[
              [ALL, "All quarters"],
              ["1", "Q1 Period"],
              ["2", "Q2 Period"],
              ["3", "Q3 Period"],
              ["4", "Q4 Period"],
            ]}
          />
          <FilterSelect
            value={filters.level}
            onChange={(value) => updateFilter("level", value)}
            placeholder="Level"
            options={[
              [ALL, "All levels"],
              ["CORPORATE", "Corporate"],
              ["DIVISION", "Division"],
              ["DEPARTMENT", "Department"],
              ["INDIVIDUAL", "Employee"],
            ]}
          />
          {!!available?.divisions.length && (
            <FilterSelect
              value={filters.divisionId}
              onChange={handleDivisionChange}
              placeholder="Division"
              options={[
                [ALL, "All divisions"],
                ...available.divisions.map(
                  (division) =>
                    [division.id, division.name] as [string, string],
                ),
              ]}
            />
          )}
          {!!departments.length && (
            <FilterSelect
              value={filters.departmentId}
              onChange={handleDepartmentChange}
              placeholder="Department"
              options={[
                [ALL, "All departments"],
                ...departments.map(
                  (department) =>
                    [department.id, department.name] as [string, string],
                ),
              ]}
            />
          )}
          {!!employees.length && (
            <FilterSelect
              value={filters.employeeId}
              onChange={(value) => updateFilter("employeeId", value)}
              placeholder="Employee"
              options={[
                [ALL, "All employees"],
                ...employees.map(
                  (employee) =>
                    [employee.id, employee.name] as [string, string],
                ),
              ]}
            />
          )}
          <FilterSelect
            value={filters.kpiMode}
            onChange={(value) => updateFilter("kpiMode", value)}
            placeholder="KPI mode"
            options={[
              [ALL, "All modes"],
              ["DIRECT", "Direct"],
              ["AGGREGATED", "Aggregated"],
              ["HYBRID", "Hybrid"],
            ]}
          />
          <FilterSelect
            value={filters.planStatus}
            onChange={(value) => updateFilter("planStatus", value)}
            placeholder="Plan status"
            options={[
              [ALL, "All plan statuses"],
              ["DRAFT", "Draft"],
              ["PENDING", "Pending"],
              ["APPROVED", "Approved"],
              ["REJECTED", "Rejected"],
              ["LOCKED", "Locked"],
            ]}
          />
          <FilterSelect
            value={filters.resultStatus}
            onChange={(value) => updateFilter("resultStatus", value)}
            placeholder="Result status"
            options={[
              [ALL, "All result statuses"],
              ["PROVISIONAL", "Provisional"],
              ["FINAL", "Final"],
            ]}
          />
        </div>
      </Card>

      {loading && !report ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 py-16 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : report ? (
        <>
          {/* Summary Metric Pulse Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="KPIs reported"
              value={String(report.summary.kpiCount)}
              description={`${report.summary.rowCount} quarter records evaluated`}
              icon={<Target className="h-5 w-5" />}
              accent="#4f46e5"
            />
            <SummaryCard
              label={
                filters.quarter === ALL
                  ? "Annual weighted achievement"
                  : `Q${filters.quarter} weighted achievement`
              }
              value={formatWeightedAchievement(report.summary)}
              description={`${formatNumber(report.summary.achievedContributionWeight)} of ${formatNumber(report.summary.plannedContributionWeight)} planned score weight`}
              icon={<TrendingUp className="h-5 w-5" />}
              accent="#10b981"
            />
            <SummaryCard
              label="Annual contribution"
              value={formatContribution(report.summary)}
              description="Earned annual score weight in this view"
              icon={<BarChart3 className="h-5 w-5" />}
              accent="#f59e0b"
            />
            <SummaryCard
              label="Result status"
              value={`${report.summary.finalCount} final`}
              description={`${report.summary.provisionalCount} provisional · ${report.summary.pendingResultCount} pending${report.summary.notDueCount ? ` · ${report.summary.notDueCount} not due` : ""}`}
              icon={<BarChart3 className="h-5 w-5" />}
              accent="#8b5cf6"
            />
          </div>

          {/* Contextual Metric Banner */}
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 p-4 text-xs text-slate-600 shadow-xs dark:border-white/[0.06] dark:from-zinc-900/70 dark:via-indigo-950/20 dark:to-zinc-900/70 dark:text-zinc-400">
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Weighted achievement</span> is earned score weight divided by planned score weight. Pending KPIs remain in the plan; “—” means no calculated result, while 0% is a measured zero. Approved unscheduled additive quarters are marked “Not due this quarter” and excluded from coverage and scheduled score weight.
              {filters.quarter === ALL
                ? " The annual card includes all four quarters, including future quarters. Compare a quarter card with the dashboard for the same quarter and KPI scope."
                : " Compare with the dashboard using the same quarter and KPI scope."}
            </p>
            <p className="mt-1.5 font-medium text-slate-700 dark:text-zinc-300">
              Reported-result average (unweighted):{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {hasCalculatedResults(report.summary)
                  ? formatPercent(report.summary.averageAchievementRate)
                  : "—"}
              </span>{" "}
              (excludes pending results).
            </p>
          </div>

          {/* Quarter Milestone Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {report.quarterSummaries.map((quarter) => {
              const isSelected = filters.quarter === String(quarter.quarterNumber);
              return (
                <button
                  type="button"
                  key={quarter.quarterNumber}
                  aria-label={`View Q${quarter.quarterNumber} performance`}
                  aria-pressed={isSelected}
                  className="rounded-2xl text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  onClick={() =>
                    updateFilter("quarter", String(quarter.quarterNumber))
                  }
                >
                  <Card
                    className={`relative overflow-hidden rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? "border-indigo-500/80 bg-gradient-to-b from-indigo-50/90 via-white to-violet-50/40 ring-2 ring-indigo-500/30 dark:border-indigo-400/80 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900"
                        : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-white/[0.08] dark:bg-zinc-900/90"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          Q{quarter.quarterNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          Quarter {quarter.quarterNumber}
                        </span>
                      </div>
                      <Badge
                        variant={quarter.finalCount > 0 ? "default" : "secondary"}
                        className="rounded-full text-[10px] font-semibold"
                      >
                        {quarter.rowCount > 0 && quarter.notDueCount === quarter.rowCount
                          ? "Not due"
                          : `${quarter.finalCount}/${quarter.rowCount - (quarter.notDueCount ?? 0)} final`}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-baseline justify-between">
                        <span className="font-medium text-slate-500 dark:text-zinc-400">
                          Weighted achievement
                        </span>
                        <span className="font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
                          {formatWeightedAchievement(quarter)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-medium text-slate-500 dark:text-zinc-400">
                          Annual contribution
                        </span>
                        <span className="font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                          {formatContribution(quarter)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                        <span className="font-medium text-slate-400 dark:text-zinc-500">
                          Result coverage
                        </span>
                        <span className="font-semibold tabular-nums text-slate-600 dark:text-zinc-300">
                          {formatPercent(quarter.resultCoverageRate)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>

          {report.rollups.length > 1 && (
            <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Performance Rollups
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                    Select a division, department, or employee to drill down into that secure scope.
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold">
                  {report.rollups.length} Entities
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <Table stickyFirstColumn className="[&_th]:bg-slate-50/70 [&_th]:dark:bg-zinc-800/70">
                  <TableHeader>
                    <TableRow className="border-b border-slate-200/80 dark:border-zinc-800">
                      <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                        <SortableFilterableHeader
                          label="Entity"
                          {...getRollupHeaderProps("entity")}
                        />
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                        <SortableFilterableHeader
                          label="Level"
                          filterType="select"
                          filterOptions={[
                            { value: "CORPORATE", label: "Corporate" },
                            { value: "DIVISION", label: "Division" },
                            { value: "DEPARTMENT", label: "Department" },
                            { value: "INDIVIDUAL", label: "Individual" },
                          ]}
                          {...getRollupHeaderProps("level")}
                        />
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                        <SortableFilterableHeader
                          label="KPIs"
                          align="right"
                          filterable={false}
                          {...getRollupHeaderProps("kpiCount")}
                        />
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                        <SortableFilterableHeader
                          label="Weighted achievement"
                          align="right"
                          filterable={false}
                          {...getRollupHeaderProps("achievement")}
                        />
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                        <SortableFilterableHeader
                          label="Contribution"
                          align="right"
                          filterable={false}
                          {...getRollupHeaderProps("contribution")}
                        />
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                        <SortableFilterableHeader
                          label="Result coverage"
                          align="right"
                          filterable={false}
                          {...getRollupHeaderProps("coverage")}
                        />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRollups.map((rollup) => (
                      <TableRow
                        key={`${rollup.level}-${rollup.entityId}`}
                        className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 ${
                          rollup.level === "CORPORATE"
                            ? undefined
                            : "cursor-pointer"
                        }`}
                        onClick={() =>
                          rollup.level !== "CORPORATE" &&
                          drillIntoRollup(rollup.level, rollup.entityId)
                        }
                      >
                        <TableCell className="font-semibold text-slate-900 dark:text-zinc-100">
                          {rollup.entityName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full text-[11px] font-semibold">
                            {levelLabel(rollup.level)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-slate-700 dark:text-zinc-300">
                          {rollup.kpiCount}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                          {formatWeightedAchievement(rollup)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                          {formatContribution(rollup)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-slate-600 dark:text-zinc-400">
                          {formatPercent(rollup.resultCoverageRate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {report.rollups.length > 20 && (
                <div className="border-t border-slate-100 p-4 text-xs font-medium text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
                  Showing the first 20 rollups. Use the organization filters above to narrow the report view.
                </div>
              )}
            </Card>
          )}

          <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6 dark:border-zinc-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-zinc-100">
                  Quarterly KPI Scorecard Results
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Targets and carry values are shown per KPI. Click any record row for full mathematical formula audit.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-800">
                  {report.totalItems} total records
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table stickyFirstColumn className="[&_th]:bg-slate-50/70 [&_th]:dark:bg-zinc-800/70">
                <TableHeader>
                  <TableRow className="border-b border-slate-200/80 dark:border-zinc-800">
                    <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="KPI / Owner"
                        {...getResultHeaderProps("kpi")}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Quarter"
                        filterType="select"
                        filterOptions={[
                          { value: "1", label: "Q1" },
                          { value: "2", label: "Q2" },
                          { value: "3", label: "Q3" },
                          { value: "4", label: "Q4" },
                        ]}
                        {...getResultHeaderProps("quarter")}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Mode"
                        filterType="select"
                        filterOptions={[
                          { value: "AGGREGATED", label: "Aggregated" },
                          { value: "DIRECT", label: "Direct" },
                          { value: "HYBRID", label: "Hybrid" },
                        ]}
                        {...getResultHeaderProps("mode")}
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Original"
                        align="right"
                        filterable={false}
                        {...getResultHeaderProps("original")}
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Carry in"
                        align="right"
                        filterable={false}
                        {...getResultHeaderProps("carryIn")}
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Effective"
                        align="right"
                        filterable={false}
                        {...getResultHeaderProps("effective")}
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Actual"
                        align="right"
                        filterable={false}
                        {...getResultHeaderProps("actual")}
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Achievement"
                        align="right"
                        filterable={false}
                        {...getResultHeaderProps("achievement")}
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Contribution"
                        align="right"
                        filterable={false}
                        {...getResultHeaderProps("contribution")}
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Carry out"
                        align="right"
                        filterable={false}
                        {...getResultHeaderProps("carryOut")}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                      <SortableFilterableHeader
                        label="Status"
                        {...getResultHeaderProps("status")}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center text-sm font-medium text-slate-400">
                        No quarterly KPI records match the current filter criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedResults.map((row) => (
                      <TableRow
                        key={row.kpiQuarterPlanId}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/50"
                        onClick={() => setSelectedRow(row)}
                      >
                        <TableCell className="min-w-64">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                            {row.kpiName}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                            {row.entityName} · {levelLabel(row.level)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Q{row.quarterNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full text-[10px] font-semibold">
                            {modeLabel(row.kpiMode)}
                          </Badge>
                        </TableCell>
                        <MetricCell row={row} value={row.originalTarget} />
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${carryClass(row.carryIn)}`}
                        >
                          {formatSigned(row.carryIn)}
                        </TableCell>
                        <MetricCell row={row} value={row.effectiveTarget} />
                        <MetricCell row={row} value={row.actual} />
                        <TableCell className="text-right font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
                          {row.achievementRate == null
                            ? "—"
                            : formatPercent(row.achievementRate)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                          {row.annualContribution == null
                            ? "—"
                            : `${formatNumber(row.annualContribution)}%`}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${carryClass(row.carryOut)}`}
                        >
                          {row.carryOut == null
                            ? "—"
                            : formatSigned(row.carryOut)}
                        </TableCell>
                        <TableCell>
                          <ResultStatus row={row} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 p-4 text-xs font-semibold sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400">
                Page {report.currentPage} of {Math.max(1, report.totalPages)}{" "}
                · {report.totalItems} records evaluated
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={report.currentPage <= 1 || loading}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  className="rounded-xl border-slate-200 text-xs font-bold transition-all hover:bg-slate-50 dark:border-zinc-800"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
                </Button>
                <span className="px-2 font-bold text-slate-700 dark:text-zinc-300">
                  {report.currentPage} / {Math.max(1, report.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    report.currentPage >= report.totalPages || loading
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-xl border-slate-200 text-xs font-bold transition-all hover:bg-slate-50 dark:border-zinc-800"
                >
                  Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      <QuarterDetailDialog
        row={selectedRow}
        onOpenChange={(open) => !open && setSelectedRow(null)}
      />
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/80 px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        {options.map(([optionValue, label]) => (
          <SelectItem
            key={optionValue}
            value={optionValue}
            className="rounded-lg text-xs font-medium focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-950/40 dark:focus:text-indigo-400"
          >
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-white/[0.08] dark:bg-zinc-900/90">
      {accent && (
        <div
          className="absolute top-0 inset-x-0 h-1 transition-all duration-300 group-hover:h-1.5"
          style={{
            background: `linear-gradient(90deg, ${accent}, transparent 80%)`,
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-zinc-400">
          {label}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: accent ? `${accent}18` : undefined,
            color: accent || undefined,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-zinc-100">
          {value}
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </Card>
  );
}

function MetricCell({
  row,
  value,
}: {
  row: KpiQuarterReportRow;
  value?: number | null;
}) {
  return (
    <TableCell className="text-right font-semibold tabular-nums text-slate-700 dark:text-zinc-300">
      {value == null ? "—" : formatMetric(value, row)}
    </TableCell>
  );
}

function ResultStatus({ row }: { row: KpiQuarterReportRow }) {
  if (row.isNotDue) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        Not due this quarter
      </span>
    );
  }
  if (row.resultStatus === "FINAL") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Final
      </span>
    );
  }
  if (row.resultStatus === "PROVISIONAL") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Provisional
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
      {row.planStatus}
    </span>
  );
}

function QuarterDetailDialog({
  row,
  onOpenChange,
}: {
  row: KpiQuarterReportRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-7 dark:border-white/[0.08] dark:bg-zinc-900/95">
        <DialogHeader className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              Q{row.quarterNumber} Milestone
            </span>
            <Badge variant="outline" className="rounded-full text-[11px] font-semibold">
              {levelLabel(row.level)}
            </Badge>
            <Badge variant="secondary" className="rounded-full text-[11px] font-semibold">
              {modeLabel(row.kpiMode)}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {row.kpiName}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {row.entityName} · Objective: {row.objectiveTitle || "Not specified"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailCard
            label="Annual target"
            value={formatMetric(row.annualTarget, row)}
          />
          <DetailCard
            label="KPI weight"
            value={`${formatNumber(row.weight)}%`}
          />
          <DetailCard
            label="Original quarter target"
            value={formatMetric(row.originalTarget, row)}
          />
          <DetailCard label="Carry in" value={formatSigned(row.carryIn)} />
          <DetailCard
            label="Effective target"
            value={formatMetric(row.effectiveTarget, row)}
          />
          <DetailCard
            label="Approved actual"
            value={row.actual == null ? "—" : formatMetric(row.actual, row)}
          />
          <DetailCard
            label="Achievement rate"
            value={
              row.achievementRate == null
                ? "—"
                : formatPercent(row.achievementRate)
            }
          />
          <DetailCard
            label="Annual contribution"
            value={
              row.annualContribution == null
                ? "—"
                : `${formatNumber(row.annualContribution)}%`
            }
          />
          <DetailCard
            label={
              row.resultStatus === "FINAL"
                ? "Applied carry out"
                : "Projected carry out"
            }
            value={row.carryOut == null ? "—" : formatSigned(row.carryOut)}
          />
          <DetailCard
            label="Result status"
            value={row.isNotDue ? "Not due this quarter" : row.resultStatus ?? "Not calculated"}
          />
        </div>

        {row.achievementRateExact && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Exact Achievement Scoring Precision
            </h4>
            <div className="mt-2.5 space-y-2">
              <div className="rounded-xl border border-slate-200/60 bg-white/90 p-2.5 font-mono text-xs text-slate-800 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200">
                <span className="text-slate-400 dark:text-zinc-500">Achievement rate: </span>
                {row.achievementRateExact}
              </div>
              {row.annualContributionExact && (
                <div className="rounded-xl border border-slate-200/60 bg-white/90 p-2.5 font-mono text-xs text-slate-800 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200">
                  <span className="text-slate-400 dark:text-zinc-500">Weighted contribution: </span>
                  {row.annualContributionExact}
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
              Exact fractions are calculated before the decimal display boundary. Target ranges include both minimum and maximum values.
            </p>
          </div>
        )}

        {row.formulaCalculationStatus && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950/60 dark:bg-indigo-950/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              Local Formula Execution Snapshot
            </h4>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-indigo-100 bg-white/80 p-2.5 dark:border-indigo-900/50 dark:bg-zinc-900/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Numerator</div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  {row.formulaNumeratorDecimal ?? "Not calculable"}
                </div>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white/80 p-2.5 dark:border-indigo-900/50 dark:bg-zinc-900/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Denominator</div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  {row.formulaDenominatorDecimal ?? "Not calculable"}
                </div>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white/80 p-2.5 dark:border-indigo-900/50 dark:bg-zinc-900/80">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Evaluated Result</div>
                <div className="mt-0.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {row.formulaResultDecimal ?? "Not calculable"}
                </div>
              </div>
            </div>
            <div className="mt-2.5 rounded-xl border border-indigo-100 bg-white/80 p-2.5 font-mono text-xs text-slate-800 shadow-2xs dark:border-indigo-900/50 dark:bg-zinc-900/80 dark:text-zinc-200">
              {row.formulaNumeratorExact ?? "—"} ÷ {row.formulaDenominatorExact ?? "—"} = {row.formulaResultExact ?? "—"}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
              Status: <span className="font-semibold text-slate-700 dark:text-zinc-300">{row.formulaCalculationStatus.replaceAll("_", " ")}</span> · Snapshot version {row.formulaCalculationVersion ?? "—"}. Components and weights are unrounded before persistence.
            </p>
          </div>
        )}

        {row.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Numerator / Denominator Component Rollup
            </h4>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs text-slate-400 dark:text-zinc-500">Basis KPI: </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  {row.weightingBasisKpiName || "Not configured"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-zinc-500">Stored result: </span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {row.finalActualDecimal ??
                    row.aggregateActualExact ??
                    "Not calculated"}
                </span>
              </div>
            </div>
            {row.aggregationNumeratorExact && row.aggregationDenominatorExact && (
              <div className="mt-2.5 rounded-xl border border-slate-200/60 bg-white/90 p-2.5 font-mono text-xs text-slate-800 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200">
                Weighted components: {row.aggregationNumeratorExact} ÷ {row.aggregationDenominatorExact}
                {row.finalActualExact ? ` · Final exact value: ${row.finalActualExact}` : ""}
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
              Child numerators and denominators are summed before the rate is calculated. Child rates are never averaged.
            </p>
          </div>
        )}

        {row.kpiMode === "HYBRID" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Hybrid Component Matrix
            </h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ComponentBreakdown
                title="Manager / Direct Contribution"
                target={row.managerEffectiveTarget}
                actual={row.directActual}
                rate={row.directAchievementRate}
                carry={row.managerCarryOut}
              />
              <ComponentBreakdown
                title="Team / Aggregate Contribution"
                target={row.teamEffectiveTarget}
                actual={row.aggregateActual}
                rate={row.aggregateAchievementRate}
                carry={row.teamCarryOut}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50">
      <div className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold tabular-nums text-slate-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

function ComponentBreakdown({
  title,
  target,
  actual,
  rate,
  carry,
}: {
  title: string;
  target?: number | null;
  actual?: number | null;
  rate?: number | null;
  carry?: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">{title}</div>
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between text-slate-500 dark:text-zinc-400">
          <span>Target:</span>
          <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-300">
            {target == null ? "—" : formatNumber(target)}
          </span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-zinc-400">
          <span>Actual:</span>
          <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-300">
            {actual == null ? "—" : formatNumber(actual)}
          </span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-zinc-400">
          <span>Achievement:</span>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {rate == null ? "—" : formatPercent(rate)}
          </span>
        </div>
        <div className="flex justify-between text-slate-500 dark:text-zinc-400">
          <span>Carry:</span>
          <span className={`font-semibold tabular-nums ${carryClass(carry)}`}>
            {carry == null ? "—" : formatSigned(carry)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ReportMessage({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs dark:border-white/[0.08] dark:bg-zinc-900/90">
      <CardHeader className="p-0">
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">{title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{message}</CardDescription>
      </CardHeader>
      {action && <CardContent className="p-0 pt-4">{action}</CardContent>}
    </Card>
  );
}

function formatMetric(value: number, row: KpiQuarterReportRow): string {
  const suffix =
    row.customUnitLabel ||
    (row.unitType === "PERCENT" || row.measurementUnit === "PERCENTAGE"
      ? "%"
      : "");
  return `${formatNumber(value)}${suffix ? ` ${suffix}` : ""}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatPercent(rate: number): string {
  return `${formatNumber(Number(rate) * 100)}%`;
}

function hasCalculatedResults(summary: KpiQuarterReportSummary): boolean {
  return summary.finalCount + summary.provisionalCount > 0;
}

function weightedAchievement(summary: KpiQuarterReportSummary): number | null {
  if (!hasCalculatedResults(summary) || summary.plannedContributionWeight <= 0) {
    return null;
  }
  // Share the dashboard calculation. Do not average row percentages or use
  // paginated rows: pending plans must remain in the weighted denominator.
  return summaryAchievement(summary);
}

function formatWeightedAchievement(summary: KpiQuarterReportSummary): string {
  const value = weightedAchievement(summary);
  return value == null ? "—" : `${formatNumber(value)}%`;
}

function formatContribution(summary: KpiQuarterReportSummary): string {
  return hasCalculatedResults(summary)
    ? `${formatNumber(summary.achievedContributionWeight)}%`
    : "—";
}

function formatSigned(value: number): string {
  const number = Number(value);
  if (number === 0) return "0";
  return `${number > 0 ? "+" : ""}${formatNumber(number)}`;
}

function carryClass(value?: number | null): string {
  if (value == null || Number(value) === 0) return "text-muted-foreground";
  return Number(value) < 0 ? "text-emerald-600" : "text-amber-600";
}

function scopeLabel(scope: KpiQuarterPerformanceReport["scope"]): string {
  if (scope === "ORGANIZATION") return "Organization scope";
  if (scope === "DIVISION") return "Division scope";
  if (scope === "DEPARTMENT") return "Department scope";
  return "Personal scope";
}

function levelLabel(level: ScorecardLevel): string {
  if (level === "INDIVIDUAL") return "Employee";
  return level.charAt(0) + level.slice(1).toLowerCase();
}

function modeLabel(mode: KpiMode): string {
  if (mode === "AGGREGATED") return "Aggregated";
  if (mode === "HYBRID") return "Hybrid";
  return "Direct";
}
