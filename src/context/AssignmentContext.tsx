"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { Objective, Kpi } from "@/types/graphql";

export type AssigneeType = "DIVISION" | "DEPARTMENT" | "PERSONNEL";

export interface Assignment {
  assigneeId: string;
  assigneeType: AssigneeType;
  assigneeName: string;
  kpis: string[]; // KPI IDs to be assigned
}

interface AssignmentContextType {
  // Configuration
  sourceObjective: Objective | null;
  availableKPIs: Kpi[];

  // Search & Filter State
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Selection State
  assigneeType: AssigneeType;
  setAssigneeType: (type: AssigneeType) => void;

  selectedAssignees: { id: string; name: string; type: AssigneeType }[]; // Objects of currently selected items in the tab
  toggleAssignee: (
    assignee: { id: string; name: string; type: AssigneeType },
    checked: boolean,
  ) => void;
  clearSelectedAssignees: () => void;

  selectedKPIs: string[]; // IDs of KPIs selected for the NEXT assignment
  toggleKPI: (id: string, checked: boolean) => void;
  selectAllKPIs: (checked: boolean) => void;

  // Assignments State (The list of "staged" assignments)
  assignments: Assignment[];
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (index: number) => void;
  clearAssignments: () => void;

  // Target values for assignments (kpiId -> assigneeId -> value)
  // We use a flat structure or nested map. Let's stick to the hook's original pattern or improve.
  // The original hook used `updateTargetAssignment` on a Ref or state.
  // Let's keep it simple: We need to store targets for the *staged* assignments.
  // actually, the original code stored targets in a separate state managed by `useAssignmentState`.
  // We will bring that here.
  targets: Record<string, Record<string, number | null>>; // kpiId -> { assigneeId: targetValue }
  setTarget: (kpiId: string, assigneeId: string, value: number | null) => void;
  directBasisAllocations: Record<string, Record<string, string>>;
  setDirectBasisAllocation: (
    kpiId: string,
    assigneeId: string,
    value: string,
  ) => void;

  // Bulk Assignment Helper
  bulkAssignmentValues: Record<string, number>;
  setBulkAssignmentValue: (kpiId: string, value: number) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(
  undefined,
);

export function AssignmentProvider({
  children,
  objective,
  kpis,
}: {
  children: React.ReactNode;
  objective: Objective;
  kpis: Kpi[];
}) {
  // State
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize assigneeType based on the current objective level. For older cascaded
  // objectives, `type` may still be CORPORATE, so prefer `assigneeType` when present.
  const [assigneeType, setAssigneeType] = useState<AssigneeType>(() => {
    const currentLevel = objective.assigneeType || objective.type;
    if (currentLevel === "DIVISION") return "DEPARTMENT";
    if (currentLevel === "DEPARTMENT") return "PERSONNEL";
    return "DIVISION"; // Default for CORPORATE or others
  });

  const [selectedAssignees, setSelectedAssignees] = useState<
    { id: string; name: string; type: AssigneeType }[]
  >([]);

  const assignableKPIs = useMemo(
    () => kpis.filter((k) => (k.kpiMode || "AGGREGATED") !== "DIRECT"),
    [kpis],
  );

  // Auto-select all cascade-able KPIs by default. DIRECT KPIs stay with the current manager.
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>(() =>
    assignableKPIs.map((k) => k.kpiId),
  );

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [targets, setTargets] = useState<
    Record<string, Record<string, number | null>>
  >({});
  const [directBasisAllocations, setDirectBasisAllocations] = useState<
    Record<string, Record<string, string>>
  >({});
  const [bulkAssignmentValues, setBulkAssignmentValues] = useState<
    Record<string, number>
  >({});

  // Actions
  const toggleAssignee = useCallback(
    (
      assignee: { id: string; name: string; type: AssigneeType },
      checked: boolean,
    ) => {
      setSelectedAssignees((prev) =>
        checked
          ? [...prev, assignee]
          : prev.filter((a) => a.id !== assignee.id),
      );
    },
    [],
  );

  const clearSelectedAssignees = useCallback(() => {
    setSelectedAssignees([]);
  }, []);

  const toggleKPI = useCallback(
    (id: string, checked: boolean) => {
      const selectedKpi = assignableKPIs.find((k) => k.kpiId === id);
      if (checked && !selectedKpi) return;

      setSelectedKPIs((prev) => {
        if (!checked) {
          const requiredBySelectedRate = assignableKPIs.some(
            (kpi) =>
              prev.includes(kpi.kpiId) &&
              kpi.calculationBasisSource === "LINKED_KPI" &&
              kpi.weightingBasisKpiId === id,
          );
          return requiredBySelectedRate
            ? prev
            : prev.filter((selectedId) => selectedId !== id);
        }
        const linkedBasisId =
          selectedKpi?.calculationBasisSource === "LINKED_KPI"
            ? selectedKpi.weightingBasisKpiId
            : null;
        const linkedBasisIsAssignable = assignableKPIs.some(
          (kpi) => kpi.kpiId === linkedBasisId,
        );
        return [
          ...new Set([
            ...prev,
            id,
            ...(linkedBasisId && linkedBasisIsAssignable ? [linkedBasisId] : []),
          ]),
        ];
      });
    },
    [assignableKPIs],
  );

  const selectAllKPIs = useCallback(
    (checked: boolean) => {
      setSelectedKPIs(checked ? assignableKPIs.map((k) => k.kpiId) : []);
    },
    [assignableKPIs],
  );

  const addAssignment = useCallback((newAssignment: Assignment) => {
    setAssignments((previous) => {
      const existingIndex = previous.findIndex(
        (assignment) =>
          assignment.assigneeType === newAssignment.assigneeType &&
          assignment.assigneeId === newAssignment.assigneeId,
      );
      if (existingIndex < 0) return [...previous, newAssignment];

      return previous.map((assignment, index) =>
        index === existingIndex
          ? {
              ...assignment,
              assigneeName: newAssignment.assigneeName,
              kpis: [...new Set([...assignment.kpis, ...newAssignment.kpis])],
            }
          : assignment,
      );
    });
  }, []);

  const removeAssignment = useCallback((index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
    // Note: We deliberately don't clean up targets immediately to avoid complex sync logic,
    // but in a production app we might want to clean up targets for removed assignees.
  }, []);

  const clearAssignments = useCallback(() => {
    setAssignments([]);
    setTargets({});
    setDirectBasisAllocations({});
  }, []);

  const setTarget = useCallback(
    (kpiId: string, assigneeId: string, value: number | null) => {
      setTargets((prev) => ({
        ...prev,
        [kpiId]: {
          ...(prev[kpiId] || {}),
          [assigneeId]: value,
        },
      }));
    },
    [],
  );

  const setDirectBasisAllocation = useCallback(
    (kpiId: string, assigneeId: string, value: string) => {
      setDirectBasisAllocations((prev) => ({
        ...prev,
        [kpiId]: {
          ...(prev[kpiId] || {}),
          [assigneeId]: value,
        },
      }));
    },
    [],
  );

  const setBulkAssignmentValue = useCallback((kpiId: string, value: number) => {
    setBulkAssignmentValues((prev) => ({ ...prev, [kpiId]: value }));
  }, []);

  // Initialize defaults when objective changes or opens
  // For now, we assume the provider is mounted fresh for each dialog open.

  const value = useMemo(
    () => ({
      sourceObjective: objective,
      availableKPIs: kpis,
      searchTerm,
      setSearchTerm,
      assigneeType,
      setAssigneeType,
      selectedAssignees,
      toggleAssignee,
      clearSelectedAssignees,
      selectedKPIs,
      toggleKPI,
      selectAllKPIs,
      assignments,
      addAssignment,
      removeAssignment,
      clearAssignments,
      targets,
      setTarget,
      directBasisAllocations,
      setDirectBasisAllocation,
      bulkAssignmentValues,
      setBulkAssignmentValue,
    }),
    [
      objective,
      kpis,
      searchTerm,
      assigneeType,
      selectedAssignees,
      selectedKPIs,
      assignments,
      targets,
      directBasisAllocations,
      bulkAssignmentValues,
      toggleAssignee,
      clearSelectedAssignees,
      toggleKPI,
      selectAllKPIs,
      addAssignment,
      removeAssignment,
      clearAssignments,
      setTarget,
      setDirectBasisAllocation,
      setBulkAssignmentValue,
    ],
  );

  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignmentContext() {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error(
      "useAssignmentContext must be used within an AssignmentProvider",
    );
  }
  return context;
}
