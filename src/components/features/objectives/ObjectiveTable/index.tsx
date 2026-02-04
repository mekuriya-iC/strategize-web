"use client";

import React, { useState } from "react";
import {
    DndContext,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Objective, Kpi } from "@/types/graphql";
export type { Objective };
import { useObjectiveTableLogic } from "./useObjectiveTableLogic";
import ObjectiveTableHeader from "./ObjectiveTableHeader";
import ObjectiveTableRow from "./ObjectiveTableRow";
import ExpandedKPIs from "./ExpandedKPIs";

interface ObjectiveTableProps {
    objectives: Objective[];
    allObjectives?: Objective[];
    kpis: Kpi[];
    selected: string[];
    expanded: string | null;
    onSelect: (id: string) => void;
    onSelectAll?: () => void;
    onExpand: (id: string) => void;
    onObjectiveClick: (objective: Objective) => void;
    onViewObjective?: (objective: Objective) => void;
    onEditSuccess?: () => void;
    onDeleteObjective?: (objective: Objective) => void;
    onAssignSuccess?: () => void;
    loading?: boolean;
    error?: string;
    objectiveRejectionReasons?: Record<string, string>;
    kpiRejectionReasons?: Record<string, string>;
    childQuartersByParentId?: Record<string, Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>>;
    enableSorting?: boolean;
    onOrderChange?: (objectives: Objective[]) => void;
    sortConfig?: { key: string; direction: "asc" | "desc" } | null;
    onSort?: (key: string) => void;
    groupBy?: "none" | "division" | "department" | "personnel";
    unitNames?: Record<string, string>;
}

const ObjectiveTable: React.FC<ObjectiveTableProps> = (props) => {
    const {
        objectives,
        allObjectives = objectives,
        kpis,
        selected,
        expanded,
        onSelect,
        onSelectAll,
        onExpand,
        onObjectiveClick,
        onViewObjective,
        onEditSuccess,
        onDeleteObjective,
        onAssignSuccess,
        loading = false,
        error,
        kpiRejectionReasons,
        childQuartersByParentId,
        enableSorting = false,
        onOrderChange,
        sortConfig = null,
        onSort,
        groupBy = "none",
        unitNames = {},
    } = props;

    const {
        sortedObjectives,
        groupedObjectives,
        groupKeys,
        columnHeaders,
        expandedGroups,
        toggleGroup,
        sensors,
        handleDragStart,
        handleDragEnd,
        objectiveIds,
        activeObjective,
        isSaving,
    } = useObjectiveTableLogic({
        objectives,
        allObjectives,
        kpis,
        groupBy,
        enableSorting,
        onOrderChange,
        sortConfig,
    });

    if (loading) {
        return (
            <div className="rounded-lg border bg-white p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-4 text-gray-500 font-medium">Loading objectives...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border bg-red-50 p-12 text-center">
                <p className="text-red-600 font-medium">Error loading objectives: {error}</p>
            </div>
        );
    }

    if (objectives.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-gray-50/50 p-12 text-center">
                <p className="text-gray-500 font-medium">No objectives found.</p>
                <p className="text-sm text-gray-400 mt-1">Change your filters or add a new objective.</p>
            </div>
        );
    }

    const allSelected = objectives.length > 0 && objectives.every((obj) => selected.includes(obj.objectiveId));
    const totalColumnCount = (enableSorting ? 1 : 0) + (columnHeaders.showSecondColumn ? 1 : 0) + 9;

    const tableContent = (
        <Table>
            <ObjectiveTableHeader
                onSelectAll={onSelectAll}
                allSelected={allSelected}
                showLevelSpecificColumn={columnHeaders.showSecondColumn}
                columnHeaders={columnHeaders}
                sortConfig={sortConfig}
                onSort={onSort}
                enableSorting={enableSorting}
            />
            <TableBody>
                {groupKeys.map((groupId) => {
                    const groupObjectives = groupedObjectives[groupId];
                    const isGroupExpanded = groupBy === "none" || expandedGroups[groupId] !== false;
                    const groupName = unitNames[groupId] || (groupId === "Unassigned" ? "Unassigned" : groupId);

                    return (
                        <React.Fragment key={groupId}>
                            {groupBy !== "none" && (
                                <TableRow
                                    className="bg-gray-50/80 hover:bg-gray-100/80 cursor-pointer transition-colors border-l-4 border-l-blue-500"
                                    onClick={() => toggleGroup(groupId)}
                                >
                                    <TableCell colSpan={totalColumnCount} className="px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {expandedGroups[groupId] === false ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                <span className="font-bold text-gray-700 text-sm">
                                                    {groupBy.toUpperCase()}: {groupName} ({groupObjectives.length})
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {isGroupExpanded && groupObjectives.map((obj, idx) => (
                                <React.Fragment key={obj.objectiveId}>
                                    <ObjectiveTableRow
                                        objective={obj}
                                        idx={idx}
                                        kpis={kpis}
                                        selected={selected.includes(obj.objectiveId)}
                                        onSelect={onSelect}
                                        expanded={expanded === obj.objectiveId}
                                        onExpand={onExpand}
                                        onObjectiveClick={onObjectiveClick}
                                        onViewObjective={onViewObjective}
                                        onEditSuccess={onEditSuccess}
                                        onDeleteObjective={onDeleteObjective}
                                        onAssignSuccess={onAssignSuccess}
                                        showLevelSpecificColumn={columnHeaders.showSecondColumn}
                                        columnHeaders={columnHeaders}
                                        unitNames={unitNames}
                                        enableSorting={enableSorting}
                                        allObjectives={allObjectives}
                                    />
                                    {expanded === obj.objectiveId && (
                                        <ExpandedKPIs
                                            objective={obj}
                                            objectiveKPIs={kpis.filter(k => k.objective?.objectiveId === obj.objectiveId)}
                                            totalColumnCount={totalColumnCount}
                                            showReasonColumn={!objectives.every(o => o.type === "CORPORATE") && kpis.some(k => k.status === "REJECTED")}
                                            kpiRejectionReasons={kpiRejectionReasons}
                                            childQuartersByParentId={childQuartersByParentId}
                                            allKpis={kpis}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );

    return (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            {enableSorting ? (
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={objectiveIds} strategy={verticalListSortingStrategy}>
                        {tableContent}
                    </SortableContext>
                    <DragOverlay>
                        {activeObjective ? (
                            <div className="bg-white shadow-xl rounded-lg border-2 border-blue-400 p-4 opacity-95 flex items-center gap-3">
                                <GripVertical className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="font-bold text-gray-900">{activeObjective.name || "Unnamed Objective"}</p>
                                    <p className="text-xs text-gray-500 uppercase font-medium">{activeObjective.type} OBJECTIVE</p>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            ) : (
                tableContent
            )}
        </div>
    );
};

export default ObjectiveTable;
