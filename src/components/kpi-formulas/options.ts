import type {
  KpiMeasurementUnit,
  KpiResultDirection,
  KpiTargetRangeOutsidePolicy,
  KpiTemporalRollupMethod,
  KpiUnitType,
  KpiZeroDenominatorPolicy,
} from "@/hooks/kpi-formulas/useKpiFormulas";

export const UNIT_TYPE_OPTIONS: Array<{ value: KpiUnitType; label: string }> = [
  { value: "NUMBER", label: "Number" },
  { value: "COUNT", label: "Count" },
  { value: "PERCENT", label: "Percent" },
  { value: "CURRENCY", label: "Currency" },
  { value: "HOUR", label: "Hours" },
  { value: "RATIO", label: "Ratio" },
];

export const MEASUREMENT_UNIT_OPTIONS: Array<{
  value: KpiMeasurementUnit;
  label: string;
}> = [
  { value: "NUMBER", label: "Number" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "CURRENCY", label: "Currency" },
  { value: "HOUR", label: "Hours" },
  { value: "RATING", label: "Rating" },
  { value: "BOOLEAN", label: "Boolean" },
  { value: "CUSTOM", label: "Custom" },
];

export const TEMPORAL_ROLLUP_OPTIONS: Array<{
  value: KpiTemporalRollupMethod;
  label: string;
}> = [
  { value: "SUM", label: "Sum" },
  { value: "AVERAGE", label: "Average" },
  {
    value: "SUM_COMPONENTS_THEN_DIVIDE",
    label: "Sum components, then divide",
  },
  { value: "LATEST_APPROVED", label: "Latest approved value" },
  { value: "PERIOD_START_SNAPSHOT", label: "Period-start snapshot" },
  { value: "PERIOD_END_SNAPSHOT", label: "Period-end snapshot" },
  { value: "COHORT", label: "Opening cohort to period end" },
  { value: "WEIGHTED_INDEX", label: "Weighted index" },
];

export const METRIC_TEMPORAL_ROLLUP_OPTIONS = TEMPORAL_ROLLUP_OPTIONS.filter(
  (option) =>
    option.value === "SUM" ||
    option.value === "AVERAGE" ||
    option.value === "LATEST_APPROVED" ||
    option.value === "PERIOD_START_SNAPSHOT" ||
    option.value === "PERIOD_END_SNAPSHOT",
);

export const ZERO_POLICY_OPTIONS: Array<{
  value: KpiZeroDenominatorPolicy;
  label: string;
  description: string;
}> = [
  {
    value: "NOT_CALCULABLE",
    label: "Not calculable",
    description: "Return no result when the denominator is zero.",
  },
  {
    value: "ZERO",
    label: "Return zero",
    description: "Treat the formula result as zero.",
  },
  {
    value: "BLOCK",
    label: "Block calculation",
    description: "Stop calculation and surface an error.",
  },
];

export const TARGET_RANGE_POLICY_OPTIONS: Array<{
  value: KpiTargetRangeOutsidePolicy;
  label: string;
  description: string;
}> = [
  {
    value: "ZERO_OUTSIDE",
    label: "Zero outside range",
    description: "Results inside the inclusive range score 100%; results outside score 0%.",
  },
  {
    value: "NEAREST_BOUND_RATIO",
    label: "Nearest-bound ratio",
    description:
      "Results inside score 100%; below uses actual ÷ minimum and above uses maximum ÷ actual.",
  },
];

export const RESULT_DIRECTION_OPTIONS: Array<{
  value: KpiResultDirection;
  label: string;
}> = [
  { value: "HIGHER_IS_BETTER", label: "Higher is better" },
  { value: "LOWER_IS_BETTER", label: "Lower is better" },
  { value: "TARGET_RANGE", label: "Target range" },
];

export function enumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export interface KpiOrgUnitNameMaps {
  divisionNamesById?: Record<string, string>;
  departmentNamesById?: Record<string, string>;
}

/**
 * Target KPI dropdown label:
 * - Group/corporate KPIs: just the KPI name
 * - Division/department KPIs: "KPI Name (Org Unit Name)"
 */
export function formatKpiCandidateLabel(
  kpi: {
    name: string;
    assigneeType?: string | null;
    assigneeId?: string | null;
    objective?: {
      assigneeType?: string | null;
      assigneeId?: string | null;
    } | null;
  },
  orgUnits?: KpiOrgUnitNameMaps,
): string {
  const assigneeType = kpi.assigneeType ?? kpi.objective?.assigneeType ?? null;
  const assigneeId = kpi.assigneeId ?? kpi.objective?.assigneeId ?? null;

  if (assigneeType === "DIVISION" && assigneeId) {
    const unitName = orgUnits?.divisionNamesById?.[assigneeId] ?? "Division";
    return `${kpi.name} (${unitName})`;
  }

  if (assigneeType === "DEPARTMENT" && assigneeId) {
    const unitName = orgUnits?.departmentNamesById?.[assigneeId] ?? "Department";
    return `${kpi.name} (${unitName})`;
  }

  return kpi.name;
}
