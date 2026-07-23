"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  FileIcon,
  CalendarIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@apollo/client";
import { REMOVE_LOGBOOK_ENTRY } from "@/lib/graphql/mutations/logbook";
import { SubmitApprovalDialog } from "./SubmitApprovalDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import type { FrontendLogbookItem } from "@/types/logbook";

interface LogbookTableCardProps {
  item: FrontendLogbookItem;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onRefetch: () => void;
  onEditEntry?: (entry: FrontendLogbookItem) => void;
}

export function LogbookTableCard({
  item,
  isSelected,
  onSelect,
  onRefetch,
  onEditEntry,
}: LogbookTableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
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

  const normalizedStatus = String(item.status || "DRAFT").toUpperCase();
  const canSubmit =
    ["DRAFT", "REJECTED"].includes(normalizedStatus) || !item.status;
  const isLocked = ["SUBMITTED", "APPROVED"].includes(normalizedStatus);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label={`Select ${item.activity}`}
              className="mt-1"
            />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {item.activity}
              </h3>
              <span className="inline-flex mb-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {normalizedStatus === "SUBMITTED"
                  ? "Pending Approval"
                  : normalizedStatus}
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{format(new Date(item.entryDate), "MMM d, yyyy")}</span>
                <span>•</span>
                <span>{format(new Date(item.entryDate), "h:mm a")}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Key Info */}
        {item.description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {item.description}
          </div>
        )}

        {item.attachmentUrl && (
          <div className="flex items-center gap-1 text-[#3838EC] text-xs mt-2">
            <FileIcon className="w-3 h-3" />
            <span>Attachment</span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
          {item.description && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Description
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {item.description}
              </p>
            </div>
          )}

          {item.rejectionReason && (
            <div>
              <label className="text-xs font-medium text-red-700 dark:text-red-300 uppercase">
                Rejection Reason
              </label>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {item.rejectionReason}
              </p>
            </div>
          )}

          {(item.kpiActualNumeratorExact ||
            item.kpiActualBasisExact ||
            item.kpiActualRateExact) && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <label className="text-xs font-medium uppercase text-blue-800">
                KPI result components
              </label>
              <div className="mt-2 grid gap-2 text-xs">
                <span>Numerator: {item.kpiActualNumeratorExact || "Derived"}</span>
                <span>Denominator: {item.kpiActualBasisExact || "Resolved"}</span>
                <span>Result: {item.kpiActualRateExact || "Derived"}</span>
              </div>
            </div>
          )}

          {item.outcome && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Outcome
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {item.outcome}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Created
              </label>
              <p className="text-xs text-gray-900 dark:text-white mt-1">
                {format(new Date(item.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Updated
              </label>
              <p className="text-xs text-gray-900 dark:text-white mt-1">
                {format(new Date(item.updatedAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {canSubmit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSubmitDialogOpen(true)}
                disabled={loading}
                className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
              >
                Submit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={loading || isLocked}
              className="flex-1 text-[#3838EC] border-[#3838EC] hover:bg-[#ECECFF]"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={loading || isLocked}
              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
      <SubmitApprovalDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        item={item}
        onSuccess={() => {
          setIsSubmitDialogOpen(false);
          onRefetch();
        }}
      />
    </div>
  );
}
