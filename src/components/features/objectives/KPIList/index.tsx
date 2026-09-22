"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, TableBody } from "@/components/ui/table";
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
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";
import { usesAnnualOnlyKpiTargets } from "@/lib/objectives/kpiWeightScope";

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
  childQuartersByParentId?: Record<
    string,
    Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>
  >;
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
  const [kpis, setKpis] = useState(() => {
    if (!enableSorting) return initialKpis;
    return [...initialKpis].sort(
      (a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0),
    );
  });
  const { saveOrder } = useKPIsOrder();
  const { can, guards } = usePermissions();

  useEffect(() => {
    if (!enableSorting) {
      setKpis(initialKpis);
      return;
    }

    setKpis(
      [...initialKpis].sort(
        (a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0),
      ),
    );
  }, [initialKpis, enableSorting]);

  const { columnHeaders, showReasonColumn } = useKPIListLogic(kpis);

  const columns = useMemo(
    () => [
      {
        id: "firstColumn",
        accessor: (kpi: Kpi) =>
          kpi.parent?.name?.trim() || (kpi.name || "").trim(),
      },
      {
        id: "secondColumn",
        accessor: (kpi: Kpi) => {
          if (usesAnnualOnlyKpiTargets(kpi.objective) && !kpi.parent) {
            return "N/A";
          }
          return (kpi.name || "").trim();
        },
      },
      {
        id: "baseline",
        accessor: (kpi: Kpi) => kpi.baseline ?? "",
      },
      {
        id: "weight",
        accessor: (kpi: Kpi) => kpi.weight ?? 0,
      },
      {
        id: "targets",
        accessor: (kpi: Kpi) => kpi.targets?.length ?? 0,
      },
      {
        id: "mode",
        accessor: (kpi: Kpi) => kpi.kpiMode || "AGGREGATED",
        filterFn: (kpi: Kpi, value: string) =>
          (kpi.kpiMode || "AGGREGATED") === value,
      },
      {
        id: "status",
        accessor: (kpi: Kpi) => kpi.status,
        filterFn: (kpi: Kpi, value: string) => kpi.status === value,
      },
      {
        id: "reason",
        accessor: (kpi: Kpi) => kpiRejectionReasons?.[kpi.kpiId] ?? "",
      },
    ],
    [kpiRejectionReasons],
  );

  const { processedRows, getHeaderProps } = useTableColumnControls({
    rows: kpis,
    columns,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = kpis.findIndex((k) => k.kpiId === active.id);
      const newIndex = kpis.findIndex((k) => k.kpiId === over.id);

      const reorderedKpis = arrayMove(kpis, oldIndex, newIndex);

      // Assign new orders to the objects themselves for optimistic UI stability
      const reorderedWithNewOrders = reorderedKpis.map((kpi, index) => ({
        ...kpi,
        order: index + 1,
      }));

      setKpis(reorderedWithNewOrders);

      try {
        const updates = reorderedWithNewOrders.map((kpi) => ({
          kpiId: kpi.kpiId,
          order: kpi.order,
        }));
        await saveOrder(updates);
        onRefresh();
      } catch {
        setKpis(kpis); // Revert on error
      }
    }
  };

  const allSelected =
    showBulkActions &&
    processedRows.length > 0 &&
    processedRows.every((k) => selected.includes(k.kpiId));

  if (kpis.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
        <p className="text-gray-500 font-medium">
          No KPIs found for this objective.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Add a KPI to start tracking performance.
        </p>
      </div>
    );
  }

  // Match objective-table behavior: allow reorder for management roles too,
  // not only global update_all permissions.
  const canReorder =
    enableSorting &&
    (can("objectives:update_all") ||
      can("kpis:update_all") ||
      guards.isSuperAdmin ||
      guards.isAdmin ||
      guards.isDirector ||
      guards.isManager);

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
            getHeaderProps={getHeaderProps}
          />
          <TableBody>
            <SortableContext
              items={processedRows.map((k) => k.kpiId)}
              strategy={verticalListSortingStrategy}
            >
              {processedRows.map((kpi, idx) => (
                <KPITableRow
                  key={kpi.kpiId}
                  kpi={kpi}
                  idx={idx}
                  selected={selected.includes(kpi.kpiId)}
                  onSelect={onSelect || (() => {})}
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
