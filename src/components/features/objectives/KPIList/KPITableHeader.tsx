import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface KPITableHeaderProps {
    showBulkActions: boolean;
    allSelected: boolean;
    onSelectAll?: () => void;
    showLevelSpecificColumn: boolean;
    columnHeaders: { firstColumn: string; secondColumn: string | null };
    showReasonColumn: boolean;
}

const KPITableHeader: React.FC<KPITableHeaderProps> = ({
    showBulkActions,
    allSelected,
    onSelectAll,
    showLevelSpecificColumn,
    columnHeaders,
    showReasonColumn,
}) => {
    return (
        <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60 border-b">
                {showBulkActions && (
                    <TableHead className="px-6 py-3 w-12">
                        {onSelectAll && (
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onSelectAll}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        )}
                    </TableHead>
                )}

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    {columnHeaders.firstColumn}
                </TableHead>

                {showLevelSpecificColumn && (
                    <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                        {columnHeaders.secondColumn}
                    </TableHead>
                )}

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    Baseline
                </TableHead>
                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    Weight (%)
                </TableHead>
                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    Targets
                </TableHead>
                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    Status
                </TableHead>

                {showReasonColumn && (
                    <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                        Reason
                    </TableHead>
                )}

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3 w-16 text-right">
                    Actions
                </TableHead>
            </TableRow>
        </TableHeader>
    );
};

export default KPITableHeader;
