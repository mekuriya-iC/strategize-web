"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveStrategicPlanPeriods } from "@/hooks/strategic-periods/useActiveStrategicPlanPeriods";
import type {
  TaskCompletionAnalyticsFilters,
  TaskCompletionAvailableFilters,
  TaskCompletionView,
} from "./types";

const selectClass =
  "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary";

export function TaskCompletionFilters({
  view,
  filters,
  availableFilters,
  dateRangeError,
  loading,
  onChange,
  onApply,
  onReset,
}: {
  view: TaskCompletionView;
  filters: TaskCompletionAnalyticsFilters;
  availableFilters?: TaskCompletionAvailableFilters;
  dateRangeError: string | null;
  loading: boolean;
  onChange: (filters: TaskCompletionAnalyticsFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const { strategicPeriods } = useActiveStrategicPlanPeriods();
  const update = (patch: Partial<TaskCompletionAnalyticsFilters>) =>
    onChange({ ...filters, ...patch, page: 1 });
  return (
    <form
      className="rounded-2xl border bg-card p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
      aria-label="Analytics filters"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 text-xs font-medium">
          Planning period
          <select
            className={selectClass}
            value={filters.strategicPeriodId ?? ""}
            onChange={(event) => {
              const period = strategicPeriods.find(
                (p) => p.strategicPeriodId === event.target.value,
              );
              update({
                strategicPeriodId: period?.strategicPeriodId,
                ...(period
                  ? {
                      startDate: period.startDate.slice(0, 10),
                      endDate: period.endDate.slice(0, 10),
                    }
                  : {}),
              });
            }}
          >
            <option value="">All plans · selected dates</option>
            {strategicPeriods.map((p) => (
              <option key={p.strategicPeriodId} value={p.strategicPeriodId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          Group by
          <select
            className={selectClass}
            value={filters.periodType}
            onChange={(e) =>
              update({
                periodType: e.target
                  .value as TaskCompletionAnalyticsFilters["periodType"],
              })
            }
          >
            <option value="WEEKLY">Week</option>
            <option value="DAILY">Day</option>
            <option value="MONTHLY">Month</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          From (inclusive)
          <Input
            required
            type="date"
            value={filters.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            aria-invalid={!!dateRangeError}
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          To (inclusive)
          <Input
            required
            type="date"
            value={filters.endDate}
            onChange={(e) => update({ endDate: e.target.value })}
            aria-invalid={!!dateRangeError}
          />
        </label>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-primary">
          Refine scope, status & sorting
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {view === "team" &&
            (
              [
                ["employeeId", "employees", "Employee"],
                ["departmentId", "departments", "Department"],
                ["divisionId", "divisions", "Division"],
              ] as const
            ).map(([field, options, label]) => (
              <label key={field} className="space-y-1.5 text-xs font-medium">
                {label}
                <select
                  className={selectClass}
                  value={filters[field] ?? ""}
                  onChange={(e) =>
                    update({ [field]: e.target.value || undefined })
                  }
                >
                  <option value="">All in my authorized scope</option>
                  {(availableFilters?.[options] ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          <label className="space-y-1.5 text-xs font-medium">
            Completion status
            <select
              className={selectClass}
              value={filters.status ?? ""}
              onChange={(e) =>
                update({
                  status:
                    (e.target
                      .value as TaskCompletionAnalyticsFilters["status"]) ||
                    undefined,
                })
              }
            >
              <option value="">All statuses</option>
              {["EXCELLENT", "GOOD", "WATCH", "LOW", "CRITICAL", "NO_DATA"].map(
                (value) => (
                  <option key={value} value={value}>
                    {value.replace("_", " ")}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Sort detail by
            <select
              className={selectClass}
              value={filters.sortBy}
              onChange={(e) =>
                update({
                  sortBy: e.target
                    .value as TaskCompletionAnalyticsFilters["sortBy"],
                })
              }
            >
              <option value="PERIOD_START">Period start</option>
              <option value="EMPLOYEE_NAME">Employee name</option>
              <option value="COMPLETION_RATE">Completion rate</option>
              <option value="TOTAL_TASKS">Task volume</option>
              <option value="COMPLETED_TASKS">Completed</option>
              <option value="STATUS">Status</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Order
            <select
              className={selectClass}
              value={filters.sortDirection}
              onChange={(e) =>
                update({
                  sortDirection: e.target
                    .value as TaskCompletionAnalyticsFilters["sortDirection"],
                })
              }
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </label>
        </div>
      </details>
      {dateRangeError && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {dateRangeError}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={!!dateRangeError || loading}>
          {loading ? "Loading…" : "Apply filters"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onReset}>
          Reset to recent weeks
        </Button>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          Scope enforced by the server · grouped by task due date
        </span>
      </div>
    </form>
  );
}
