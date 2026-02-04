import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ObjectiveTableHeaderProps {
    onSelectAll?: () => void;
    allSelected: boolean;
    showLevelSpecificColumn: boolean;
    columnHeaders: { firstColumn: string; secondColumn: string | null };
    sortConfig?: { key: string; direction: "asc" | "desc" } | null;
    onSort?: (key: string) => void;
    enableSorting?: boolean;
}

const ObjectiveTableHeader: React.FC<ObjectiveTableHeaderProps> = ({
    onSelectAll,
    allSelected,
    showLevelSpecificColumn,
    columnHeaders,
    sortConfig,
    onSort,
    enableSorting,
}) => {
    const renderSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return null;
        return sortConfig.direction === "asc" ? (
            <ChevronUp className="inline ml-1 h-3 w-3" />
        ) : (
            <ChevronDown className="inline ml-1 h-3 w-3" />
        );
    };

    const handleSort = (key: string) => {
        if (onSort) onSort(key);
    };

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

                <TableHead
                    className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("name")}
                >
                    {columnHeaders.firstColumn}
                    {renderSortIcon("name")}
                </TableHead>

                {showLevelSpecificColumn && (
                    <TableHead
                        className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => handleSort("name")}
                    >
                        {columnHeaders.secondColumn}
                        {renderSortIcon("name")}
                    </TableHead>
                )}

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
                    Progress
                </TableHead>

                <TableHead
                    className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("status")}
                >
                    Status
                    {renderSortIcon("status")}
                </TableHead>

                <TableHead
                    className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("createdAt")}
                >
                    Created
                    {renderSortIcon("createdAt")}
                </TableHead>

                <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3 w-16 text-right">
                    Actions
                </TableHead>
            </TableRow>
        </TableHeader>
    );
};

export default ObjectiveTableHeader;
