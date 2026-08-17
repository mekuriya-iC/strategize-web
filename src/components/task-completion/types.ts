export type TaskCompletionPeriodType = "DAILY" | "WEEKLY" | "MONTHLY";

export type TaskCompletionStatus =
  | "EXCELLENT"
  | "GOOD"
  | "WATCH"
  | "LOW"
  | "CRITICAL"
  | "NO_DATA";

export type TaskCompletionSortField =
  | "EMPLOYEE_NAME"
  | "PERIOD_START"
  | "COMPLETION_RATE"
  | "TOTAL_TASKS"
  | "COMPLETED_TASKS"
  | "STATUS";

export type TaskCompletionSortDirection = "ASC" | "DESC";
export type TaskCompletionView = "personal" | "team";

export interface TaskCompletionAnalyticsFilters {
  periodType: TaskCompletionPeriodType;
  startDate: string;
  endDate: string;
  strategicPeriodId?: string;
  status?: TaskCompletionStatus;
  employeeId?: string;
  departmentId?: string;
  divisionId?: string;
  page: number;
  limit: number;
  sortBy: TaskCompletionSortField;
  sortDirection: TaskCompletionSortDirection;
}

export interface TaskCompletionAnalyticsSummary {
  periodType: TaskCompletionPeriodType;
  periodStart: string;
  periodEnd: string;
  employeeCount: number;
  periodCount: number;
  totalTasks: number;
  completedTasks: number;
  notDoneTasks: number;
  postponedTasks: number;
  cancelledTasks: number;
  completionRate: number;
  status: TaskCompletionStatus;
}

export interface TaskCompletionAnalyticsRow {
  employeeId: string;
  employeeName: string;
  email: string;
  title: string;
  departmentIds: string[];
  divisionIds: string[];
  periodStart: string;
  periodEnd: string;
  totalTasks: number;
  completedTasks: number;
  notDoneTasks: number;
  postponedTasks: number;
  cancelledTasks: number;
  completionRate: number;
  status: TaskCompletionStatus;
}

export interface TaskCompletionPageInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface TaskCompletionAnalyticsResult {
  summary: TaskCompletionAnalyticsSummary;
  rows: TaskCompletionAnalyticsRow[];
  pageInfo: TaskCompletionPageInfo;
}

export interface PersonalTaskCompletionAnalyticsData {
  personalTaskCompletionAnalytics: TaskCompletionAnalyticsResult;
}

export interface HierarchyTaskCompletionAnalyticsData {
  hierarchyTaskCompletionAnalytics: TaskCompletionAnalyticsResult;
}

export interface PersonalTaskCompletionAnalyticsInput {
  periodType: TaskCompletionPeriodType;
  startDate: string;
  endDate: string;
  strategicPeriodId?: string;
  status?: TaskCompletionStatus;
  page: number;
  limit: number;
  sortBy: TaskCompletionSortField;
  sortDirection: TaskCompletionSortDirection;
}

export interface HierarchyTaskCompletionAnalyticsInput
  extends PersonalTaskCompletionAnalyticsInput {
  employeeId?: string;
  departmentId?: string;
  divisionId?: string;
}

export interface PersonalTaskCompletionAnalyticsVariables {
  filters: PersonalTaskCompletionAnalyticsInput;
}

export interface HierarchyTaskCompletionAnalyticsVariables {
  filters: HierarchyTaskCompletionAnalyticsInput;
}
