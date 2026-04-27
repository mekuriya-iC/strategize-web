"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, MoreVerticalIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface LogbookTableRowProps {
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

export function LogbookTableRow({
  item,
  isSelected,
  onSelect,
  onRefetch,
}: LogbookTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const handleSubmitForApproval = () => {
    setIsSubmitDialogOpen(true);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {/* Checkbox */}
        <td className="px-4 py-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select ${item.kpiName}`}
          />
        </td>

        {/* KPI Name */}
        <td className="px-4 py-4">
          <span className="text-sm text-gray-900 dark:text-white">
            {item.kpiName}
          </span>
        </td>

        {/* Target */}
        <td className="px-4 py-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.target}
          </span>
        </td>

        {/* Percentage Completion */}
        <td className="px-4 py-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.percentageCompletion}
          </span>
        </td>

        {/* Weight */}
        <td className="px-4 py-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.weight}
          </span>
        </td>

        {/* Approval Status */}
        <td className="px-4 py-4">
          <Badge className={STATUS_COLORS[item.approvalStatus] || STATUS_COLORS.PENDING}>
            {item.approvalStatus.replace("_", " ")}
          </Badge>
        </td>

        {/* Actions */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700"
                >
                  <MoreVerticalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSubmitForApproval}>
                  Submit for Approval
                </DropdownMenuItem>
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className="bg-gray-50 dark:bg-gray-900/50">
          <td colSpan={7} className="px-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {item.approvalStatus}
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

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
