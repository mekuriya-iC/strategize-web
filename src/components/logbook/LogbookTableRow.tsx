"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, FileIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@apollo/client";
import { REMOVE_LOGBOOK_ENTRY } from "@/lib/graphql/mutations/logbook";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface LogbookTableRowProps {
  item: LogbookItem;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onRefetch: () => void;
  onEditEntry?: (entry: LogbookItem) => void;
}

export function LogbookTableRow({
  item,
  isSelected,
  onSelect,
  onRefetch,
  onEditEntry,
}: LogbookTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteEntry, { loading }] = useMutation(REMOVE_LOGBOOK_ENTRY, {
    refetchQueries: ["GetLogbookEntries"],
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      await deleteEntry({
        variables: { logbookEntryId: item.id },
      });
      toast.success("Entry deleted successfully");
      onRefetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete entry");
      console.error(error);
    }
  };

  const handleEdit = () => {
    if (onEditEntry) {
      onEditEntry(item);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {/* Checkbox */}
        <td className="px-4 py-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select ${item.activity}`}
          />
        </td>

        {/* Date & Time */}
        <td className="px-4 py-4">
          <div className="text-sm text-gray-900 dark:text-white">
            {format(new Date(item.entryDate), "MMM d, yyyy")}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(item.entryDate), "h:mm a")}
          </div>
        </td>

        {/* Activity */}
        <td className="px-4 py-4">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {item.activity}
          </span>
        </td>

        {/* Description */}
        <td className="px-4 py-4 max-w-xs">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.description || "-"}
          </p>
        </td>

        {/* Outcome */}
        <td className="px-4 py-4 max-w-xs">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.outcome || "-"}
          </p>
        </td>

        {/* Attachment */}
        <td className="px-4 py-4">
          {item.attachmentUrl ? (
            <div className="flex items-center gap-1 text-[#3838EC]">
              <FileIcon className="w-4 h-4" />
              <span className="text-xs">File</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">None</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              disabled={loading}
              className="text-[#3838EC] hover:text-[#2d2dbd] hover:bg-[#ECECFF]"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className="bg-gray-50 dark:bg-gray-900/50">
          <td colSpan={7} className="px-4 py-4">
            <div className="space-y-3 text-sm">
              {item.description && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              )}
              {item.outcome && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Outcome:</span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{item.outcome}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {format(new Date(item.updatedAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
