/**
 * KPI Form Validation Utilities
 */

import { toast } from "sonner";
import { getDetailedUnitLabel } from "@/utils/unitTypeDetection";
import type { Kpi, Objective as GraphQLObjective } from "@/types/graphql";
import type { YearlyQuarters, AllocationInfo } from "@/hooks/objectives/useKPIFormState";

// Utility function to round target numbers to max 2 decimal places
export const roundTarget = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  // Format to max 2 decimal places without trailing zeros
  return rounded.toString();
};

export interface QuarterlyValidationResult {
  isValid: boolean;
  message: string;
  assignedTarget: number | null;
  currentSum: number;
  unitLabel: string;
  remainingAllocation?: number;
}

/**
 * Calculate the sum of quarterly values for a given year
 */
export const calculateQuarterlySum = (
  year: string,
  yearlyQuarters: Record<string, YearlyQuarters>
): number => {
  const quarters = yearlyQuarters[year];
  if (!quarters) return 0;

  const sum =
    (quarters.q1 === "" ? 0 : Number(quarters.q1)) +
    (quarters.q2 === "" ? 0 : Number(quarters.q2)) +
    (quarters.q3 === "" ? 0 : Number(quarters.q3)) +
    (quarters.q4 === "" ? 0 : Number(quarters.q4));

  // Round to avoid floating-point precision issues
  return Math.round(sum * 100) / 100;
};

/**
 * Get the assigned target for a specific year
 */
export const getAssignedTarget = (
  year: string,
  kpi: Kpi | undefined,
  strategicTargetsById?: Record<string, Record<string, number>>,
  yearlyQuarters?: Record<string, YearlyQuarters>
): number | null => {
  // 1. PRIMARY: Check strategicTargetsById if provided (usually Passed from Form)
  // This helps when we want to override the base KPI targets (e.g. during unsaved edits)
  if (kpi?.kpiId && strategicTargetsById?.[kpi.kpiId]) {
    const targets = strategicTargetsById[kpi.kpiId];
    // Try exact match
    if (targets[year] !== undefined) return targets[year];
    // Try matching if the key starts with the year (e.g. "2025/26" starts with "2025")
    const matchingKey = Object.keys(targets).find(k => k === year || k.startsWith(year));
    if (matchingKey) return targets[matchingKey];
  }

  // 2. SECONDARY: Check current KPI's own specific yearly target records
  if (kpi?.targets && kpi.targets.length > 0) {
    // Try to find an exactly matching timeline (e.g. "2025" or "2025/26")
    const currentTarget = kpi.targets.find((t) =>
      !t.timeline.includes("-Q") && (t.timeline === year || t.timeline.startsWith(year))
    );
    if (currentTarget) return currentTarget.target;
  }

  // 3. TERTIARY: Check if yearlyQuarters has a parentTarget set (mostly for new KPIs)
  if (yearlyQuarters?.[year]?.parentTarget !== undefined && yearlyQuarters[year].parentTarget! > 0) {
    return yearlyQuarters[year].parentTarget!;
  }

  // 4. LAST RESORT: Sum/Average existing quarterly targets if yearly record is missing
  // This is a fallback but might be risky if we rely on it for validation
  if (kpi?.targets && kpi.targets.length > 0) {
    const quarterlyTargets = kpi.targets.filter(
      (t) => t.timeline.startsWith(year.split("/")[0]) && t.timeline.includes("-Q")
    );

    if (quarterlyTargets.length > 0) {
      const sum = quarterlyTargets.reduce((acc, t) => acc + t.target, 0);
      const shouldAverage =
        kpi.quarterlyAggregationMethod === "AVERAGE" ||
        (!kpi.quarterlyAggregationMethod &&
          (kpi.unitType === "PERCENT" || kpi.unitType === "RATIO"));
      return shouldAverage ? sum / quarterlyTargets.length : sum;
    }
  }

  return null;
};

/**
 * Validate quarterly breakdown against remaining allocation
 */
export const validateQuarterlyBreakdown = (
  year: string,
  yearlyQuarters: Record<string, YearlyQuarters>,
  kpi: Kpi | undefined,
  remainingAllocation: AllocationInfo | null,
  strategicTargetsById?: Record<string, Record<string, number>>,
  weightType?: string
) => {
  let assignedTarget = getAssignedTarget(year, kpi, strategicTargetsById, yearlyQuarters);
  const currentSum = calculateQuarterlySum(year, yearlyQuarters);
  const unitLabel = kpi ? getDetailedUnitLabel(kpi) : (weightType === "PERCENT" ? "%" : "units");
  const shouldAverage = kpi
    ? kpi.quarterlyAggregationMethod === "AVERAGE" ||
      (!kpi.quarterlyAggregationMethod &&
        (kpi.unitType === "PERCENT" || kpi.unitType === "RATIO"))
    : weightType === "PERCENT";

  // If no assigned target found from direct mapping, fallback to remaining allocation
  if (assignedTarget === null && remainingAllocation !== null) {
    assignedTarget = remainingAllocation.remaining;
  }

  if (assignedTarget === null) {
    return {
      isValid: true,
      message: "No assigned target found",
      assignedTarget: null,
      currentSum,
      unitLabel,
      remainingAllocation: remainingAllocation?.remaining,
    };
  }
  //here is tollerance 0.01
  const TOLERANCE = 0.001;
  const currentVal = shouldAverage ? currentSum / 4 : currentSum;

  if (currentVal < assignedTarget - TOLERANCE) {
    return {
      isValid: false,
      message: `${shouldAverage ? "Average" : "Sum"} (${roundTarget(currentVal)} ${unitLabel}) is below Target (${roundTarget(assignedTarget)} ${unitLabel})`,
      assignedTarget,
      currentSum: currentVal,
      unitLabel,
      remainingAllocation: remainingAllocation?.remaining,
    };
  }

  if (currentVal > assignedTarget + TOLERANCE) {
    return {
      isValid: false,
      message: `${shouldAverage ? "Average" : "Sum"} (${roundTarget(currentVal)} ${unitLabel}) exceeds Target (${roundTarget(assignedTarget)} ${unitLabel})`,
      assignedTarget,
      currentSum: currentVal,
      unitLabel,
      remainingAllocation: remainingAllocation?.remaining,
    };
  }

  return {
    isValid: true,
    message: `Perfect! Quarterly planning matches Target`,
    assignedTarget,
    currentSum: currentVal,
    unitLabel,
    remainingAllocation: remainingAllocation?.remaining,
  };
};

/**
 * Validate the entire form
 */
export const validateForm = (params: {
  formData: { name: string; baseline: string; weight: string; weightType: string };
  objective?: GraphQLObjective;
  isQuarterlyMode: boolean;
  yearlyQuarters: Record<string, YearlyQuarters>;
  targets: Array<{ timeline: string; target: string }>;
  canEditTargets: boolean;
  kpi: Kpi | undefined;
  remainingAllocation: AllocationInfo | null;
  levelAllocation?: { used: number; remaining: number };
  strategicTargetsById?: Record<string, Record<string, number>>;
}): boolean => {
  const {
    formData,
    objective,
    isQuarterlyMode,
    yearlyQuarters,
    targets,
    canEditTargets,
    kpi,
    remainingAllocation,
    strategicTargetsById,
  } = params;

  // Validate structure fields for all non-corporate objectives
  if (objective?.type !== "CORPORATE") {
    if (!formData.name.trim()) {
      toast.error("Please enter a KPI name");
      return false;
    }

    if (formData.baseline && isNaN(Number(formData.baseline))) {
      toast.error("Please enter a valid baseline value");
      return false;
    }

    if (formData.weight && isNaN(Number(formData.weight))) {
      toast.error("Please enter a valid weight value");
      return false;
    }

    // Check cumulative level weight
    const currentWeight = Number(formData.weight || 0);
    const { used: levelUsed } = params.levelAllocation || { used: 0, remaining: 100 };
    if (levelUsed + currentWeight > 100.01) { // 0.01 tolerance
      toast.error(
        `Cannot save KPI. The total weight for this level would be ${(
          levelUsed + currentWeight
        ).toFixed(1)}%, exceeding the 100% limit.`
      );
      return false;
    }
  }

  // Validate targets for non-corporate objectives
  if (objective?.type !== "CORPORATE") {
    if (isQuarterlyMode) {
      const hasQuarterlyTargets = Object.values(yearlyQuarters).some(
        (quarters) =>
          [quarters.q1, quarters.q2, quarters.q3, quarters.q4].some(
            (q) => q !== "" && Number(q) > 0
          )
      );
      if (!hasQuarterlyTargets) {
        toast.error("Please set at least one quarterly target value");
        return false;
      }
    } else {
      const hasYearlyTargets = targets.some(
        (t) =>
          t.timeline.trim() && !isNaN(Number(t.target)) && Number(t.target) > 0
      );
      if (!hasYearlyTargets) {
        toast.error("Please set at least one yearly target value");
        return false;
      }
    }
  }

  // Validate quarterly values
  if (isQuarterlyMode && canEditTargets) {
    for (const [year, quarters] of Object.entries(yearlyQuarters)) {
      const vals = [quarters.q1, quarters.q2, quarters.q3, quarters.q4].map(
        (v) => (v === "" ? 0 : Number(v))
      );

      for (const v of vals) {
        if (isNaN(v) || v < 0) {
          toast.error(
            `Please enter valid non-negative quarter values for ${year}`
          );
          return false;
        }
      }

      const validation = validateQuarterlyBreakdown(year,
        yearlyQuarters,
        kpi,
        remainingAllocation,
        strategicTargetsById,
        formData.weightType
      );

      if (!validation.isValid) {
        toast.error(
          `Quarterly breakdown validation failed for ${year}: ${validation.message}`
        );
        return false;
      }
    }
  }

  return true;
};

