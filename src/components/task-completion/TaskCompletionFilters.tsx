"use client";

import { RotateCcw, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultTaskCompletionDateRange } from "./analytics";
import type {
  TaskCompletionAnalyticsFilters,
  TaskCompletionPeriodType,
  TaskCompletionSortDirection,
  TaskCompletionSortField,
  TaskCompletionStatus,
  TaskCompletionView,
} from "./types";

interface TaskCompletionFiltersProps {
  view: TaskCompletionView;
  filters: TaskCompletionAnalyticsFilters;
  dateRangeError: string | null;
  loading: boolean;
  onChange: (filters: TaskCompletionAnalyticsFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const statuses: Array<{ value: TaskCompletionStatus; label: string }> = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "WATCH", label: "Watch" },
  { value: "LOW", label: "Low" },
  { value: "CRITICAL", label: "Critical" },
  { value: "NO_DATA", label: "No data" },
];

const sortFields: Array<{ value: TaskCompletionSortField; label: string }> = [
  { value: "PERIOD_START", label: "Period start" },
  { value: "EMPLOYEE_NAME", label: "Employee name" },
  { value: "COMPLETION_RATE", label: "Completion rate" },
  { value: "TOTAL_TASKS", label: "Submitted tasks" },
  { value: "COMPLETED_TASKS", label: "Completed tasks" },
  { value: "STATUS", label: "Status" },
];

export function TaskCompletionFilters({
  view,
  filters,
  dateRangeError,
  loading,
  onChange,
  onApply,
  onReset,
}: TaskCompletionFiltersProps) {
  const update = (patch: Partial<TaskCompletionAnalyticsFilters>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  const changePeriodType = (periodType: TaskCompletionPeriodType) => {
    update({
      periodType,
      ...getDefaultTaskCompletionDateRange(periodType),
    });
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Analytics filters</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Dates are inclusive calendar dates.
            </p>
          </div>
          {view === "team" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Reporting scope is enforced by the server
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onApply();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="task-completion-period-type">Period type</Label>
              <Select
                value={filters.periodType}
                onValueChange={(value) =>
                  changePeriodType(value as TaskCompletionPeriodType)
                }
              >
                <SelectTrigger
                  id="task-completion-period-type"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-completion-start-date">Start date</Label>
              <Input
                id="task-completion-start-date"
                type="date"
                required
                aria-invalid={!!dateRangeError}
                value={filters.startDate}
                onChange={(event) => update({ startDate: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-completion-end-date">End date</Label>
              <Input
                id="task-completion-end-date"
                type="date"
                required
                aria-invalid={!!dateRangeError}
                value={filters.endDate}
                onChange={(event) => update({ endDate: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-completion-status">Completion status</Label>
              <Select
                value={filters.status ?? "ALL"}
                onValueChange={(value) =>
                  update({
                    status:
                      value === "ALL"
                        ? undefined
                        : (value as TaskCompletionStatus),
                  })
                }
              >
                <SelectTrigger id="task-completion-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-completion-strategic-period">
                Strategic period ID <span className="font-normal">(optional)</span>
              </Label>
              <Input
                id="task-completion-strategic-period"
                placeholder="Strategic period ID"
                value={filters.strategicPeriodId ?? ""}
                onChange={(event) =>
                  update({ strategicPeriodId: event.target.value })
                }
              />
            </div>

            {view === "team" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="task-completion-employee">
                    Employee ID <span className="font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="task-completion-employee"
                    placeholder="Employee ID"
                    value={filters.employeeId ?? ""}
                    onChange={(event) =>
                      update({ employeeId: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-completion-department">
                    Department ID <span className="font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="task-completion-department"
                    placeholder="Department ID"
                    value={filters.departmentId ?? ""}
                    onChange={(event) =>
                      update({ departmentId: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-completion-division">
                    Division ID <span className="font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="task-completion-division"
                    placeholder="Division ID"
                    value={filters.divisionId ?? ""}
                    onChange={(event) =>
                      update({ divisionId: event.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="task-completion-sort">Sort by</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  update({ sortBy: value as TaskCompletionSortField })
                }
              >
                <SelectTrigger id="task-completion-sort" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortFields.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-completion-sort-direction">Sort order</Label>
              <Select
                value={filters.sortDirection}
                onValueChange={(value) =>
                  update({
                    sortDirection: value as TaskCompletionSortDirection,
                  })
                }
              >
                <SelectTrigger
                  id="task-completion-sort-direction"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">Ascending</SelectItem>
                  <SelectItem value="DESC">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {view === "team" && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
              <Checkbox
                id="task-completion-critical-only"
                checked={filters.status === "CRITICAL"}
                onCheckedChange={(checked) =>
                  update({
                    status:
                      checked === true
                        ? "CRITICAL"
                        : filters.status === "CRITICAL"
                          ? undefined
                          : filters.status,
                  })
                }
              />
              <Label
                htmlFor="task-completion-critical-only"
                className="cursor-pointer text-red-950 dark:text-red-200"
              >
                Critical only
              </Label>
              <span className="text-xs text-red-800 dark:text-red-300">
                Show rows below 40% completion.
              </span>
            </div>
          )}

          {dateRangeError && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {dateRangeError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={!!dateRangeError || loading}>
              <Search aria-hidden="true" />
              {loading ? "Loading…" : "Apply filters"}
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
