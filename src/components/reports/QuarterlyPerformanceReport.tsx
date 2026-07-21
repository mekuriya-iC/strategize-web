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
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { GET_KPI_QUARTER_PERFORMANCE_REPORT } from "@/lib/graphql/queries/quarterly-performance";
import { exportReport } from "@/lib/utils/exportReport";
import { useStrategicPeriodStore } from "@/stores";
import type {
  KpiMode,
  KpiQuarterPerformanceReport,
  KpiQuarterPlanStatus,
  KpiQuarterReportRow,
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
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const report = data?.kpiQuarterPerformanceReport;
  const available = report?.availableFilters;
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
      resultStatus: row.resultStatus ?? "NOT_CALCULATED",
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Quarterly KPI Performance</h2>
            {report && (
              <Badge variant="outline">{scopeLabel(report.scope)}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved logbook achievement, quarterly carry, and annual
            contribution for {selectedPeriod.name}.
          </p>
        </div>
        {can("reports:export") && (
          <Button
            variant="outline"
            onClick={exportRows}
            disabled={!report?.rows.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export current page
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report filters</CardTitle>
          <CardDescription>
            Available organization filters are already limited by your secure
            reporting scope.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search KPI name"
                maxLength={100}
                className="pl-9"
              />
            </div>
            <FilterSelect
              value={filters.quarter}
              onChange={(value) => updateFilter("quarter", value)}
              placeholder="Quarter"
              options={[
                [ALL, "All quarters"],
                ["1", "Q1"],
                ["2", "Q2"],
                ["3", "Q3"],
                ["4", "Q4"],
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
            <Button variant="ghost" onClick={resetFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !report ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="KPIs reported"
              value={String(report.summary.kpiCount)}
              description={`${report.summary.rowCount} quarter records`}
              icon={<Target className="h-4 w-4" />}
            />
            <SummaryCard
              label="Average achievement"
              value={formatPercent(report.summary.averageAchievementRate)}
              description="Across calculated results"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <SummaryCard
              label="Annual contribution"
              value={`${formatNumber(report.summary.annualContribution)}%`}
              description="Weighted contribution in this view"
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <SummaryCard
              label="Result status"
              value={`${report.summary.finalCount} final`}
              description={`${report.summary.provisionalCount} provisional · ${report.summary.pendingResultCount} pending`}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {report.quarterSummaries.map((quarter) => (
              <button
                type="button"
                key={quarter.quarterNumber}
                className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  updateFilter("quarter", String(quarter.quarterNumber))
                }
              >
                <Card
                  className={
                    filters.quarter === String(quarter.quarterNumber)
                      ? "border-primary"
                      : "transition-colors hover:border-primary/50"
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      Q{quarter.quarterNumber}
                      <Badge
                        variant={
                          quarter.finalCount > 0 ? "default" : "secondary"
                        }
                      >
                        {quarter.finalCount}/{quarter.rowCount} final
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Achievement</span>
                      <span className="font-medium">
                        {formatPercent(quarter.averageAchievementRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Contribution
                      </span>
                      <span className="font-medium">
                        {formatNumber(quarter.annualContribution)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Carry balance
                      </span>
                      <span className={carryClass(quarter.carryOut)}>
                        {formatSigned(quarter.carryOut)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          {report.rollups.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance rollups</CardTitle>
                <CardDescription>
                  Select a division, department, or employee to drill into that
                  secure scope.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">KPIs</TableHead>
                      <TableHead className="text-right">Achievement</TableHead>
                      <TableHead className="text-right">Contribution</TableHead>
                      <TableHead className="text-right">Carry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rollups.slice(0, 20).map((rollup) => (
                      <TableRow
                        key={`${rollup.level}-${rollup.entityId}`}
                        className={
                          rollup.level === "CORPORATE"
                            ? undefined
                            : "cursor-pointer"
                        }
                        onClick={() =>
                          rollup.level !== "CORPORATE" &&
                          drillIntoRollup(rollup.level, rollup.entityId)
                        }
                      >
                        <TableCell className="font-medium">
                          {rollup.entityName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {levelLabel(rollup.level)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {rollup.kpiCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercent(rollup.averageAchievementRate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(rollup.annualContribution)}%
                        </TableCell>
                        <TableCell
                          className={`text-right ${carryClass(rollup.carryOut)}`}
                        >
                          {formatSigned(rollup.carryOut)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {report.rollups.length > 20 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Showing the first 20 rollups. Use the organization filters
                    to narrow the report.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Quarterly results
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Target totals can combine different measurement units. Use each
                KPI row and weighted annual contribution as the authoritative
                performance view.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI / owner</TableHead>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Original</TableHead>
                    <TableHead className="text-right">Carry in</TableHead>
                    <TableHead className="text-right">Effective</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Achievement</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
                    <TableHead className="text-right">Carry out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-28 text-center">
                        No quarterly KPI records match these filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.rows.map((row) => (
                      <TableRow
                        key={row.kpiQuarterPlanId}
                        className="cursor-pointer"
                        onClick={() => setSelectedRow(row)}
                      >
                        <TableCell className="min-w-64">
                          <div className="font-medium">{row.kpiName}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.entityName} · {levelLabel(row.level)}
                          </div>
                        </TableCell>
                        <TableCell>Q{row.quarterNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {modeLabel(row.kpiMode)}
                          </Badge>
                        </TableCell>
                        <MetricCell row={row} value={row.originalTarget} />
                        <TableCell
                          className={`text-right ${carryClass(row.carryIn)}`}
                        >
                          {formatSigned(row.carryIn)}
                        </TableCell>
                        <MetricCell row={row} value={row.effectiveTarget} />
                        <MetricCell row={row} value={row.actual} />
                        <TableCell className="text-right font-medium">
                          {row.achievementRate == null
                            ? "—"
                            : formatPercent(row.achievementRate)}
                        </TableCell>
                        <TableCell className="text-right text-primary">
                          {row.annualContribution == null
                            ? "—"
                            : `${formatNumber(row.annualContribution)}%`}
                        </TableCell>
                        <TableCell
                          className={`text-right ${carryClass(row.carryOut)}`}
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

              <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">
                  Page {report.currentPage} of {Math.max(1, report.totalPages)}{" "}
                  · {report.totalItems} records
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={report.currentPage <= 1 || loading}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      report.currentPage >= report.totalPages || loading
                    }
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
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
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, label]) => (
          <SelectItem key={optionValue} value={optionValue}>
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
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {label}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
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
    <TableCell className="text-right">
      {value == null ? "—" : formatMetric(value, row)}
    </TableCell>
  );
}

function ResultStatus({ row }: { row: KpiQuarterReportRow }) {
  if (row.resultStatus === "FINAL") return <Badge>Final</Badge>;
  if (row.resultStatus === "PROVISIONAL") {
    return <Badge variant="secondary">Provisional</Badge>;
  }
  return <Badge variant="outline">{row.planStatus}</Badge>;
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {row.kpiName} · Q{row.quarterNumber}
          </DialogTitle>
          <DialogDescription>
            {row.entityName} · {levelLabel(row.level)} ·{" "}
            {modeLabel(row.kpiMode)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
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
            label="Achievement"
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
            value={row.resultStatus ?? "Not calculated"}
          />
        </div>
        {row.achievementRateExact && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Exact achievement scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="break-all rounded-md bg-muted/40 p-2 font-mono text-xs">
                Achievement rate: {row.achievementRateExact}
              </p>
              {row.annualContributionExact && (
                <p className="break-all rounded-md bg-muted/40 p-2 font-mono text-xs">
                  Weighted contribution: {row.annualContributionExact}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Exact fractions are calculated before the decimal display boundary.
                Target ranges include both minimum and maximum values.
              </p>
            </CardContent>
          </Card>
        )}
        {row.formulaCalculationStatus && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Exact local formula calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Numerator: </span>
                  <span className="font-mono font-medium">
                    {row.formulaNumeratorDecimal ?? "Not calculable"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Denominator: </span>
                  <span className="font-mono font-medium">
                    {row.formulaDenominatorDecimal ?? "Not calculable"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Result: </span>
                  <span className="font-mono font-medium">
                    {row.formulaResultDecimal ?? "Not calculable"}
                  </span>
                </div>
              </div>
              <p className="break-all rounded-md bg-muted/40 p-2 font-mono text-xs">
                {row.formulaNumeratorExact ?? "—"} ÷{" "}
                {row.formulaDenominatorExact ?? "—"} ={" "}
                {row.formulaResultExact ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Status: {row.formulaCalculationStatus.replaceAll("_", " ")} ·
                Snapshot version {row.formulaCalculationVersion ?? "—"}. Formula
                components and hierarchy weights are not rounded before
                persistence.
              </p>
            </CardContent>
          </Card>
        )}
        {row.aggregationMethod === "DENOMINATOR_WEIGHTED_AVERAGE" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Denominator-weighted calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Basis KPI: </span>
                  <span className="font-medium">
                    {row.weightingBasisKpiName || "Not configured"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stored result: </span>
                  <span className="font-mono font-medium">
                    {row.finalActualDecimal ??
                      row.aggregateActualExact ??
                      "Not calculated"}
                  </span>
                </div>
              </div>
              {row.aggregationNumeratorExact &&
                row.aggregationDenominatorExact && (
                  <p className="break-all rounded-md bg-muted/40 p-2 font-mono text-xs">
                    Weighted components: {row.aggregationNumeratorExact} ÷{" "}
                    {row.aggregationDenominatorExact}
                    {row.finalActualExact
                      ? ` · Final exact value: ${row.finalActualExact}`
                      : ""}
                  </p>
                )}
              <p className="text-xs text-muted-foreground">
                Child percentages are multiplied by their full basis values. No
                child weight is rounded before aggregation.
              </p>
            </CardContent>
          </Card>
        )}
        {row.kpiMode === "HYBRID" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hybrid components</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <ComponentBreakdown
                title="Manager / direct"
                target={row.managerEffectiveTarget}
                actual={row.directActual}
                rate={row.directAchievementRate}
                carry={row.managerCarryOut}
              />
              <ComponentBreakdown
                title="Team / aggregate"
                target={row.teamEffectiveTarget}
                actual={row.aggregateActual}
                rate={row.aggregateAchievementRate}
                carry={row.teamCarryOut}
              />
            </CardContent>
          </Card>
        )}
        {row.objectiveTitle && (
          <p className="text-sm text-muted-foreground">
            Objective: {row.objectiveTitle}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
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
    <div className="space-y-1 rounded-lg bg-muted/40 p-3">
      <div className="font-medium">{title}</div>
      <div>Target: {target == null ? "—" : formatNumber(target)}</div>
      <div>Actual: {actual == null ? "—" : formatNumber(actual)}</div>
      <div>Achievement: {rate == null ? "—" : formatPercent(rate)}</div>
      <div>Carry: {carry == null ? "—" : formatSigned(carry)}</div>
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {action && <CardContent>{action}</CardContent>}
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
