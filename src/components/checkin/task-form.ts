export type TaskType =
  | "KPI_FULFILLED"
  | "KPI_UNMET"
  | "INITIATIVE_FULFILLED"
  | "INITIATIVE_UNMET"
  | "SELF_DEVELOPMENT_FULFILLED"
  | "SELF_DEVELOPMENT_UNMET"
  | "UNLINKED";

export const DEFAULT_TASK_TYPE: TaskType = "KPI_UNMET";

export type TaskEditMode = "PLANNING" | "CHECKOUT";

export interface CheckoutStatusOption {
  value: "NOT_DONE" | "DONE" | "POSTPONED" | "CANCELLED";
  label: string;
}

export const CHECKOUT_STATUS_OPTIONS: ReadonlyArray<CheckoutStatusOption> = [
  { value: "NOT_DONE", label: "Not Done" },
  { value: "DONE", label: "Done" },
  { value: "POSTPONED", label: "Postponed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function getTaskEditMode(submissionStatus?: string | null): TaskEditMode {
  return submissionStatus === "DRAFT" || submissionStatus === "PERSONAL_TODO"
    ? "PLANNING"
    : "CHECKOUT";
}

export function getCheckoutStatusOptions(
  taskType: TaskType,
): ReadonlyArray<CheckoutStatusOption> {
  return taskType === "KPI_FULFILLED"
    ? CHECKOUT_STATUS_OPTIONS.filter((status) => status.value === "DONE")
    : CHECKOUT_STATUS_OPTIONS;
}

export function normalizeCheckoutStatus(
  taskType: TaskType,
  currentStatus?: string | null,
): CheckoutStatusOption["value"] {
  if (taskType === "KPI_FULFILLED") return "DONE";
  return CHECKOUT_STATUS_OPTIONS.some(
    (status) => status.value === currentStatus,
  )
    ? (currentStatus as CheckoutStatusOption["value"])
    : "NOT_DONE";
}

interface TaskKpiPlanningOption {
  status?: string | null;
  quarterPlans?: Array<{ status?: string | null }> | null;
}

export function requiresLinkedKpi(taskType: TaskType): boolean {
  return taskType === "KPI_FULFILLED" || taskType === "KPI_UNMET";
}

export function requiresCheckoutEvidence(
  taskType: TaskType,
  status?: string | null,
): boolean {
  if (status !== "DONE") return false;

  return (
    taskType === "KPI_UNMET" ||
    taskType === "INITIATIVE_UNMET" ||
    taskType === "SELF_DEVELOPMENT_UNMET" ||
    taskType === "INITIATIVE_FULFILLED"
  );
}

export function isKpiReadyForAchievementSubmission(
  kpi: TaskKpiPlanningOption,
): boolean {
  if (String(kpi.status || "").toUpperCase() !== "APPROVED") return false;
  const plans = kpi.quarterPlans || [];
  if (plans.length === 0) return false;
  const statuses = plans.map((plan) =>
    String(plan.status || "DRAFT").toUpperCase(),
  );
  return (
    statuses.includes("APPROVED") &&
    statuses.every((status) => status === "APPROVED" || status === "LOCKED")
  );
}

export const TASK_TYPES: ReadonlyArray<{
  value: TaskType;
  label: string;
}> = [
  { value: DEFAULT_TASK_TYPE, label: "KPI Unmet" },
  { value: "KPI_FULFILLED", label: "KPI Fulfilled" },
  { value: "INITIATIVE_FULFILLED", label: "Initiative Fulfilled" },
  { value: "INITIATIVE_UNMET", label: "Initiative Unmet" },
  {
    value: "SELF_DEVELOPMENT_FULFILLED",
    label: "Self-Development Fulfilled",
  },
  { value: "SELF_DEVELOPMENT_UNMET", label: "Self-Development Unmet" },
  { value: "UNLINKED", label: "Unlinked" },
];
