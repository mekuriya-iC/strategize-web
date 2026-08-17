import type {
  HierarchyTaskCompletionAnalyticsVariables,
  PersonalTaskCompletionAnalyticsInput,
  PersonalTaskCompletionAnalyticsVariables,
  TaskCompletionAnalyticsFilters,
  TaskCompletionPeriodType,
  TaskCompletionStatus,
} from "./types";

const TEAM_ANALYTICS_ROLES = new Set([
  "MANAGER",
  "DIRECTOR",
  "HR",
  "ADMIN",
  "SUPER_ADMIN",
]);

export interface TaskCompletionStatusPresentation {
  label: string;
  description: string;
  className: string;
  dotClassName: string;
  isCritical: boolean;
}

const STATUS_PRESENTATIONS: Record<
  TaskCompletionStatus,
  TaskCompletionStatusPresentation
> = {
  EXCELLENT: {
    label: "Excellent",
    description: "At least 90% of submitted tasks were completed.",
    className:
      "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    dotClassName: "bg-emerald-600 dark:bg-emerald-400",
    isCritical: false,
  },
  GOOD: {
    label: "Good",
    description: "At least 75% of submitted tasks were completed.",
    className:
      "border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
    dotClassName: "bg-blue-600 dark:bg-blue-400",
    isCritical: false,
  },
  WATCH: {
    label: "Watch",
    description: "Completion is between 60% and 74.99%.",
    className:
      "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    dotClassName: "bg-amber-600 dark:bg-amber-400",
    isCritical: false,
  },
  LOW: {
    label: "Low",
    description: "Completion is between 40% and 59.99%.",
    className:
      "border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
    dotClassName: "bg-orange-600 dark:bg-orange-400",
    isCritical: false,
  },
  CRITICAL: {
    label: "Critical",
    description: "Fewer than 40% of submitted tasks were completed.",
    className:
      "border-red-300 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    dotClassName: "bg-red-600 dark:bg-red-400",
    isCritical: true,
  },
  NO_DATA: {
    label: "No data",
    description: "No official tasks were submitted for this period.",
    className:
      "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    dotClassName: "bg-slate-500 dark:bg-slate-400",
    isCritical: false,
  },
};

export function canViewTeamTaskCompletion(role?: string): boolean {
  return !!role && TEAM_ANALYTICS_ROLES.has(role);
}

export function getTaskCompletionStatusPresentation(
  status: TaskCompletionStatus,
): TaskCompletionStatusPresentation {
  return STATUS_PRESENTATIONS[status];
}

function toIsoCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultTaskCompletionDateRange(
  periodType: TaskCompletionPeriodType,
  now = new Date(),
): { startDate: string; endDate: string } {
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  if (periodType === "DAILY") {
    const today = toIsoCalendarDate(new Date(year, month, date));
    return { startDate: today, endDate: today };
  }

  if (periodType === "MONTHLY") {
    return {
      startDate: toIsoCalendarDate(new Date(year, month, 1)),
      endDate: toIsoCalendarDate(new Date(year, month + 1, 0)),
    };
  }

  const start = new Date(year, month, date);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: toIsoCalendarDate(start),
    endDate: toIsoCalendarDate(end),
  };
}

export function createDefaultTaskCompletionFilters(
  periodType: TaskCompletionPeriodType = "WEEKLY",
  now = new Date(),
): TaskCompletionAnalyticsFilters {
  return {
    periodType,
    ...getDefaultTaskCompletionDateRange(periodType, now),
    page: 1,
    limit: 25,
    sortBy: "PERIOD_START",
    sortDirection: "ASC",
  };
}

function optionalId(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildBaseInput(
  filters: TaskCompletionAnalyticsFilters,
): PersonalTaskCompletionAnalyticsInput {
  return {
    periodType: filters.periodType,
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(optionalId(filters.strategicPeriodId)
      ? { strategicPeriodId: optionalId(filters.strategicPeriodId) }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  };
}

export function buildPersonalTaskCompletionVariables(
  filters: TaskCompletionAnalyticsFilters,
): PersonalTaskCompletionAnalyticsVariables {
  return { filters: buildBaseInput(filters) };
}

export function buildHierarchyTaskCompletionVariables(
  filters: TaskCompletionAnalyticsFilters,
): HierarchyTaskCompletionAnalyticsVariables {
  return {
    filters: {
      ...buildBaseInput(filters),
      ...(optionalId(filters.employeeId)
        ? { employeeId: optionalId(filters.employeeId) }
        : {}),
      ...(optionalId(filters.departmentId)
        ? { departmentId: optionalId(filters.departmentId) }
        : {}),
      ...(optionalId(filters.divisionId)
        ? { divisionId: optionalId(filters.divisionId) }
        : {}),
    },
  };
}

export function getTaskCompletionDateRangeError(
  filters: Pick<TaskCompletionAnalyticsFilters, "startDate" | "endDate">,
): string | null {
  if (!filters.startDate || !filters.endDate) {
    return "Choose both a start date and an end date.";
  }
  if (filters.startDate > filters.endDate) {
    return "Start date must be on or before end date.";
  }
  return null;
}
