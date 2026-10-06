export type TaskSubmissionStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PERSONAL_TODO"
  // Read-only compatibility for cached/legacy API responses.
  | "SUBMITTED";

export const DEFAULT_MINIMUM_SUBMISSION_COUNT = 6;
export const DEFAULT_MAXIMUM_SUBMISSION_COUNT = 10;

export const WEEKLY_SUBMISSION_CONFIRMATION =
  "Selected drafts are sent to your supervisor for planning approval. They are not official until approved; remaining drafts become private personal to-dos.";

export interface TaskPlanningReview {
  planningReviewId?: string;
  revision: number;
  decision: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: { fullName?: string | null } | null;
}

export function getLatestPlanningRejection(
  history?: TaskPlanningReview[] | null,
): TaskPlanningReview | undefined {
  return [...(history || [])]
    .filter((review) => review.decision === "REJECTED")
    .sort((left, right) => right.revision - left.revision)[0];
}

export function isOfficialTaskStatus(status?: string | null): boolean {
  return status === "APPROVED" || status === "SUBMITTED";
}

export interface SubmissionStatusMeta {
  label: string;
  description: string;
  badgeClassName: string;
}

export function canSubmitWeeklyTasks(
  selectedCount: number,
  selectedKpiFulfilledCount: number,
  minimumSubmissionCount = DEFAULT_MINIMUM_SUBMISSION_COUNT,
  maximumSubmissionCount = DEFAULT_MAXIMUM_SUBMISSION_COUNT,
): boolean {
  return (
    selectedCount >= minimumSubmissionCount &&
    selectedCount <= maximumSubmissionCount &&
    selectedKpiFulfilledCount >= 1
  );
}

export interface BulkDraftTaskCandidate {
  id: string;
  submissionStatus?: string | null;
  taskType?: string | null;
  isMidWeekTask?: boolean | null;
  carryoverGeneration?: number | null;
}

export function getBulkDraftTaskIds(
  tasks: BulkDraftTaskCandidate[],
  maximumSubmissionCount = DEFAULT_MAXIMUM_SUBMISSION_COUNT,
): string[] {
  const eligible = tasks.filter(
    (task) =>
      task.submissionStatus === "DRAFT" && !Boolean(task.isMidWeekTask),
  );
  const requiredCarryovers = eligible.filter(
    (task) => (task.carryoverGeneration ?? 0) > 0,
  );
  const optionalDrafts = eligible.filter(
    (task) => (task.carryoverGeneration ?? 0) === 0,
  );
  const selected = [...requiredCarryovers, ...optionalDrafts].slice(
    0,
    maximumSubmissionCount,
  );

  if (
    selected.length === maximumSubmissionCount &&
    !selected.some((task) => task.taskType === "KPI_FULFILLED")
  ) {
    const fulfilledTask = eligible
      .filter((task) => !selected.includes(task))
      .find((task) => task.taskType === "KPI_FULFILLED");
    let replacementIndex = selected.length - 1;
    while (
      replacementIndex >= 0 &&
      (selected[replacementIndex].carryoverGeneration ?? 0) > 0
    ) {
      replacementIndex -= 1;
    }
    if (fulfilledTask && replacementIndex >= 0) {
      selected[replacementIndex] = fulfilledTask;
    }
  }

  return selected.map((task) => task.id);
}

export function getSubmissionStatusMeta(
  status?: TaskSubmissionStatus | null,
): SubmissionStatusMeta {
  switch (status) {
    case "PENDING_APPROVAL":
      return {
        label: "PENDING APPROVAL",
        description: "Awaiting supervisor review — not yet official",
        badgeClassName:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      };
    case "APPROVED":
    case "SUBMITTED":
      return {
        label: "APPROVED",
        description: "Approved and included in the official task list",
        badgeClassName:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      };
    case "PERSONAL_TODO":
      return {
        label: "PERSONAL_TODO",
        description: "Private personal to-do — only you can see this task",
        badgeClassName:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      };
    case "DRAFT":
    default:
      return {
        label: "DRAFT",
        description: "Private until you submit it",
        badgeClassName:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      };
  }
}
