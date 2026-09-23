/**
 * Lightweight pending-approvals badge data.
 * Uses role-scoped levels, server-side PENDING filter, and slim GraphQL fields
 * so the dashboard shell stays fast without changing approval workflows.
 */

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useAuthStore, useOrgUnitStore } from "@/stores";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import {
  type ApproverRole,
  type MinimalSubmission,
} from "./types";
import {
  useDepartmentHierarchy,
} from "./useDepartmentHierarchy";
import {
  filterSubmissionsByHierarchy,
  filterSubmissionsByListMode,
  deduplicateSubmissions,
} from "./utils";
import { GET_PENDING_SUBMISSIONS_LIGHT } from "@/lib/graphql/queries/submissions";
import { GET_LOGBOOK_PENDING_BADGE } from "@/lib/graphql/queries/logbook";
import type { ObjectiveType } from "@/types/graphql";
import {
  BADGE_LIMIT,
  inboundLevelsForApprover,
  kpiSubmissionsQueryVariables,
  objectiveSubmissionsQueryVariables,
} from "./submissionQueryVariables";

interface PendingApprovalsCount {
  count: number;
  submissionCount: number;
  logbookCount: number;
  loading: boolean;
}

function getApproverRole(userRole: string | undefined): ApproverRole {
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return "CORPORATE";
  if (userRole === "DIRECTOR") return "DIVISION";
  if (userRole === "MANAGER") return "DEPARTMENT";
  return "CORPORATE";
}

function mapLightItems(
  items: MinimalSubmission[] | undefined,
): MinimalSubmission[] {
  return (items ?? []).map((item) => ({
    ...item,
    objective: item.objective
      ? {
          ...item.objective,
          name:
            item.objective.name ?? (item.objective as { title?: string }).title,
        }
      : item.objective,
    kpi: item.kpi
      ? {
          ...item.kpi,
          objective: item.kpi.objective
            ? {
                ...item.kpi.objective,
                name:
                  item.kpi.objective.name ??
                  (item.kpi.objective as { title?: string }).title,
              }
            : item.kpi.objective,
        }
      : item.kpi,
  }));
}

function useLightLevelQuery(
  level: ObjectiveType,
  enabledLevels: ObjectiveType[],
  shouldFetch: boolean,
  submissionType: "OBJECTIVE" | "KPI",
) {
  const buildVars =
    submissionType === "OBJECTIVE"
      ? objectiveSubmissionsQueryVariables
      : kpiSubmissionsQueryVariables;

  return useQuery(GET_PENDING_SUBMISSIONS_LIGHT, {
    variables: buildVars(level, {
      limit: BADGE_LIMIT,
      status: "PENDING",
    }),
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    skip: !shouldFetch || !enabledLevels.includes(level),
  });
}

export function usePendingApprovalsCount(): PendingApprovalsCount {
  const user = useAuthStore((state) => state.user);
  const selectedUnit = useOrgUnitStore((state) => state.selectedUnit);
  const { scope } = usePermissions();

  const approverRole = getApproverRole(user?.role);
  const enabledLevels = useMemo(
    () => inboundLevelsForApprover(approverRole),
    [approverRole],
  );

  const shouldMakeQueries = Boolean(
    user &&
      (user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        approverRole === "DIVISION" ||
        approverRole === "DEPARTMENT" ||
        selectedUnit),
  );

  const divisionObj = useLightLevelQuery(
    "DIVISION",
    enabledLevels,
    shouldMakeQueries,
    "OBJECTIVE",
  );
  const departmentObj = useLightLevelQuery(
    "DEPARTMENT",
    enabledLevels,
    shouldMakeQueries,
    "OBJECTIVE",
  );
  const personnelObj = useLightLevelQuery(
    "PERSONNEL",
    enabledLevels,
    shouldMakeQueries,
    "OBJECTIVE",
  );
  const divisionKpi = useLightLevelQuery(
    "DIVISION",
    enabledLevels,
    shouldMakeQueries,
    "KPI",
  );
  const departmentKpi = useLightLevelQuery(
    "DEPARTMENT",
    enabledLevels,
    shouldMakeQueries,
    "KPI",
  );
  const personnelKpi = useLightLevelQuery(
    "PERSONNEL",
    enabledLevels,
    shouldMakeQueries,
    "KPI",
  );

  const allSubmissions = useMemo(
    () =>
      deduplicateSubmissions([
        ...mapLightItems(
          divisionObj.data?.submissions?.items as
            | MinimalSubmission[]
            | undefined,
        ),
        ...mapLightItems(
          departmentObj.data?.submissions?.items as
            | MinimalSubmission[]
            | undefined,
        ),
        ...mapLightItems(
          personnelObj.data?.submissions?.items as
            | MinimalSubmission[]
            | undefined,
        ),
        ...mapLightItems(
          divisionKpi.data?.submissions?.items as
            | MinimalSubmission[]
            | undefined,
        ),
        ...mapLightItems(
          departmentKpi.data?.submissions?.items as
            | MinimalSubmission[]
            | undefined,
        ),
        ...mapLightItems(
          personnelKpi.data?.submissions?.items as
            | MinimalSubmission[]
            | undefined,
        ),
      ]),
    [
      divisionObj.data,
      departmentObj.data,
      personnelObj.data,
      divisionKpi.data,
      departmentKpi.data,
      personnelKpi.data,
    ],
  );

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

  const { data: logbookData, loading: logbookLoading } = useQuery(
    GET_LOGBOOK_PENDING_BADGE,
    {
      variables: {
        entryStatus: "SUBMITTED",
        limit: BADGE_LIMIT,
        page: 1,
      },
      skip: !user?.employeeId,
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
      pollInterval: 120_000,
    },
  );

  const logbookCount = useMemo(() => {
    const entries = logbookData?.logbookEntries?.items || [];
    return entries.filter(
      (e: { owner?: { employeeId?: string } }) =>
        e.owner?.employeeId !== user?.employeeId,
    ).length;
  }, [logbookData, user?.employeeId]);

  const submissionsLoading =
    divisionObj.loading ||
    departmentObj.loading ||
    personnelObj.loading ||
    divisionKpi.loading ||
    departmentKpi.loading ||
    personnelKpi.loading;

  const loading = submissionsLoading || departmentsLoading || logbookLoading;
  const count = submissionCount + logbookCount;

  return { count, submissionCount, logbookCount, loading };
}
