import type {
  TaskCollaborationRequestStatus,
  TaskSubmissionStatus,
} from "@/lib/graphql/queries/task-collaboration";

export type TaskCollaborationView = "received" | "sent";
export type TaskCollaborationAction = "accept" | "reject" | "cancel";

export function getAvailableTaskCollaborationActions(
  status: TaskCollaborationRequestStatus,
  view: TaskCollaborationView,
): TaskCollaborationAction[] {
  if (status !== "PENDING") return [];
  return view === "received" ? ["accept", "reject"] : ["cancel"];
}

export const STATUS_LABELS: Record<TaskCollaborationRequestStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const TASK_STATE_LABELS: Record<TaskSubmissionStatus, string> = {
  DRAFT: "Private draft",
  SUBMITTED: "Submitted",
  PERSONAL_TODO: "Personal to-do",
};

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "The request could not be updated.";
}

export function getActionableCollaborationError(error: unknown): string {
  const message = extractErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("overlap")) {
    return "This task overlaps another task on your schedule. Review the conflicting task or ask the originator to adjust the time, then try again.";
  }
  if (
    normalized.includes("at most") ||
    normalized.includes("active task") ||
    normalized.includes("capacity") ||
    normalized.includes("pool")
  ) {
    return "Your matching week's task pool is full. Remove an active task from that weekly session, or ask your manager to help free capacity, then try again.";
  }
  if (
    normalized.includes("no matching") ||
    (normalized.includes("session") && normalized.includes("not found"))
  ) {
    return "No matching weekly check-in session exists for this task. Create or open your check-in session for that week, then try again.";
  }
  if (
    normalized.includes("session") &&
    (normalized.includes("locked") || normalized.includes("unavailable"))
  ) {
    return "Your matching weekly check-in session is locked or unavailable. Ask your manager or administrator to unlock it before accepting.";
  }
  if (normalized.includes("originator task is no longer available")) {
    return "The original task is no longer available. Ask the originator to create a new collaboration request.";
  }
  if (normalized.includes("expired") || normalized.includes("already")) {
    return "This request is no longer pending. Refresh the lists to see its current status.";
  }

  return message;
}
