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
import { usePermissions } from "@/hooks/permissions/usePermissions";
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
} from "@/hooks/submissions";

interface UseSubmissionApprovalsResult {
  submissions: GroupedSubmission[];
  meta: SubmissionMeta;
  loading: boolean;
  error: string | undefined;
  refetch: () => Promise<void>;
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
  const { scope } = usePermissions();
  const effectiveSubmitterId = submitterEmployeeId ?? user?.employeeId;

  // Determine if we should make queries
  const shouldMakeQueries = Boolean(
    user &&
    (user.role === "SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      approverRole === "DIVISION" ||
      approverRole === "DEPARTMENT" ||
      selectedUnit ||
      listMode === "outbound"),
  );

  // Fetch all submissions using modular query hook
  // pendingOnly is false so we can support filtering by APPROVED/REJECTED status too
  const {
    submissions: allSubmissions,
    loading: submissionsLoading,
    refetch,
  } = useSubmissionQueries({
    shouldFetch: shouldMakeQueries,
    approverRole,
    pendingOnly: false,
  });

  // Get departments hierarchy (for corporate and division filtering)
  const {
    departmentsWithoutDivision,
    getDepartmentsForDivision,
    loading: departmentsLoading,
  } = useDepartmentHierarchy({
    shouldFetch:
      shouldMakeQueries &&
      (approverRole === "CORPORATE" || approverRole === "DIVISION"),
  });

  // Get selected unit type and ID for filtering.
  // Auto-scope fallback: if no unit is selected, use the user's managed scope.
  const selectedUnitType = selectedUnit?.type as
    | "division"
    | "department"
    | null;
  const selectedUnitId = selectedUnit?.id || null;

  const effectiveSelectedUnitType: "division" | "department" | null =
    selectedUnitType ??
    (approverRole === "DIVISION"
      ? "division"
      : approverRole === "DEPARTMENT"
        ? "department"
        : null);

  const effectiveSelectedUnitId: string | null =
    selectedUnitId ??
    (approverRole === "DIVISION"
      ? (scope?.managedDivisionIds?.[0] ?? null)
      : approverRole === "DEPARTMENT"
        ? (scope?.managedDepartmentIds?.[0] ??
          user?.departments?.[0]?.departmentId ??
          null)
        : null);

  // Get departments for the selected division (for division-level filtering)
  const departmentsInSelectedDivision =
    effectiveSelectedUnitId && effectiveSelectedUnitType === "division"
      ? getDepartmentsForDivision(effectiveSelectedUnitId)
      : new Set<string>();

  const listModeFiltered = filterSubmissionsByListMode(
    allSubmissions,
    listMode,
    approverRole,
    effectiveSubmitterId,
  );

  const hierarchyFiltered =
    listMode === "inbound"
      ? filterSubmissionsByHierarchy(
          listModeFiltered,
          approverRole,
          effectiveSelectedUnitType,
          departmentsWithoutDivision,
          departmentsInSelectedDivision,
          effectiveSelectedUnitId,
        )
      : listModeFiltered;

  const statusFiltered = filterSubmissionsByStatus(hierarchyFiltered, status);

  // Group submissions by objective
  const groupedSubmissions = groupSubmissionsByObjective(statusFiltered);

  // Apply pagination
  const paginatedSubmissions = paginateSubmissions(
    groupedSubmissions,
    page,
    limit,
  );

  // Calculate metadata
  const meta = calculatePaginationMeta(
    groupedSubmissions.length,
    page,
    limit,
    paginatedSubmissions.length,
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
      selectedUnitType: effectiveSelectedUnitType,
      selectedUnitId: effectiveSelectedUnitId,
      departmentsInDivision: Array.from(departmentsInSelectedDivision),
      // Log first few submissions for debugging
      sampleSubmissions: allSubmissions.slice(0, 3).map((s) => ({
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
