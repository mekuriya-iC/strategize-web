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
import {
  getTaskBorderStyle,
  getTaskCategory,
  getTaskColors,
} from "@/utils/task-colors";
import {
  getSubmissionStatusMeta,
  type TaskSubmissionStatus,
} from "./weekly-submission";

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
  submissionStatus?: TaskSubmissionStatus;
}

interface CheckInTableCardProps {
  task: Task;
  isEditable: boolean;
  onRefetch: () => void;
  onEditTask?: (task: Task) => void;
  isSelectionEnabled?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  KPI_FULFILLED: "KPI Fulfilled",
  KPI_UNMET: "KPI Unmet",
  INITIATIVE_FULFILLED: "Initiative Fulfilled",
  INITIATIVE_UNMET: "Initiative Unmet",
  SELF_DEVELOPMENT_FULFILLED: "Self-Development Fulfilled",
  SELF_DEVELOPMENT_UNMET: "Self-Development Unmet",
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
  isSelectionEnabled = false,
  isSelected = false,
  onSelectionChange,
}: CheckInTableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteCheckin, { loading }] = useMutation(REMOVE_CHECKINOUT_TASK, {
    refetchQueries: ["GetCheckinoutSessions", "GetCheckinoutTasks"],
  });

  // Get color configuration for this task type
  const taskColors = getTaskColors(task.taskType);
  const taskCategory = getTaskCategory(task.taskType);
  const borderStyle = getTaskBorderStyle(task.taskType);
  const submissionStatus = getSubmissionStatusMeta(task.submissionStatus);
  const canSelect =
    isSelectionEnabled && task.submissionStatus === "DRAFT";

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
    } else if (
      task.taskType === "SELF_DEVELOPMENT_FULFILLED" ||
      task.taskType === "SELF_DEVELOPMENT_UNMET" ||
      task.taskType === "SELF_DEVELOPMENT"
    ) {
      return {
        label:
          task.taskType === "SELF_DEVELOPMENT_UNMET"
            ? "Self-Development Unmet"
            : "Self-Development Fulfilled",
        color: "text-amber-700 bg-amber-50 dark:bg-amber-900/20",
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
      className={`rounded-lg border ${borderStyle} ${
        !isEditable
          ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 opacity-75"
          : `${taskColors.background} ${taskColors.border}`
      } overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {!isEditable && (
                <LockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              {onSelectionChange && task.submissionStatus === "DRAFT" && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!canSelect}
                  onChange={(event) =>
                    onSelectionChange(task.id, event.target.checked)
                  }
                  aria-label={`Select draft task: ${task.task}`}
                  className="h-4 w-4 rounded border-gray-300 text-[#3838EC] focus:ring-[#3838EC] disabled:cursor-not-allowed"
                />
              )}
              <div
                className={`w-2 h-2 rounded-full ${taskCategory.dotColor} flex-shrink-0`}
                aria-hidden="true"
              />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {task.task}
              </h3>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold ${taskCategory.colorClass}`}>
                {taskCategory.label}
              </span>
              <Badge className={submissionStatus.badgeClassName}>
                {submissionStatus.label}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {submissionStatus.description}
              </span>
            </div>
            {task.linkedKpiName || task.linkedInitiativeName ? (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {task.linkedKpiName || task.linkedInitiativeName}
              </span>
            ) : (
              <Badge variant="outline" className={taskColors.badge}>
                {TASK_TYPE_LABELS[task.taskType] || task.taskType}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
            aria-label={isExpanded ? "Collapse task details" : "Expand task details"}
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
