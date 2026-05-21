"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell } from "@/components/ui/table";
import { Kpi, Objective } from "@/types/graphql";
import { useKPIListLogic } from "./useKPIListLogic";
import KPITableHeader from "./KPITableHeader";
import KPITableRow from "./KPITableRow";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useKPIsOrder } from "@/hooks/objectives/useKPIsOrder";
import { usePermissions } from "@/hooks/permissions/usePermissions";

interface KPIListProps {
    kpis: Kpi[];
    onEdit: (kpiId: string) => void;
    onRefresh: () => void;
    selected?: string[];
    onSelect?: (id: string) => void;
    onSelectAll?: () => void;
    showBulkActions?: boolean;
    strategicTargetsById?: Record<string, Record<string, number>>;
    kpiRejectionReasons?: Record<string, string>;
    childQuartersByParentId?: Record<string, Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>>;
    currentObjective?: Partial<Objective> | null;
    allKpis?: Kpi[];
    enableSorting?: boolean;
}

const KPIList: React.FC<KPIListProps> = ({
    kpis: initialKpis,
    onEdit,
    onRefresh,
    selected = [],
    onSelect,
    onSelectAll,
    showBulkActions = false,
    strategicTargetsById,
    kpiRejectionReasons,
    childQuartersByParentId,
    allKpis = initialKpis,
    currentObjective,
    enableSorting = false,
}) => {
    const [kpis, setKpis] = useState(initialKpis);
    const { saveOrder } = useKPIsOrder();
    const { can } = usePermissions();

    useEffect(() => {
        setKpis(initialKpis);
    }, [initialKpis]);

    const { columnHeaders, showReasonColumn } = useKPIListLogic(kpis);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = kpis.findIndex((k) => k.kpiId === active.id);
            const newIndex = kpis.findIndex((k) => k.kpiId === over.id);

            const reorderedKpis = arrayMove(kpis, oldIndex, newIndex);
            setKpis(reorderedKpis);

            try {
                const updates = reorderedKpis.map((kpi, index) => ({
                    kpiId: kpi.kpiId,
                    order: index + 1,
                }));
                await saveOrder(updates);
                onRefresh();
            } catch (error) {
                setKpis(kpis); // Revert on error
            }
        }
    };

    const allSelected = showBulkActions && kpis.length > 0 && kpis.every((k) => selected.includes(k.kpiId));

    if (kpis.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No KPIs found for this objective.</p>
                <p className="text-sm text-gray-400 mt-1">Add a KPI to start tracking performance.</p>
            </div>
        );
    }

    const canReorder = enableSorting && (can("objectives:update_all") || can("kpis:update_all"));

    return (
        <div className="overflow-x-auto rounded-lg border shadow-sm bg-white">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <Table>
                    <KPITableHeader
                        showBulkActions={showBulkActions}
                        allSelected={allSelected}
                        onSelectAll={onSelectAll}
                        showLevelSpecificColumn={columnHeaders.showSecondColumn}
                        columnHeaders={columnHeaders}
                        showReasonColumn={showReasonColumn}
                        enableSorting={canReorder}
                    />
                    <TableBody>
                        <SortableContext
                            items={kpis.map((k) => k.kpiId)}
                            strategy={verticalListSortingStrategy}
                        >
                            {kpis.map((kpi, idx) => (
                                <KPITableRow
                                    key={kpi.kpiId}
                                    kpi={kpi}
                                    idx={idx}
                                    selected={selected.includes(kpi.kpiId)}
                                    onSelect={onSelect || (() => { })}
                                    onEdit={onEdit}
                                    onRefresh={onRefresh}
                                    showBulkActions={showBulkActions}
                                    showLevelSpecificColumn={columnHeaders.showSecondColumn}
                                    columnHeaders={columnHeaders}
                                    strategicTargetsById={strategicTargetsById}
                                    kpiRejectionReasons={kpiRejectionReasons}
                                    childQuartersByParentId={childQuartersByParentId}
                                    allKpis={allKpis}
                                    currentObjectiveType={currentObjective?.type}
                                    enableSorting={canReorder}
                                />
                            ))}
                        </SortableContext>
                    </TableBody>
                </Table>
            </DndContext>
        </div>
    );
};

export default KPIList;
