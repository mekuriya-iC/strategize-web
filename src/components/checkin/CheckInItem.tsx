"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon, ClockIcon, FileTextIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@apollo/client";
import { DELETE_CHECKIN } from "@/lib/graphql/mutations/checkins";
import { toast } from "sonner";

interface CheckInItemProps {
  checkin: {
    id: string;
    taskType: string;
    task: string;
    description: string;
    startTime: string;
    endTime: string;
    checkoutStatus: string;
    isKpiMet: boolean;
    isInitiativeMet: boolean;
    isSelfDevComplete: boolean;
    attachment?: string;
    remark?: string;
  };
  onRefetch: () => void;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  KPI_FULFILLED: "KPI Fulfilled",
  INITIATIVE_UNMET: "Initiative Unmet",
  UNLINKED: "Unlinked",
};

const STATUS_COLORS: Record<string, string> = {
  NOT_DONE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  POSTPONED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

export function CheckInItem({ checkin, onRefetch }: CheckInItemProps) {
  const [deleteCheckin] = useMutation(DELETE_CHECKIN);

  const handleDelete = async () => {
    try {
      await deleteCheckin({
        variables: { id: checkin.id },
      });
      toast.success("Task deleted successfully");
      onRefetch();
    } catch (error) {
      toast.error("Failed to delete task");
      console.error(error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Task Type Badge */}
          <Badge
            variant="outline"
            className="mb-2 bg-[#ECECFF] text-[#3838EC] border-[#3838EC]/20"
          >
            {TASK_TYPE_LABELS[checkin.taskType] || checkin.taskType}
          </Badge>

          {/* Task Title */}
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {checkin.task}
          </h4>

          {/* Description */}
          {checkin.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {checkin.description}
            </p>
          )}

          {/* Time Range */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>
                {format(new Date(checkin.startTime), "h:mm a")} -{" "}
                {format(new Date(checkin.endTime), "h:mm a")}
              </span>
            </div>
            {checkin.attachment && (
              <div className="flex items-center gap-1">
                <FileTextIcon className="w-4 h-4" />
                <span>Attachment</span>
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                STATUS_COLORS[checkin.checkoutStatus] ||
                STATUS_COLORS.NOT_DONE
              }
            >
              {checkin.checkoutStatus.replace("_", " ")}
            </Badge>
            {checkin.isKpiMet && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                KPI Met
              </Badge>
            )}
            {checkin.isInitiativeMet && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Initiative Met
              </Badge>
            )}
            {checkin.isSelfDevComplete && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Self Dev Complete
              </Badge>
            )}
          </div>

          {/* Remark */}
          {checkin.remark && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">
              Remark: {checkin.remark}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVerticalIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
