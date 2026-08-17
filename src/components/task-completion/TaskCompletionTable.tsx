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
import { TaskCompletionStatusBadge } from "./TaskCompletionStatusBadge";
import type {
  TaskCompletionAnalyticsResult,
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
  if (loading && !result) {
    return <TaskCompletionTableSkeleton />;
  }

  const rows = result?.rows ?? [];
  const pageInfo = result?.pageInfo;
  const periodLabel = result?.summary.periodType.toLowerCase() ?? "period";

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
              {view === "team" && <TableHead className="pl-6">Employee</TableHead>}
              <TableHead className={view === "personal" ? "pl-6" : undefined}>
                Period
              </TableHead>
              {view === "team" && <TableHead>Scope IDs</TableHead>}
              <TableHead className="text-right">Submitted</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Not done</TableHead>
              <TableHead className="text-right">Postponed</TableHead>
              <TableHead className="text-right">Cancelled</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
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
              rows.map((row) => (
                <TaskCompletionRow
                  key={`${row.employeeId}-${row.periodStart}-${row.periodEnd}`}
                  row={row}
                  view={view}
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
}: {
  row: TaskCompletionAnalyticsRow;
  view: TaskCompletionView;
}) {
  const noData = row.status === "NO_DATA";

  return (
    <TableRow>
      {view === "team" && (
        <TableCell className="max-w-64 pl-6 whitespace-normal">
          <div className="font-medium">{row.employeeName}</div>
          <div className="text-xs text-muted-foreground">{row.title || "No title"}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </TableCell>
      )}
      <TableCell className={view === "personal" ? "pl-6" : undefined}>
        <span className="font-medium">{formatCalendarDate(row.periodStart)}</span>
        <span className="block text-xs text-muted-foreground">
          to {formatCalendarDate(row.periodEnd)}
        </span>
      </TableCell>
      {view === "team" && (
        <TableCell className="max-w-64 whitespace-normal text-xs text-muted-foreground">
          <ScopeIds label="Departments" ids={row.departmentIds} />
          <ScopeIds label="Divisions" ids={row.divisionIds} />
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

function ScopeIds({ label, ids }: { label: string; ids: string[] }) {
  return (
    <div title={ids.join(", ")}>
      <span className="font-medium text-foreground">{label}:</span>{" "}
      {ids.length > 0 ? ids.join(", ") : "—"}
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
