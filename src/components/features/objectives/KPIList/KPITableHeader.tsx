import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import type { ColumnHeaderControls } from "@/hooks/table/useTableColumnControls";

interface KPITableHeaderProps {
  showBulkActions: boolean;
  allSelected: boolean;
  onSelectAll?: () => void;
  showLevelSpecificColumn: boolean;
  columnHeaders: { firstColumn: string; secondColumn: string | null };
  showReasonColumn: boolean;
  enableSorting?: boolean;
  getHeaderProps: (key: string) => ColumnHeaderControls;
}

const KPITableHeader: React.FC<KPITableHeaderProps> = ({
  showBulkActions,
  allSelected,
  onSelectAll,
  showLevelSpecificColumn,
  columnHeaders,
  showReasonColumn,
  enableSorting = false,
  getHeaderProps,
}) => {
  return (
    <TableHeader>
      <TableRow className="bg-muted/60 hover:bg-muted/60 border-b">
        {enableSorting && <TableHead className="w-10 px-2" />}
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
          <SortableFilterableHeader
            label={columnHeaders.firstColumn}
            {...getHeaderProps("firstColumn")}
          />
        </TableHead>

        {showLevelSpecificColumn && (
          <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
            <SortableFilterableHeader
              label={columnHeaders.secondColumn ?? ""}
              {...getHeaderProps("secondColumn")}
            />
          </TableHead>
        )}

        <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
          <SortableFilterableHeader
            label="Baseline"
            filterable={false}
            {...getHeaderProps("baseline")}
          />
        </TableHead>
        <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
          <SortableFilterableHeader
            label="Weight (%)"
            filterable={false}
            {...getHeaderProps("weight")}
          />
        </TableHead>
        <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
          <SortableFilterableHeader
            label="Targets"
            filterable={false}
            {...getHeaderProps("targets")}
          />
        </TableHead>
        <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
          <SortableFilterableHeader
            label="Mode"
            filterType="select"
            filterOptions={[
              { value: "AGGREGATED", label: "Aggregated" },
              { value: "INDIVIDUAL", label: "Individual" },
              { value: "HYBRID", label: "Hybrid" },
            ]}
            {...getHeaderProps("mode")}
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

        {showReasonColumn && (
          <TableHead className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider px-6 py-3">
            <SortableFilterableHeader
              label="Reason"
              {...getHeaderProps("reason")}
            />
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
