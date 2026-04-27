"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmitApprovalDialog } from "./SubmitApprovalDialog";
import { toast } from "sonner";

interface LogbookItem {
  id: string;
  kpiName: string;
  target: number;
  percentageCompletion: string;
  weight: number;
  approvalStatus: string;
  createdAt: string;
}

interface LogbookTableCardProps {
  item: LogbookItem;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onRefetch: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function LogbookTableCard({
  item,
  isSelected,
  onSelect,
  onRefetch,
}: LogbookTableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Card Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                aria-label={`Select ${item.kpiName}`}
                className="mt-1"
              />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {item.kpiName}
                </h3>
                <Badge className={STATUS_COLORS[item.approvalStatus] || STATUS_COLORS.PENDING}>
                  {item.approvalStatus.replace("_", " ")}
                </Badge>
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
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Target:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {item.target}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Weight:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {item.weight}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 dark:text-gray-400">Completion:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {item.percentageCompletion}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Created Date
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => setIsSubmitDialogOpen(true)}
                className="flex-1 bg-[#3838EC] hover:bg-[#2d2dbd] text-white"
              >
                Submit for Approval
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Approval Dialog */}
      <SubmitApprovalDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        item={item}
        onSuccess={() => {
          toast.success("Submitted for approval successfully");
          onRefetch();
        }}
      />
    </>
  );
}
