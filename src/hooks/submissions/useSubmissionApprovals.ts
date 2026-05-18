/**
 * Submission Approvals Hook
 * Main hook for fetching and filtering submissions for approval workflow
 *
 * Uses modular sub-hooks for:
 * - Fetching submissions across all types
 * - Checking department hierarchy
 * - Filtering and grouping logic
 */

import { useAuthStore, useOrgUnitStore } from "@/stores";
import { submissionLogger } from "@/lib/logger";
import {
  type SubmissionApprovalsOptions,
  type GroupedSubmission,
  type SubmissionMeta,
  useSubmissionQueries,
  useDepartmentHierarchy,
  filterSubmissionsByHierarchy,
  filterSubmissionsByListMode,
  filterSubmissionsByStatus,
  groupSubmissionsByObjective,
  paginateSubmissions,
  calculatePaginationMeta,
} from "@/hooks/submissions"

interface UseSubmissionApprovalsResult {
  submissions: GroupedSubmission[];
  meta: SubmissionMeta;
  loading: boolean;
  error: string | undefined;
  refetch: () => void;
}

export const useSubmissionApprovals = ({
  page = 1,
  limit = 10,
  approverRole,
  status,
  listMode = "inbound",
  submitterEmployeeId,
}: SubmissionApprovalsOptions): UseSubmissionApprovalsResult => {
  const user = useAuthStore((state) => state.user);
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const effectiveSubmitterId = submitterEmployeeId ?? user?.employeeId;

  // Determine if we should make queries
  const shouldMakeQueries = Boolean(
    user &&
    (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || selectedUnit)
  );

  // Fetch all submissions using modular query hook
  const {
    submissions: allSubmissions,
    loading: submissionsLoading,
    refetch,
  } = useSubmissionQueries({
    shouldFetch: shouldMakeQueries,
    approverRole,
    pendingOnly: listMode === "inbound",
  });

  // Get departments hierarchy (for corporate and division filtering)
  const { departmentsWithoutDivision, getDepartmentsForDivision, loading: departmentsLoading } =
    useDepartmentHierarchy({
      shouldFetch: shouldMakeQueries && (approverRole === "CORPORATE" || approverRole === "DIVISION"),
    });

  // Get selected unit type and ID for filtering
  const selectedUnitType = selectedUnit?.type as
    | "division"
    | "department"
    | null;
  const selectedUnitId = selectedUnit?.id || null;

  // Get departments for the selected division (for division-level filtering)
  const departmentsInSelectedDivision = selectedUnitId && selectedUnitType === "division"
    ? getDepartmentsForDivision(selectedUnitId)
    : new Set<string>();

  const listModeFiltered = filterSubmissionsByListMode(
    allSubmissions,
    listMode,
    approverRole,
    effectiveSubmitterId
  );

  const hierarchyFiltered =
    listMode === "inbound"
      ? filterSubmissionsByHierarchy(
          listModeFiltered,
          approverRole,
          selectedUnitType,
          departmentsWithoutDivision,
          departmentsInSelectedDivision,
          selectedUnitId
        )
      : listModeFiltered;

  const statusFiltered = filterSubmissionsByStatus(hierarchyFiltered, status);

  // Group submissions by objective
  const groupedSubmissions = groupSubmissionsByObjective(statusFiltered);

  // Apply pagination
  const paginatedSubmissions = paginateSubmissions(
    groupedSubmissions,
    page,
    limit
  );

  // Calculate metadata
  const meta = calculatePaginationMeta(
    groupedSubmissions.length,
    page,
    limit,
    paginatedSubmissions.length
  );

  // Combined loading state
  const loading = submissionsLoading || departmentsLoading;

  // Log for debugging
  if (!loading) {
    submissionLogger.debug("Submissions filtering debug", {
      allSubmissionsCount: allSubmissions.length,
      hierarchyFilteredCount: hierarchyFiltered.length,
      groupedSubmissionsCount: groupedSubmissions.length,
      approverRole,
      selectedUnitType,
      selectedUnitId,
      departmentsInDivision: Array.from(departmentsInSelectedDivision),
      // Log first few submissions for debugging
      sampleSubmissions: allSubmissions.slice(0, 3).map(s => ({
        submissionId: s.submissionId,
        level: s.level,
        objectiveType: s.objective?.type,
        objectiveAssigneeType: s.objective?.assigneeType,
        objectiveAssigneeId: s.objective?.assigneeId,
      })),
    });
  }

  return {
    submissions: paginatedSubmissions,
    meta,
    loading,
    error: undefined,
    refetch,
  };
};
