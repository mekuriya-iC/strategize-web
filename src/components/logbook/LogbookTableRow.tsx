"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PencilIcon,
  TrashIcon,
  FileIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@apollo/client";
import { REMOVE_LOGBOOK_ENTRY } from "@/lib/graphql/mutations/logbook";
import { toast } from "sonner";
import { SubmitApprovalDialog } from "./SubmitApprovalDialog";
import { format } from "date-fns";
import type { FrontendLogbookItem } from "@/types/logbook";
import type { KpiUnitType } from "@/types/graphql";
import { calculateKpiResultPreview } from "@/utils/basisCalculation";

interface LogbookTableRowProps {
  item: FrontendLogbookItem;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onRefetch: () => void;
  onEditEntry?: (entry: FrontendLogbookItem) => void;
}

export function LogbookTableRow({
  item,
  isSelected,
  onSelect,
  onRefetch,
  onEditEntry,
}: LogbookTableRowProps) {
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
  const isBasisDriven =
    item.linkedKpi?.calculationBasisSource === "DIRECT_VALUE" ||
    item.linkedKpi?.calculationBasisSource === "LINKED_KPI";
  const resultPreview = isBasisDriven
    ? calculateKpiResultPreview({
        inputMode: item.kpiResultInputMode || "NUMERATOR",
        numeratorExact:
          item.kpiActualNumeratorExact ||
          (item.kpiAchievedValue != null ? String(item.kpiAchievedValue) : ""),
        rateExact: item.kpiActualRateExact || "",
        basisExact:
          item.kpiActualBasisExact ||
          (item.kpiActualDenominator != null
            ? String(item.kpiActualDenominator)
            : ""),
        unitType: (item.linkedKpi?.unitType || "PERCENT") as KpiUnitType,
      })
    : null;

  const getStatusBadge = () => {
    const status = normalizedStatus;
    const classes: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      SUBMITTED:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      APPROVED:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    const label = status === "SUBMITTED" ? "Pending Approval" : status;
    return <Badge className={classes[status] || classes.DRAFT}>{label}</Badge>;
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
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {item.activity}
            </span>
            <div>{getStatusBadge()}</div>
          </div>
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
          {item.attachmentUrl || item.evidenceItems?.length ? (
            <div className="flex items-center gap-1 text-[#3838EC]">
              <FileIcon className="w-4 h-4" />
              <span className="text-xs">
                {item.evidenceItems?.length || 1} evidence
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">None</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {canSubmit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSubmitDialogOpen(true)}
                disabled={loading}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Submit
              </Button>
            )}
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
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Description:
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              )}
              {item.rejectionReason && (
                <div>
                  <span className="font-medium text-red-700 dark:text-red-300">
                    Rejection Reason:
                  </span>
                  <p className="mt-1 text-red-600 dark:text-red-300">
                    {item.rejectionReason}
                  </p>
                </div>
              )}
              {isBasisDriven && resultPreview && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <span className="font-medium text-blue-950">KPI result:</span>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-4">
                    <span>
                      Numerator: <strong>{resultPreview.numeratorExact || "—"}</strong>
                    </span>
                    <span>
                      Denominator: <strong>{resultPreview.basisExact || "—"}</strong>
                    </span>
                    <span>
                      Result:{" "}
                      <strong>
                        {resultPreview.rateExact || "—"}
                        {resultPreview.rateExact
                          ? item.linkedKpi?.unitType === "PERCENT"
                            ? "%"
                            : ":1"
                          : ""}
                      </strong>
                    </span>
                    <span>
                      Source:{" "}
                      <strong>
                        {item.linkedKpi?.actualBasisSource === "ENTER_ACTUAL_BASIS"
                          ? "Entered actual denominator"
                          : item.linkedKpi?.actualBasisSource ===
                              "LINKED_KPI_ACTUAL"
                            ? "Linked KPI actual"
                            : "Approved denominator"}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
              {item.outcome && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Outcome:
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {item.outcome}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Created:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Last Updated:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {format(new Date(item.updatedAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      <SubmitApprovalDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        item={item}
        onEditAchievement={() => {
          setIsSubmitDialogOpen(false);
          handleEdit();
        }}
        onSuccess={() => {
          setIsSubmitDialogOpen(false);
          onRefetch();
        }}
      />
    </>
  );
}
