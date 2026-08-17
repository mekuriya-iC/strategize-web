export type TaskType =
  | "KPI_FULFILLED"
  | "KPI_UNMET"
  | "INITIATIVE_FULFILLED"
  | "INITIATIVE_UNMET"
  | "SELF_DEVELOPMENT_FULFILLED"
  | "SELF_DEVELOPMENT_UNMET"
  | "UNLINKED";

export const DEFAULT_TASK_TYPE: TaskType = "KPI_UNMET";

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
