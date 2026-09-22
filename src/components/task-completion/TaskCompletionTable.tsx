"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { TaskCompletionStatusBadge } from "./TaskCompletionStatusBadge";
import type {
  TaskCompletionAnalyticsResult,
  TaskCompletionAvailableFilters,
  TaskCompletionAnalyticsRow,
  TaskCompletionView,
} from "./types";

interface TaskCompletionTableProps {
  result?: TaskCompletionAnalyticsResult;
  view: TaskCompletionView;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function TaskCompletionTable({
  result,
  view,
  loading,
  onPageChange,
}: TaskCompletionTableProps) {
  const rows = result?.rows ?? [];
  const pageInfo = result?.pageInfo;
  const periodLabel = result?.summary.periodType.toLowerCase() ?? "period";

  const columns = useMemo(() => {
    const defs = [
      {
        id: "period",
        accessor: (row: TaskCompletionAnalyticsRow) => row.periodStart,
      },
      {
        id: "approved",
        accessor: (row: TaskCompletionAnalyticsRow) => row.totalTasks,
      },
      {
        id: "completed",
        accessor: (row: TaskCompletionAnalyticsRow) => row.completedTasks,
      },
      {
        id: "notDone",
        accessor: (row: TaskCompletionAnalyticsRow) => row.notDoneTasks,
      },
      {
        id: "postponed",
        accessor: (row: TaskCompletionAnalyticsRow) => row.postponedTasks,
      },
      {
        id: "cancelled",
        accessor: (row: TaskCompletionAnalyticsRow) => row.cancelledTasks,
      },
      {
        id: "rate",
        accessor: (row: TaskCompletionAnalyticsRow) => row.completionRate,
      },
      {
        id: "status",
        accessor: (row: TaskCompletionAnalyticsRow) => row.status,
        filterFn: (row: TaskCompletionAnalyticsRow, value: string) =>
          row.status === value,
      },
    ];

    if (view === "team") {
      return [
        {
          id: "employee",
          accessor: (row: TaskCompletionAnalyticsRow) => row.employeeName,
        },
        {
          id: "orgUnits",
          accessor: (row: TaskCompletionAnalyticsRow) =>
            [...row.departmentIds, ...row.divisionIds].join(" "),
        },
        ...defs,
      ];
    }

    return defs;
  }, [view]);

  const { processedRows, getHeaderProps } = useTableColumnControls({
    rows,
    columns,
  });

  if (loading && !result) {
    return <TaskCompletionTableSkeleton />;
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-6">
        <CardTitle>
          {view === "team" ? "Team detail" : "Personal completion trend"}
        </CardTitle>
        <CardDescription>
          {view === "team"
            ? `Individual employee rows grouped by ${periodLabel}. Percentages shown are server-calculated; the summary above is not an average of these rows.`
            : `Your ${periodLabel} official task outcomes for the selected date range.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {view === "team" && (
                <TableHead className="pl-6">
                  <SortableFilterableHeader
                    label="Employee"
                    {...getHeaderProps("employee")}
                  />
                </TableHead>
              )}
              <TableHead className={view === "personal" ? "pl-6" : undefined}>
                <SortableFilterableHeader
                  label="Period"
                  filterable={false}
                  {...getHeaderProps("period")}
                />
              </TableHead>
              {view === "team" && (
                <TableHead>
                  <SortableFilterableHeader
                    label="Organization units"
                    {...getHeaderProps("orgUnits")}
                  />
                </TableHead>
              )}
              <TableHead className="text-right">
                <SortableFilterableHeader
                  label="Approved"
                  align="right"
                  filterable={false}
                  {...getHeaderProps("approved")}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableFilterableHeader
                  label="Completed"
                  align="right"
                  filterable={false}
                  {...getHeaderProps("completed")}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableFilterableHeader
                  label="Not done"
                  align="right"
                  filterable={false}
                  {...getHeaderProps("notDone")}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableFilterableHeader
                  label="Postponed"
                  align="right"
                  filterable={false}
                  {...getHeaderProps("postponed")}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableFilterableHeader
                  label="Cancelled"
                  align="right"
                  filterable={false}
                  {...getHeaderProps("cancelled")}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableFilterableHeader
                  label="Rate"
                  align="right"
                  filterable={false}
                  {...getHeaderProps("rate")}
                />
              </TableHead>
              <TableHead className="pr-6">
                <SortableFilterableHeader
                  label="Status"
                  filterType="select"
                  filterOptions={[
                    { value: "EXCELLENT", label: "Excellent" },
                    { value: "GOOD", label: "Good" },
                    { value: "WATCH", label: "Watch" },
                    { value: "LOW", label: "Low" },
                    { value: "CRITICAL", label: "Critical" },
                    { value: "NO_DATA", label: "No data" },
                  ]}
                  {...getHeaderProps("status")}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={view === "team" ? 10 : 8}
                  className="h-32 px-6 text-center text-muted-foreground"
                >
                  No analytics rows match the selected filters. A no-data status
                  means no official tasks were submitted; it is not a critical
                  result.
                </TableCell>
              </TableRow>
            ) : (
              processedRows.map((row) => (
                <TaskCompletionRow
                  key={`${row.employeeId}-${row.periodStart}-${row.periodEnd}`}
                  row={row}
                  view={view}
                  availableFilters={result?.availableFilters}
                />
              ))
            )}
          </TableBody>
        </Table>

        {pageInfo && (
          <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Page {pageInfo.page.toLocaleString()} of{" "}
              {Math.max(pageInfo.totalPages, 1).toLocaleString()} ·{" "}
              {pageInfo.totalItems.toLocaleString()} rows
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageInfo.page <= 1 || loading}
                onClick={() => onPageChange(pageInfo.page - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  pageInfo.totalPages === 0 ||
                  pageInfo.page >= pageInfo.totalPages ||
                  loading
                }
                onClick={() => onPageChange(pageInfo.page + 1)}
              >
                Next
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskCompletionRow({
  row,
  view,
  availableFilters,
}: {
  row: TaskCompletionAnalyticsRow;
  view: TaskCompletionView;
  availableFilters?: TaskCompletionAvailableFilters;
}) {
  const noData = row.status === "NO_DATA";

  return (
    <TableRow>
      {view === "team" && (
        <TableCell className="max-w-64 pl-6 whitespace-normal">
          <div className="font-medium">{row.employeeName}</div>
          <div className="text-xs text-muted-foreground">
            {row.title || "No title"}
          </div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </TableCell>
      )}
      <TableCell className={view === "personal" ? "pl-6" : undefined}>
        <span className="font-medium">
          {formatCalendarDate(row.periodStart)}
        </span>
        <span className="block text-xs text-muted-foreground">
          to {formatCalendarDate(row.periodEnd)}
        </span>
      </TableCell>
      {view === "team" && (
        <TableCell className="max-w-64 whitespace-normal text-xs text-muted-foreground">
          <ScopeIds
            label="Departments"
            ids={row.departmentIds}
            options={availableFilters?.departments}
          />
          <ScopeIds
            label="Divisions"
            ids={row.divisionIds}
            options={availableFilters?.divisions}
          />
        </TableCell>
      )}
      <NumericCell value={row.totalTasks} />
      <NumericCell value={row.completedTasks} />
      <NumericCell value={row.notDoneTasks} />
      <NumericCell value={row.postponedTasks} />
      <NumericCell value={row.cancelledTasks} />
      <TableCell className="text-right font-medium tabular-nums">
        {noData ? "—" : `${row.completionRate.toFixed(1)}%`}
      </TableCell>
      <TableCell className="pr-6">
        <TaskCompletionStatusBadge status={row.status} />
      </TableCell>
    </TableRow>
  );
}

function NumericCell({ value }: { value: number }) {
  return (
    <TableCell className="text-right tabular-nums">
      {value.toLocaleString()}
    </TableCell>
  );
}

function ScopeIds({
  label,
  ids,
  options,
}: {
  label: string;
  ids: string[];
  options?: { id: string; name: string }[];
}) {
  return (
    <div title={ids.join(", ")}>
      <span className="font-medium text-foreground">{label}:</span>{" "}
      {ids.length > 0
        ? ids
            .map(
              (id) =>
                options?.find((item) => item.id === id)?.name ??
                "Unavailable unit",
            )
            .join(", ")
        : "Not assigned"}
    </div>
  );
}

function formatCalendarDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function TaskCompletionTableSkeleton() {
  return (
    <Card aria-label="Loading task completion analytics">
      <CardHeader>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
