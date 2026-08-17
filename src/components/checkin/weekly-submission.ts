export type TaskSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PERSONAL_TODO";

export const DEFAULT_MINIMUM_SUBMISSION_COUNT = 6;
export const DEFAULT_MAXIMUM_SUBMISSION_COUNT = 10;

export const WEEKLY_SUBMISSION_CONFIRMATION =
  "Selected drafts become visible to your supervisor. Any remaining drafts become private personal to-dos.";

export interface SubmissionStatusMeta {
  label: string;
  description: string;
  badgeClassName: string;
}

export function canSubmitWeeklyTasks(
  selectedCount: number,
  minimumSubmissionCount = DEFAULT_MINIMUM_SUBMISSION_COUNT,
  maximumSubmissionCount = DEFAULT_MAXIMUM_SUBMISSION_COUNT,
): boolean {
  return (
    selectedCount >= minimumSubmissionCount &&
    selectedCount <= maximumSubmissionCount
  );
}

export function getSubmissionStatusMeta(
  status?: TaskSubmissionStatus | null,
): SubmissionStatusMeta {
  switch (status) {
    case "SUBMITTED":
      return {
        label: "SUBMITTED",
        description: "Visible to your supervisor",
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
