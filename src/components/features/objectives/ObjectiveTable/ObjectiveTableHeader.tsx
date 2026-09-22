import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import type { ColumnHeaderControls } from "@/hooks/table/useTableColumnControls";

interface ObjectiveTableHeaderProps {
    onSelectAll?: () => void;
    allSelected: boolean;
    showLevelSpecificColumn: boolean;
    columnHeaders: { firstColumn: string; secondColumn: string | null };
    enableSorting?: boolean;
    getHeaderProps: (key: string) => ColumnHeaderControls;
}

const ObjectiveTableHeader: React.FC<ObjectiveTableHeaderProps> = ({
    onSelectAll,
    allSelected,
    showLevelSpecificColumn,
    columnHeaders,
    enableSorting,
    getHeaderProps,
}) => {
    return (
        <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60 border-b">
                {enableSorting && <TableHead className="w-10" />}
                <TableHead className="px-6 py-3 w-12">
                    {onSelectAll && (
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={onSelectAll}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                    )}
                </TableHead>

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    <SortableFilterableHeader
                        label={columnHeaders.firstColumn}
                        {...getHeaderProps("name")}
                    />
                </TableHead>

                {showLevelSpecificColumn && (
                    <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                        <SortableFilterableHeader
                            label={columnHeaders.secondColumn ?? ""}
                            {...getHeaderProps("levelColumn")}
                        />
                    </TableHead>
                )}

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    <SortableFilterableHeader
                        label="Progress"
                        filterable={false}
                        {...getHeaderProps("progress")}
                    />
                </TableHead>

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    <SortableFilterableHeader
                        label="Status"
                        filterType="select"
                        filterOptions={[
                            { value: "NOT_SUBMITTED", label: "Not Submitted" },
                            { value: "PENDING", label: "Pending" },
                            { value: "APPROVED", label: "Approved" },
                            { value: "REJECTED", label: "Rejected" },
                        ]}
                        {...getHeaderProps("status")}
                    />
                </TableHead>

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    <SortableFilterableHeader
                        label="Created"
                        filterable={false}
                        {...getHeaderProps("createdAt")}
                    />
                </TableHead>

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3 w-16 text-right">
                    Actions
                </TableHead>
            </TableRow>
        </TableHeader>
    );
};

export default ObjectiveTableHeader;
