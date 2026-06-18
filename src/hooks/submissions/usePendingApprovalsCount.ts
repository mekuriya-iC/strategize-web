/**
 * Pending Approvals Count Hook
 * Lightweight hook that returns the total number of pending approval requests
 * for the current user based on their role.
 *
 * Used by Sidebar (badge on "Approve Requests") and Topbar (notification bell).
 */

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useAuthStore, useOrgUnitStore } from "@/stores";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import {
  type ApproverRole,
  useSubmissionQueries,
  useDepartmentHierarchy,
  filterSubmissionsByHierarchy,
  filterSubmissionsByListMode,
} from "@/hooks/submissions";
import { GET_LOGBOOK_ENTRIES } from "@/lib/graphql/queries/logbook";

interface PendingApprovalsCount {
  /** Total pending approval count (submissions + logbook entries) */
  count: number;
  /** Pending objective/KPI submissions count */
  submissionCount: number;
  /** Pending logbook entries count */
  logbookCount: number;
  /** Whether data is still loading */
  loading: boolean;
}

/**
 * Derive the approver role from the user's system role.
 * Mirrors the logic in SubmissionApprovalsTable.
 */
function getApproverRole(
  userRole: string | undefined,
): ApproverRole {
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return "CORPORATE";
  if (userRole === "DIRECTOR") return "DIVISION";
  if (userRole === "MANAGER") return "DEPARTMENT";
  return "CORPORATE";
}

export function usePendingApprovalsCount(): PendingApprovalsCount {
  const user = useAuthStore((state) => state.user);
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const { scope } = usePermissions();

  const approverRole = getApproverRole(user?.role);

  const shouldMakeQueries = Boolean(
    user &&
      (user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        approverRole === "DIVISION" ||
        approverRole === "DEPARTMENT" ||
        selectedUnit),
  );

  // ── Objective / KPI submissions (pending only) ───────────────────────
  const {
    submissions: allSubmissions,
    loading: submissionsLoading,
  } = useSubmissionQueries({
    shouldFetch: shouldMakeQueries,
    approverRole,
    pendingOnly: true,
  });

  // ── Hierarchy filtering (same as useSubmissionApprovals) ──────────────
  const {
    departmentsWithoutDivision,
    getDepartmentsForDivision,
    loading: departmentsLoading,
  } = useDepartmentHierarchy({
    shouldFetch:
      shouldMakeQueries &&
      (approverRole === "CORPORATE" || approverRole === "DIVISION"),
  });

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

  const departmentsInSelectedDivision =
    effectiveSelectedUnitId && effectiveSelectedUnitType === "division"
      ? getDepartmentsForDivision(effectiveSelectedUnitId)
      : new Set<string>();

  const submissionCount = useMemo(() => {
    // Filter to inbound + hierarchy
    const inbound = filterSubmissionsByListMode(
      allSubmissions,
      "inbound",
      approverRole,
      user?.employeeId,
    );
    const hierarchyFiltered = filterSubmissionsByHierarchy(
      inbound,
      approverRole,
      effectiveSelectedUnitType,
      departmentsWithoutDivision,
      departmentsInSelectedDivision,
      effectiveSelectedUnitId,
    );
    return hierarchyFiltered.length;
  }, [
    allSubmissions,
    approverRole,
    user?.employeeId,
    effectiveSelectedUnitType,
    departmentsWithoutDivision,
    departmentsInSelectedDivision,
    effectiveSelectedUnitId,
  ]);

  // ── Logbook entries (SUBMITTED = pending) ────────────────────────────
  const { data: logbookData, loading: logbookLoading } = useQuery(
    GET_LOGBOOK_ENTRIES,
    {
      variables: {
        entryStatus: "SUBMITTED",
        limit: 200,
        page: 1,
      },
      skip: !user?.employeeId,
      fetchPolicy: "cache-and-network",
      pollInterval: 60000, // Poll every 60 s for fresh data
    },
  );

  const logbookCount = useMemo(() => {
    const entries = logbookData?.logbookEntries?.items || [];
    // Only count entries that are not submitted by the current user
    // (the user shouldn't see their own entries as pending approvals)
    return entries.filter(
      (e: any) => e.employee?.employeeId !== user?.employeeId,
    ).length;
  }, [logbookData, user?.employeeId]);

  const loading = submissionsLoading || departmentsLoading || logbookLoading;
  const count = submissionCount + logbookCount;

  return { count, submissionCount, logbookCount, loading };
}
