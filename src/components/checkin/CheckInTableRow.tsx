"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tableIconButtonClassName } from "@/components/ui/table";
import {
  AlertTriangleIcon,
  LockIcon,
  PencilIcon,
  SendIcon,
  TrashIcon,
} from "lucide-react";
import { useMutation } from "@apollo/client";
import { REMOVE_CHECKINOUT_TASK } from "@/lib/graphql/mutations/checkins";
import { toast } from "sonner";
import { getTaskColors, getTaskCategory } from "@/utils/task-colors";
import { AttachmentTrigger } from "@/components/files/AttachmentTrigger";
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

const STATUS_COLORS: Record<string, string> = {
  DONE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  NOT_DONE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  POSTPONED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

function formatScheduleRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const sameDay =
    format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
  if (sameDay) {
    return `${format(start, "d MMM yyyy")} · ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  }
  return `${format(start, "d MMM, h:mm a")} → ${format(end, "d MMM, h:mm a")}`;
}

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

  const taskColors = getTaskColors(task.taskType);
  const taskCategory = getTaskCategory(task.taskType);
  const submissionStatus = getSubmissionStatusMeta(task.submissionStatus);
  const canSelect =
    isSelectionEnabled && task.submissionStatus === "DRAFT";
  const latestRejection = getLatestPlanningRejection(task.planningReviewHistory);
  const canSubmitIndividually =
    (task.submissionStatus === "DRAFT" &&
      (Boolean(task.isMidWeekTask) || Boolean(latestRejection))) ||
    task.submissionStatus === "PERSONAL_TODO";
  const planningIsLocked = task.submissionStatus === "PENDING_APPROVAL";
  const isOverdueFulfilled =
    task.taskType === "KPI_FULFILLED" &&
    task.logbookStatus?.toUpperCase() === "OVERDUE";
  const linkedLabel =
    task.linkedKpiName ||
    task.linkedInitiativeName ||
    taskCategory.label;

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
    onEditTask?.(task);
  };

  return (
    <tr
      className={`group border-l-[3px] ${taskColors.border} ${
        !isEditable
          ? "bg-gray-50/80 dark:bg-gray-900/40"
          : "bg-white hover:bg-gray-50/90 dark:bg-transparent dark:hover:bg-gray-900/30"
      } transition-colors`}
    >
      {isSelectionEnabled && onSelectionChange && (
        <td className="px-3 py-3 align-top">
          {task.submissionStatus === "DRAFT" && (
            <input
              type="checkbox"
              checked={isSelected}
              disabled={!canSelect}
              onChange={(event) =>
                onSelectionChange(task.id, event.target.checked)
              }
              aria-label={`Select draft task: ${task.task}`}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#3838EC] focus:ring-[#3838EC] disabled:cursor-not-allowed"
            />
          )}
        </td>
      )}

      {/* Task + status */}
      <td className="px-3 py-3 align-top">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-start gap-2">
            {!isEditable && (
              <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            )}
            <p
              className="truncate text-sm font-semibold text-gray-900 dark:text-white"
              title={task.task}
            >
              {task.task}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              className={`${submissionStatus.badgeClassName} text-[10px] font-semibold`}
              title={submissionStatus.description}
            >
              {submissionStatus.label}
            </Badge>
            {(task.planningRevision ?? 0) > 0 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                Rev {task.planningRevision}
              </span>
            )}
            {(task.carryoverGeneration ?? 0) > 0 && (
              <Badge className="bg-orange-100 text-[10px] text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Carryover {Math.min((task.carryoverGeneration ?? 0) + 1, 2)}/2
              </Badge>
            )}
            {(task.isCarryoverOverdue || task.carryoverEscalatedAt) && (
              <Badge className="gap-1 bg-red-600 text-[10px] text-white">
                <AlertTriangleIcon className="h-3 w-3" /> Overdue
              </Badge>
            )}
            {isOverdueFulfilled && (
              <Badge className="bg-red-100 text-[10px] text-red-800 dark:bg-red-900/30 dark:text-red-300">
                Logbook overdue
              </Badge>
            )}
          </div>

          {task.description && (
            <p
              className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400"
              title={task.description}
            >
              {task.description}
            </p>
          )}

          {latestRejection && task.submissionStatus === "DRAFT" && (
            <p className="line-clamp-2 text-xs font-medium text-red-700 dark:text-red-300">
              Rejected: {latestRejection.rejectionReason}
            </p>
          )}
        </div>
      </td>

      {/* Linked KPI / initiative */}
      <td className="px-3 py-3 align-top">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${taskCategory.dotColor}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold ${taskCategory.colorClass}`}>
              {taskCategory.label}
            </p>
            <p
              className="line-clamp-2 text-sm text-gray-800 dark:text-gray-200"
              title={linkedLabel}
            >
              {linkedLabel}
            </p>
            {task.relatedTo && (
              <p className="mt-0.5 truncate text-xs text-gray-500" title={task.relatedTo}>
                With {task.relatedTo}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Schedule */}
      <td className="px-3 py-3 align-top">
        <p className="whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
          {formatScheduleRange(task.startTime, task.endTime)}
        </p>
      </td>

      {/* Attachment */}
      <td className="px-3 py-3 align-top">
        {task.attachment ? (
          <AttachmentTrigger url={task.attachment} />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Checkout */}
      <td className="px-3 py-3 align-top">
        <Badge
          className={`whitespace-nowrap text-[10px] ${
            STATUS_COLORS[task.checkoutStatus] || STATUS_COLORS.NOT_DONE
          }`}
        >
          {task.checkoutStatus
            ? task.checkoutStatus.replace("_", " ")
            : "Unknown"}
          {task.checkoutStatus === "DONE" &&
          task.requiresApproval &&
          !task.approvedAt
            ? " · Pending"
            : ""}
        </Badge>
      </td>

      {/* Actions */}
      <td className="px-3 py-3 align-top">
        <div className="flex items-center justify-end gap-1">
          {isEditable ? (
            <>
              {canSubmitIndividually && onSubmitForApproval && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSubmitForApproval(task.id)}
                  disabled={submittingTaskForApproval || loading}
                  className="h-9 min-h-9 gap-1 touch-manipulation border-blue-600 px-2.5 text-xs text-blue-700 hover:bg-blue-50"
                  title={
                    task.submissionStatus === "PERSONAL_TODO"
                      ? "Submit this personal to-do for planning approval"
                      : "Submit this revised or midweek draft for planning approval"
                  }
                >
                  <SendIcon className="h-3.5 w-3.5" />
                  Submit
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                disabled={loading || planningIsLocked}
                className={`${tableIconButtonClassName} text-[#3838EC] hover:bg-[#ECECFF] hover:text-[#2d2dbd]`}
                title="Edit task"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={
                  loading ||
                  planningIsLocked ||
                  task.submissionStatus === "APPROVED" ||
                  task.submissionStatus === "SUBMITTED"
                }
                className={`${tableIconButtonClassName} text-red-600 hover:bg-red-50 hover:text-red-700`}
                title="Delete task"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <LockIcon className="h-3.5 w-3.5" />
              View
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
