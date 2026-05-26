"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PencilIcon,
  TrashIcon,
  FileIcon,
  LockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
} from "lucide-react";
import { useMutation } from "@apollo/client";
import { REMOVE_CHECKINOUT_TASK } from "@/lib/graphql/mutations/checkins";
import { toast } from "sonner";

interface Task {
  id: string;
  taskType: string;
  task: string;
  description: string;
  relatedTo: string;
  startTime: string;
  endTime: string;
  checkoutStatus: string;
  requiresApproval?: boolean;
  approvedAt?: string | null;
  attachment?: string;
  remark?: string;
  linkedKpiName?: string;
  linkedInitiativeName?: string;
  isKpiMet: boolean;
  isInitiativeMet: boolean;
  isSelfDevComplete: boolean;
  createdAt: string;
  isMidWeekTask?: boolean;
}

interface CheckInTableCardProps {
  task: Task;
  isEditable: boolean;
  onRefetch: () => void;
  onEditTask?: (task: Task) => void;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  KPI_FULFILLED: "KPI Fulfilled",
  KPI_UNMET: "KPI Unmet",
  INITIATIVE_FULFILLED: "Initiative Fulfilled",
  INITIATIVE_UNMET: "Initiative Unmet",
  SELF_DEVELOPMENT: "Self Development",
  UNLINKED: "Unlinked",
};

const STATUS_COLORS: Record<string, string> = {
  DONE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  NOT_DONE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  POSTPONED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

export function CheckInTableCard({
  task,
  isEditable,
  onRefetch,
  onEditTask,
}: CheckInTableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteCheckin, { loading }] = useMutation(REMOVE_CHECKINOUT_TASK, {
    refetchQueries: ["GetCheckinoutSessions", "GetCheckinoutTasks"],
  });

  // Determine objective status based on task flags
  const getObjectiveStatus = () => {
    if (task.taskType === "KPI_FULFILLED" || task.isKpiMet) {
      return {
        label: "KPI Fulfilled",
        color: "text-green-600 bg-green-50 dark:bg-green-900/20",
      };
    } else if (task.taskType === "KPI_UNMET") {
      return {
        label: "KPI Unmet",
        color: "text-red-600 bg-red-50 dark:bg-red-900/20",
      };
    } else if (
      task.taskType === "INITIATIVE_FULFILLED" ||
      task.isInitiativeMet
    ) {
      return {
        label: "Initiative Fulfilled",
        color: "text-green-600 bg-green-50 dark:bg-green-900/20",
      };
    } else if (task.taskType === "INITIATIVE_UNMET") {
      return {
        label: "Initiative Unmet",
        color: "text-red-600 bg-red-50 dark:bg-red-900/20",
      };
    } else if (task.taskType === "SELF_DEVELOPMENT") {
      return {
        label: "Self Development",
        color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
      };
    }
    return { label: "-", color: "text-gray-600" };
  };

  const objectiveStatus = getObjectiveStatus();

  const handleDelete = async () => {
    if (!isEditable) {
      toast.error("You can only delete your own tasks.");
      return;
    }

    try {
      await deleteCheckin({
        variables: { checkinoutTaskId: task.id },
      });
      toast.success("Task deleted successfully");
      onRefetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
      console.error(error);
    }
  };

  const handleEdit = () => {
    if (!isEditable) {
      toast.error("You can only edit your own tasks.");
      return;
    }

    if (onEditTask) {
      onEditTask(task);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border ${
        !isEditable
          ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 opacity-75"
          : "border-gray-200 dark:border-gray-700"
      } overflow-hidden`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {!isEditable && (
                <LockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {task.task}
              </h3>
            </div>
            {task.linkedKpiName || task.linkedInitiativeName ? (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {task.linkedKpiName || task.linkedInitiativeName}
              </span>
            ) : (
              <Badge
                variant="outline"
                className="bg-[#ECECFF] text-[#3838EC] border-[#3838EC]/20"
              >
                {TASK_TYPE_LABELS[task.taskType] || task.taskType}
              </Badge>
            )}
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${objectiveStatus.color}`}
            >
              {objectiveStatus.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CalendarIcon className="w-4 h-4" />
            <span>{format(new Date(task.startTime), "MMM d, yyyy")}</span>
            <span>-</span>
            <span>{format(new Date(task.endTime), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                STATUS_COLORS[task.checkoutStatus] || STATUS_COLORS.NOT_DONE
              }
            >
              {task.checkoutStatus
                ? task.checkoutStatus.replace("_", " ")
                : "Unknown"}
              {task.checkoutStatus === "DONE" &&
              task.requiresApproval &&
              !task.approvedAt
                ? " (Pending)"
                : ""}
            </Badge>
            {task.attachment && (
              <div className="flex items-center gap-1 text-[#3838EC] text-xs">
                <FileIcon className="w-3 h-3" />
                <span>Attached</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
          {task.description && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Description
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {task.description}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Related With
            </label>
            <p className="text-sm text-gray-900 dark:text-white mt-1">
              {task.relatedTo || "-"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Start Time
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {format(new Date(task.startTime), "h:mm a")}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                End Time
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {format(new Date(task.endTime), "h:mm a")}
              </p>
            </div>
          </div>

          {task.remark && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Remark
              </label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {task.remark}
              </p>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {task.isKpiMet && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                KPI Met
              </Badge>
            )}
            {task.isInitiativeMet && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Initiative Met
              </Badge>
            )}
            {task.isSelfDevComplete && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Self Dev Complete
              </Badge>
            )}
          </div>

          {/* Actions */}
          {isEditable ? (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={loading}
                className="flex-1 text-[#3838EC] border-[#3838EC] hover:bg-[#ECECFF]"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-2 text-sm text-gray-500 dark:text-gray-400">
              <LockIcon className="w-4 h-4" />
              <span>View only — only the task owner can edit or delete.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
