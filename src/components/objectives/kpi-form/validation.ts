/**
 * KPI Form Validation Utilities
 */

import { toast } from "sonner";
import { getDetailedUnitLabel } from "@/utils/unitTypeDetection";
import type { Kpi, Objective as GraphQLObjective } from "@/types/graphql";
import type { YearlyQuarters, AllocationInfo } from "@/hooks/useKPIFormState";

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
  // Check current KPI's targets
  if (kpi?.targets && kpi.targets.length > 0) {
    const currentTarget = kpi.targets.find((t) => t.timeline === year);
    if (currentTarget) return currentTarget.target;

    // Sum quarterly targets for this year
    const quarterlyTargets = kpi.targets.filter(
      (t) =>
        t.timeline.startsWith(year.split("/")[0]) && t.timeline.includes("-Q")
    );

    if (quarterlyTargets.length > 0) {
      return quarterlyTargets.reduce((sum, t) => sum + t.target, 0);
    }
  }

  // Check if yearlyQuarters has a parentTarget set (for new KPIs with parent)
  if (yearlyQuarters?.[year]?.parentTarget !== undefined && yearlyQuarters[year].parentTarget! > 0) {
    return yearlyQuarters[year].parentTarget!;
  }

  // For child KPIs without targets, don't fall back to strategic targets
  if (kpi?.parent?.kpiId) {
    return null;
  }

  // For corporate KPIs, fall back to strategic targets
  if (
    !kpi?.parent?.kpiId &&
    strategicTargetsById?.[kpi?.kpiId || ""]?.[year] !== undefined
  ) {
    return strategicTargetsById[kpi?.kpiId || ""][year];
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
  strategicTargetsById?: Record<string, Record<string, number>>
): QuarterlyValidationResult => {
  let assignedTarget = getAssignedTarget(year, kpi, strategicTargetsById, yearlyQuarters);
  const currentSum = calculateQuarterlySum(year, yearlyQuarters);
  const unitLabel = kpi ? getDetailedUnitLabel(kpi) : "units";

  // If no assigned target from KPI but we have remaining allocation, use that
  // This handles the case of adding a new KPI where kpi is undefined
  if (assignedTarget === null && remainingAllocation) {
    assignedTarget = remainingAllocation.remaining;
  }

  if (assignedTarget === null) {
    return {
      isValid: true,
      message: "No assigned target found",
      assignedTarget: null,
      currentSum,
      unitLabel,
    };
  }

  // Tolerance for floating-point precision (0.01 = 2 decimal places)
  const TOLERANCE = 0.01;

  // Check against remaining allocation if available
  if (remainingAllocation) {
    const maxAllowed = remainingAllocation.remaining;

    // Use tolerance to handle floating-point precision issues
    if (currentSum - maxAllowed > TOLERANCE) {
      return {
        isValid: false,
        message: `Quarterly sum (${roundTarget(
          currentSum
        )} ${unitLabel}) exceeds available allocation (${roundTarget(
          maxAllowed
        )} ${unitLabel})`,
        assignedTarget,
        currentSum,
        unitLabel,
        remainingAllocation: remainingAllocation.remaining,
      };
    }
  } else {
    // Use tolerance to handle floating-point precision issues
    if (currentSum - assignedTarget > TOLERANCE) {
      return {
        isValid: false,
        message: `Quarterly sum (${roundTarget(
          currentSum
        )} ${unitLabel}) exceeds assigned target (${roundTarget(
          assignedTarget
        )} ${unitLabel})`,
        assignedTarget,
        currentSum,
        unitLabel,
      };
    }
  }

  if (Math.abs(currentSum - assignedTarget) < 0.01) {
    return {
      isValid: true,
      message: `Perfect! Quarterly sum matches assigned target`,
      assignedTarget,
      currentSum,
      unitLabel,
      remainingAllocation: remainingAllocation?.remaining,
    };
  }

  return {
    isValid: true,
    message: `Quarterly sum (${roundTarget(
      currentSum
    )} ${unitLabel}) is below assigned target (${roundTarget(
      assignedTarget
    )} ${unitLabel})`,
    assignedTarget,
    currentSum,
    unitLabel,
    remainingAllocation: remainingAllocation?.remaining,
  };
};

/**
 * Validate the entire form
 */
export const validateForm = (params: {
  formData: { name: string; baseline: string; weight: string };
  objective?: GraphQLObjective;
  isQuarterlyMode: boolean;
  yearlyQuarters: Record<string, YearlyQuarters>;
  targets: Array<{ timeline: string; target: string }>;
  canEditTargets: boolean;
  kpi: Kpi | undefined;
  remainingAllocation: AllocationInfo | null;
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
        toast.error("Please set at least one target value");
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

      const validation = validateQuarterlyBreakdown(
        year,
        yearlyQuarters,
        kpi,
        remainingAllocation,
        strategicTargetsById
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

