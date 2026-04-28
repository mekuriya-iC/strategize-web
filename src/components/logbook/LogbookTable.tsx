"use client";

import { LogbookTableRow } from "./LogbookTableRow";
import { LogbookTableCard } from "./LogbookTableCard";
import { Checkbox } from "@/components/ui/checkbox";

interface LogbookItem {
  id: string;
  activity: string;
  description: string;
  outcome: string;
  entryDate: string;
  attachmentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: any;
}

interface LogbookTableProps {
  data: LogbookItem[];
  selectedItems: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (id: string, checked: boolean) => void;
  onRefetch: () => void;
  onEditEntry?: (entry: LogbookItem) => void;
}

export function LogbookTable({
  data,
  selectedItems,
  onSelectAll,
  onSelectItem,
  onRefetch,
  onEditEntry,
}: LogbookTableProps) {
  const allSelected = data.length > 0 && selectedItems.length === data.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all"
                    className={someSelected ? "data-[state=checked]:bg-[#3838EC]" : ""}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  DATE & TIME
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ACTIVITY
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  DESCRIPTION
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  OUTCOME
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ATTACHMENT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item) => (
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
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {data.map((item) => (
          <LogbookTableCard
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={(checked) => onSelectItem(item.id, checked)}
            onRefetch={onRefetch}
            onEditEntry={onEditEntry}
          />
        ))}
      </div>
    </>
  );
}
