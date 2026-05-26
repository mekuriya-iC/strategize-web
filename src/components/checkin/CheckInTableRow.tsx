"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, FileIcon, LockIcon } from "lucide-react";
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

interface CheckInTableRowProps {
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

export function CheckInTableRow({
  task,
  isEditable,
  onRefetch,
  onEditTask,
}: CheckInTableRowProps) {
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
    <tr
      className={`${
        !isEditable
          ? "bg-gray-50 dark:bg-gray-900/50 opacity-75"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      } transition-colors`}
    >
      {/* Major Task */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {!isEditable && <LockIcon className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {task.task}
          </span>
        </div>
      </td>

      {/* Linked KPI/Initiative */}
      <td className="px-4 py-4">
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
      </td>

      {/* Objective */}
      <td className="px-4 py-4">
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${objectiveStatus.color}`}
        >
          {objectiveStatus.label}
        </span>
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
