"use client";

import { useMemo } from "react";
import {
  DataTableCards,
  DataTableDesktop,
} from "@/components/ui/responsive-table";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";
import { Checkbox } from "@/components/ui/checkbox";
import { LogbookTableRow } from "./LogbookTableRow";
import { LogbookTableCard } from "./LogbookTableCard";
import type { FrontendLogbookItem } from "@/types/logbook";

interface LogbookTableProps {
  data: FrontendLogbookItem[];
  selectedItems: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (id: string, checked: boolean) => void;
  onRefetch: () => void;
  onEditEntry?: (entry: FrontendLogbookItem) => void;
}

const thClass =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400";

export function LogbookTable({
  data,
  selectedItems,
  onSelectAll,
  onSelectItem,
  onRefetch,
  onEditEntry,
}: LogbookTableProps) {
  const columns = useMemo(
    () => [
      {
        id: "entryDate",
        accessor: (item: FrontendLogbookItem) => item.entryDate,
        compare: (a: FrontendLogbookItem, b: FrontendLogbookItem) =>
          new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime(),
      },
      {
        id: "activity",
        accessor: (item: FrontendLogbookItem) => item.activity,
      },
      {
        id: "description",
        accessor: (item: FrontendLogbookItem) => item.description,
      },
      {
        id: "outcome",
        accessor: (item: FrontendLogbookItem) => item.outcome,
      },
      {
        id: "attachment",
        accessor: (item: FrontendLogbookItem) =>
          item.attachmentUrl || (item.evidenceItems?.length ?? 0) > 0
            ? "yes"
            : "no",
        filterFn: (item: FrontendLogbookItem, value: string) => {
          const hasAttachment =
            !!item.attachmentUrl || (item.evidenceItems?.length ?? 0) > 0;
          return value === "yes" ? hasAttachment : !hasAttachment;
        },
      },
    ],
    [],
  );

  const { processedRows, getHeaderProps } = useTableColumnControls({
    rows: data,
    columns,
    initialSort: { key: "entryDate", direction: "desc" },
    allowUnsorted: true,
  });

  const allSelected = data.length > 0 && selectedItems.length === data.length;
  const someSelected =
    selectedItems.length > 0 && selectedItems.length < data.length;

  const dateHdr = getHeaderProps("entryDate");
  const activityHdr = getHeaderProps("activity");
  const descriptionHdr = getHeaderProps("description");
  const outcomeHdr = getHeaderProps("outcome");
  const attachmentHdr = getHeaderProps("attachment");

  return (
    <>
      <DataTableDesktop className="overflow-hidden border border-t-0 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[720px]">
            <thead className="sticky top-0 z-[1] border-b border-gray-200 bg-gray-50/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all"
                    className={
                      someSelected ? "data-[state=checked]:bg-[#3838EC]" : ""
                    }
                  />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="Date & Time"
                    filterable={false}
                    {...dateHdr}
                  />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader label="Activity" {...activityHdr} />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="Description"
                    {...descriptionHdr}
                  />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader label="Outcome" {...outcomeHdr} />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="Attachment"
                    filterType="select"
                    filterOptions={[
                      { value: "yes", label: "Has attachment" },
                      { value: "no", label: "No attachment" },
                    ]}
                    {...attachmentHdr}
                  />
                </th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {processedRows.map((item) => (
                <LogbookTableRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={(checked) => onSelectItem(item.id, checked)}
                  onRefetch={onRefetch}
                  onEditEntry={onEditEntry}
                />
              ))}
            </tbody>
          </table>
        </div>
      </DataTableDesktop>

      <DataTableCards className="space-y-4 p-4">
        {processedRows.map((item) => (
          <LogbookTableCard
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={(checked) => onSelectItem(item.id, checked)}
            onRefetch={onRefetch}
            onEditEntry={onEditEntry}
          />
        ))}
      </DataTableCards>
    </>
  );
}
