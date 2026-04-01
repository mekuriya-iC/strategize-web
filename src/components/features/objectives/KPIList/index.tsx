"use client";

import React from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Kpi, Objective } from "@/types/graphql";
import { useKPIListLogic } from "./useKPIListLogic";
import KPITableHeader from "./KPITableHeader";
import KPITableRow from "./KPITableRow";

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
}

const KPIList: React.FC<KPIListProps> = ({
    kpis,
    onEdit,
    onRefresh,
    selected = [],
    onSelect,
    onSelectAll,
    showBulkActions = false,
    strategicTargetsById,
    kpiRejectionReasons,
    childQuartersByParentId,
    allKpis = kpis,
    currentObjective,
}) => {
    const { columnHeaders, showReasonColumn } = useKPIListLogic(kpis);

    const allSelected = showBulkActions && kpis.length > 0 && kpis.every((k) => selected.includes(k.kpiId));

    if (kpis.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No KPIs found for this objective.</p>
                <p className="text-sm text-gray-400 mt-1">Add a KPI to start tracking performance.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border shadow-sm bg-white">
            <Table>
                <KPITableHeader
                    showBulkActions={showBulkActions}
                    allSelected={allSelected}
                    onSelectAll={onSelectAll}
                    showLevelSpecificColumn={columnHeaders.showSecondColumn}
                    columnHeaders={columnHeaders}
                    showReasonColumn={showReasonColumn}
                />
                <TableBody>
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
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default KPIList;
