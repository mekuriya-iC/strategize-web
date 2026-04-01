import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Objective, Kpi } from "@/types/graphql";
import KPIList from "../KPIList";

interface ExpandedKPIsProps {
    objective: Objective;
    objectiveKPIs: Kpi[];
    totalColumnCount: number;
    showReasonColumn: boolean;
    kpiRejectionReasons?: Record<string, string>;
    childQuartersByParentId?: Record<string, Record<string, { q1?: number; q2?: number; q3?: number; q4?: number }>>;
    allKpis?: Kpi[];
}

const statusMap = {
    NOT_SUBMITTED: { label: "Not Submitted", color: "bg-pink-100 text-pink-600" },
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-600" },
    APPROVED: { label: "Approved", color: "bg-green-100 text-green-600" },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

const ExpandedKPIs: React.FC<ExpandedKPIsProps> = ({
    objective,
    objectiveKPIs,
    totalColumnCount,
    showReasonColumn,
    kpiRejectionReasons,
    childQuartersByParentId,
    allKpis,
}) => {
    return (
        <TableRow className="bg-gray-50/50">
            <TableCell colSpan={totalColumnCount} className="px-6 py-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm uppercase tracking-tight">
                            KPIs for {objective.name}
                        </h4>
                    </div>

                    <KPIList
                        kpis={objectiveKPIs}
                        onEdit={() => { }} // View mode in expansion usually
                        onRefresh={() => { }} // Should be handled by parent refetch
                        kpiRejectionReasons={kpiRejectionReasons}
                        childQuartersByParentId={childQuartersByParentId}
                        currentObjective={objective}
                        allKpis={allKpis}
                    />
                </div>
            </TableCell>
        </TableRow>
    );
};

export default ExpandedKPIs;
