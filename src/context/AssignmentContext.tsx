"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
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
    toggleAssignee: (assignee: { id: string; name: string; type: AssigneeType }, checked: boolean) => void;
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

    // Bulk Assignment Helper
    bulkAssignmentValues: Record<string, number>;
    setBulkAssignmentValue: (kpiId: string, value: number) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

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

    // Initialize assigneeType based on objective level
    const [assigneeType, setAssigneeType] = useState<AssigneeType>(() => {
        if (objective.type === "DIVISION") return "DEPARTMENT";
        if (objective.type === "DEPARTMENT") return "PERSONNEL";
        return "DIVISION"; // Default for CORPORATE or others
    });

    const [selectedAssignees, setSelectedAssignees] = useState<{ id: string; name: string; type: AssigneeType }[]>([]);

    // Auto-select all available KPIs by default
    const [selectedKPIs, setSelectedKPIs] = useState<string[]>(() => kpis.map(k => k.kpiId));

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [targets, setTargets] = useState<Record<string, Record<string, number | null>>>({});
    const [bulkAssignmentValues, setBulkAssignmentValues] = useState<Record<string, number>>({});

    // Actions
    const toggleAssignee = useCallback((assignee: { id: string; name: string; type: AssigneeType }, checked: boolean) => {
        setSelectedAssignees((prev) =>
            checked ? [...prev, assignee] : prev.filter((a) => a.id !== assignee.id)
        );
    }, []);

    const clearSelectedAssignees = useCallback(() => {
        setSelectedAssignees([]);
    }, []);

    const toggleKPI = useCallback((id: string, checked: boolean) => {
        setSelectedKPIs((prev) =>
            checked ? [...prev, id] : prev.filter((pid) => pid !== id)
        );
    }, []);

    const selectAllKPIs = useCallback((checked: boolean) => {
        setSelectedKPIs(checked ? kpis.map(k => k.kpiId) : []);
    }, [kpis]);

    const addAssignment = useCallback((newAssignment: Assignment) => {
        console.log("[AssignmentContext] addAssignment called", newAssignment);
        setAssignments((prev) => {
            const updated = [...prev, newAssignment];
            console.log("[AssignmentContext] assignments updated", updated);
            return updated;
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
    }, []);

    const setTarget = useCallback((kpiId: string, assigneeId: string, value: number | null) => {
        setTargets((prev) => ({
            ...prev,
            [kpiId]: {
                ...(prev[kpiId] || {}),
                [assigneeId]: value
            }
        }));
    }, []);

    const setBulkAssignmentValue = useCallback((kpiId: string, value: number) => {
        setBulkAssignmentValues((prev) => ({ ...prev, [kpiId]: value }));
    }, []);

    // Initialize defaults when objective changes or opens
    // For now, we assume the provider is mounted fresh for each dialog open.

    const value = useMemo(() => ({
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
        bulkAssignmentValues,
        setBulkAssignmentValue
    }), [
        objective,
        kpis,
        searchTerm,
        assigneeType,
        selectedAssignees,
        selectedKPIs,
        assignments,
        targets,
        bulkAssignmentValues,
        toggleAssignee,
        clearSelectedAssignees,
        toggleKPI,
        selectAllKPIs,
        addAssignment,
        removeAssignment,
        clearAssignments,
        setTarget,
        setBulkAssignmentValue
    ]);

    return (
        <AssignmentContext.Provider value={value}>
            {children}
        </AssignmentContext.Provider>
    );
}

export function useAssignmentContext() {
    const context = useContext(AssignmentContext);
    if (context === undefined) {
        throw new Error("useAssignmentContext must be used within an AssignmentProvider");
    }
    return context;
}
