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
