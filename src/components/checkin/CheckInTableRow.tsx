"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangleIcon,
  FileIcon,
  LockIcon,
  PencilIcon,
  SendIcon,
  TrashIcon,
} from "lucide-react";
import { useMutation } from "@apollo/client";
import { REMOVE_CHECKINOUT_TASK } from "@/lib/graphql/mutations/checkins";
import { toast } from "sonner";
import { getTaskColors, getTaskCategory } from "@/utils/task-colors";
import { removeCheckinTask } from "./checkin-cache";
import {
  getLatestPlanningRejection,
  getSubmissionStatusMeta,
  type TaskPlanningReview,
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
  logbookStatus?: string | null;
  sessionId?: string | null;
  planningRevision?: number;
  planningReviewHistory?: TaskPlanningReview[];
  carryoverGeneration?: number;
  isCarryoverOverdue?: boolean;
  carryoverEscalatedAt?: string | null;
}

interface CheckInTableRowProps {
  task: Task;
  isEditable: boolean;
  onRefetch: () => void;
  onEditTask?: (task: Task) => void;
  isSelectionEnabled?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
  onSubmitForApproval?: (taskId: string) => void | Promise<void>;
  submittingTaskForApproval?: boolean;
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

export function CheckInTableRow({
  task,
  isEditable,
  onEditTask,
  isSelectionEnabled = false,
  isSelected = false,
  onSelectionChange,
  onSubmitForApproval,
  submittingTaskForApproval = false,
}: CheckInTableRowProps) {
  const [deleteCheckin, { loading }] = useMutation(REMOVE_CHECKINOUT_TASK);

  // Get color configuration for this task type
  const taskColors = getTaskColors(task.taskType);
  const taskCategory = getTaskCategory(task.taskType);
  const submissionStatus = getSubmissionStatusMeta(task.submissionStatus);
  const canSelect =
    isSelectionEnabled && task.submissionStatus === "DRAFT";
  const latestRejection = getLatestPlanningRejection(task.planningReviewHistory);
  const canSubmitIndividually =
    task.submissionStatus === "DRAFT" &&
    (Boolean(task.isMidWeekTask) || Boolean(latestRejection));
  const planningIsLocked = task.submissionStatus === "PENDING_APPROVAL";
  const isOverdueFulfilled =
    task.taskType === "KPI_FULFILLED" &&
    task.logbookStatus?.toUpperCase() === "OVERDUE";
  const isRejectedFulfilled =
    task.taskType === "KPI_FULFILLED" &&
    task.logbookStatus?.toUpperCase() === "REJECTED";

  // Determine objective status based on task flags
  const getObjectiveStatus = () => {
    if (isRejectedFulfilled) {
      return {
        label: "Achievement rejected",
        color: "text-red-700 bg-red-50 dark:bg-red-900/20",
      };
    } else if (isOverdueFulfilled) {
      return {
        label: "Achievement overdue",
        color: "text-red-700 bg-red-50 dark:bg-red-900/20",
      };
    } else if (task.taskType === "KPI_FULFILLED" || task.isKpiMet) {
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
        update: (cache) => {
          if (task.sessionId) {
            removeCheckinTask(cache, task.sessionId, task.id);
          }
        },
      });
      toast.success("Task deleted successfully");
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
    <tr
      className={`${
        !isEditable
          ? "bg-gray-50 dark:bg-gray-900/50 opacity-75"
          : `${taskColors.background} hover:brightness-95 dark:hover:brightness-110`
      } transition-all border-l-4 ${taskColors.border}`}
    >
      {isSelectionEnabled && onSelectionChange && (
        <td className="px-4 py-4">
          {task.submissionStatus === "DRAFT" && (
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
        </td>
      )}

      {/* Major Task */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {!isEditable && <LockIcon className="w-4 h-4 text-gray-400" />}
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {task.task}
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={submissionStatus.badgeClassName}>
                {submissionStatus.label}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {submissionStatus.description}
              </span>
              {(task.planningRevision ?? 0) > 0 && (
                <Badge variant="outline">Revision {task.planningRevision}</Badge>
              )}
              {(task.carryoverGeneration ?? 0) > 0 && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Carryover Week {Math.min((task.carryoverGeneration ?? 0) + 1, 2)} of 2
                </Badge>
              )}
              {(task.isCarryoverOverdue || task.carryoverEscalatedAt) && (
                <Badge className="gap-1 bg-red-600 text-white">
                  <AlertTriangleIcon className="h-3 w-3" /> Critical carryover overdue
                </Badge>
              )}
              {latestRejection && task.submissionStatus === "DRAFT" && (
                <span className="basis-full text-xs font-medium text-red-700 dark:text-red-300">
                  Revision {latestRejection.revision} rejected: {latestRejection.rejectionReason}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Linked KPI/Initiative */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${taskCategory.dotColor}`}
            aria-hidden="true"
          />
          <span className={`text-xs font-semibold ${taskCategory.colorClass}`}>
            {taskCategory.label}
          </span>
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
      </td>

      {/* Objective */}
      <td className="px-4 py-4">
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${objectiveStatus.color}`}
        >
          {objectiveStatus.label}
        </span>
        {isOverdueFulfilled && (
          <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            Action required: logbook overdue
          </Badge>
        )}
      </td>

      {/* Description */}
      <td className="px-4 py-4 max-w-xs">
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {task.description || "-"}
        </p>
      </td>

      {/* Related With */}
      <td className="px-4 py-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {task.relatedTo || "-"}
        </span>
      </td>

      {/* Start Time & Date */}
      <td className="px-4 py-4">
        <div className="text-sm text-gray-900 dark:text-white">
          {format(new Date(task.startTime), "d MMM yyyy, h:mm a")}
        </div>
      </td>

      {/* End Time & Date */}
      <td className="px-4 py-4">
        <div className="text-sm text-gray-900 dark:text-white">
          {format(new Date(task.endTime), "d MMM yyyy, h:mm a")}
        </div>
      </td>

      {/* Attachment */}
      <td className="px-4 py-4">
        {task.attachment ? (
          <div className="flex items-center gap-1 text-[#3838EC]">
            <FileIcon className="w-4 h-4" />
            <span className="text-xs">File.pdf</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">None</span>
        )}
      </td>

      {/* Checkout */}
      <td className="px-4 py-4">
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
      </td>

      {/* Remark */}
      <td className="px-4 py-4 max-w-xs">
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {task.remark || "-"}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 min-h-9">
          {isEditable ? (
            <>
              {canSubmitIndividually && onSubmitForApproval && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSubmitForApproval(task.id)}
                  disabled={submittingTaskForApproval || loading}
                  className="gap-1 border-blue-600 text-blue-700 hover:bg-blue-50"
                  title="Submit this revised or midweek draft for planning approval"
                >
                  <SendIcon className="w-4 h-4" /> Submit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={loading || planningIsLocked}
                className="text-[#3838EC] hover:text-[#2d2dbd] hover:bg-[#ECECFF]"
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={
                  loading ||
                  planningIsLocked ||
                  task.submissionStatus === "APPROVED" ||
                  task.submissionStatus === "SUBMITTED"
                }
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <LockIcon className="w-3.5 h-3.5" />
              View only
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
