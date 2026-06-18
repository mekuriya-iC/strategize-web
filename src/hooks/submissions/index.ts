/**
 * Submissions Module
 * Centralized exports for submission-related hooks and utilities
 */

// Types
export * from "./types";

// Utilities
export * from "./utils";
export {
  objectiveSubmissionsQueryVariables,
  kpiSubmissionsQueryVariables,
} from "./submissionQueryVariables";

// Hooks
export { useSubmissionQueries } from "./useSubmissionQueries";
export { useDepartmentHierarchy } from "./useDepartmentHierarchy";
export { usePendingApprovalsCount } from "./usePendingApprovalsCount";

