import { Badge } from "@/components/ui/badge";
import type {
  TaskCollaborationRequestStatus,
  TaskSubmissionStatus,
} from "@/lib/graphql/queries/task-collaboration";
import { STATUS_LABELS, TASK_STATE_LABELS } from "./task-collaboration-utils";

const REQUEST_STATUS_STYLES: Record<TaskCollaborationRequestStatus, string> = {
  PENDING:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  ACCEPTED:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  REJECTED:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
  CANCELLED:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  EXPIRED:
    "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
};

const TASK_STATE_STYLES: Record<TaskSubmissionStatus, string> = {
  DRAFT:
    "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  SUBMITTED:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  PERSONAL_TODO:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
};

export function TaskRequestStatusBadge({
  status,
}: {
  status: TaskCollaborationRequestStatus;
}) {
  const label = STATUS_LABELS[status];
  return (
    <Badge
      variant="outline"
      role="status"
      aria-label={`Request status: ${label}`}
      className={REQUEST_STATUS_STYLES[status]}
    >
      {label}
    </Badge>
  );
}

export function CollaboratorTaskStateBadge({
  status,
}: {
  status: TaskSubmissionStatus;
}) {
  const label = TASK_STATE_LABELS[status];
  return (
    <Badge
      variant="outline"
      role="status"
      aria-label={`Collaborator task state: ${label}`}
      className={TASK_STATE_STYLES[status]}
    >
      {label}
    </Badge>
  );
}
