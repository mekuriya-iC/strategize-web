import { useState, useCallback } from "react";
import { Kpi } from "@/types/graphql";
import { detectKPIType, getInferredUnitType } from "@/utils/unitTypeDetection";
import { kpiLogger } from "@/lib/logger";

// Types for assignment state
export interface TargetAssignment {
  kpiId: string;
  assigneeId: string;
  target: number;
  unitType: "NUMBER_MILLION" | "NUMBER_COUNT" | "PERCENT";
}

export interface AssignmentState {
  selectedKPIs: string[];
  selectedAssignees: string[];
  targetAssignments: TargetAssignment[];
  assigneeType: "DIVISION" | "DEPARTMENT" | "PERSONNEL";
  isSubmitting: boolean;
  errors: string[];
}

export const useAssignmentState = () => {
  const [state, setState] = useState<AssignmentState>({
    selectedKPIs: [],
    selectedAssignees: [],
    targetAssignments: [],
    assigneeType: "DIVISION",
    isSubmitting: false,
    errors: [],
  });

  // Update selected KPIs
  const updateSelectedKPIs = useCallback((kpiIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedKPIs: kpiIds,
      targetAssignments: prev.targetAssignments.filter((ta) =>
        kpiIds.includes(ta.kpiId)
      ),
    }));
  }, []);

  // Update selected assignees
  const updateSelectedAssignees = useCallback((assigneeIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedAssignees: assigneeIds,
      targetAssignments: prev.targetAssignments.filter((ta) =>
        assigneeIds.includes(ta.assigneeId)
      ),
    }));
  }, []);

  // Update assignee type
  const updateAssigneeType = useCallback(
    (type: "DIVISION" | "DEPARTMENT" | "PERSONNEL") => {
      setState((prev) => ({
        ...prev,
        assigneeType: type,
        targetAssignments: [],
        selectedAssignees: [],
      }));
    },
    []
  );

  // Update target assignment for a specific KPI and assignee
  const updateTargetAssignment = useCallback(
    (kpiId: string, assigneeId: string, target: number, kpi: Kpi) => {
      const unitType = getInferredUnitType(kpi);

      setState((prev) => {
        const existingIndex = prev.targetAssignments.findIndex(
          (ta) => ta.kpiId === kpiId && ta.assigneeId === assigneeId
        );

        const newAssignment: TargetAssignment = {
          kpiId,
          assigneeId,
          target,
          unitType,
        };

        if (existingIndex >= 0) {
          const newTargetAssignments = [...prev.targetAssignments];
          newTargetAssignments[existingIndex] = newAssignment;
          return {
            ...prev,
            targetAssignments: newTargetAssignments,
          };
        } else {
          return {
            ...prev,
            targetAssignments: [...prev.targetAssignments, newAssignment],
          };
        }
      });
    },
    []
  );

  // Get target assignment for a specific KPI and assignee
  const getTargetAssignment = useCallback(
    (kpiId: string, assigneeId: string): number | null => {
      const assignment = state.targetAssignments.find(
        (ta) => ta.kpiId === kpiId && ta.assigneeId === assigneeId
      );
      return assignment ? assignment.target : null;
    },
    [state.targetAssignments]
  );

  // Calculate total assigned target for a KPI
  const getTotalAssignedTarget = useCallback(
    (kpiId: string): number => {
      const total = state.targetAssignments
        .filter((ta) => ta.kpiId === kpiId)
        .reduce((sum, ta) => sum + ta.target, 0);
      // Round to max 2 decimal places to avoid floating-point precision issues
      return Math.round(total * 100) / 100;
    },
    [state.targetAssignments]
  );

  // Validate target assignments
  const validateAssignments = useCallback(
    (parentKPIs: Kpi[]): string[] => {
      const errors: string[] = [];

      if (state.selectedKPIs.length === 0) {
        errors.push("Please select at least one KPI to assign");
      }

      if (state.selectedAssignees.length === 0) {
        errors.push("Please select at least one assignee");
      }

      state.selectedKPIs.forEach((kpiId) => {
        const parentKPI = parentKPIs.find((k) => k.kpiId === kpiId);
        if (!parentKPI) return;

        const kpiType = detectKPIType(parentKPI);

        if (kpiType === "SUMMABLE") {
          const totalAssigned = getTotalAssignedTarget(kpiId);
          const parentTarget = parentKPI.targets[0]?.target || 0;

          if (Math.abs(totalAssigned - parentTarget) > 0.01) {
            errors.push(
              `Total assigned target for "${parentKPI.name}" (${Number(
                totalAssigned
              ).toFixed(1)}) must equal parent target (${Number(
                parentTarget
              ).toFixed(1)})`
            );
          }
        } else {
          const missingAssignments = state.selectedAssignees.filter(
            (assigneeId) => getTargetAssignment(kpiId, assigneeId) === null
          );

          if (missingAssignments.length > 0) {
            errors.push(
              `All assignees must have targets for "${parentKPI.name}"`
            );
          }
        }
      });

      return errors;
    },
    [
      state.selectedKPIs,
      state.selectedAssignees,
      getTotalAssignedTarget,
      getTargetAssignment,
    ]
  );

  // Reset state
  const resetState = useCallback(() => {
    setState({
      selectedKPIs: [],
      selectedAssignees: [],
      targetAssignments: [],
      assigneeType: "DIVISION",
      isSubmitting: false,
      errors: [],
    });
  }, []);

  // Set submitting state
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  // Set errors
  const setErrors = useCallback((errors: string[]) => {
    kpiLogger.debug("setErrors called with:", errors);
    setState((prev) => ({ ...prev, errors }));
  }, []);

  return {
    ...state,
    updateSelectedKPIs,
    updateSelectedAssignees,
    updateAssigneeType,
    updateTargetAssignment,
    getTargetAssignment,
    getTotalAssignedTarget,
    validateAssignments,
    resetState,
    setSubmitting,
    setErrors,
  };
};
