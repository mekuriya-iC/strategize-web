/**
 * Submission Queries Hook
 * Handles fetching submissions across objective types relevant to the approver.
 */

import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_PENDING_SUBMISSIONS,
  GET_KPI_SUBMISSIONS,
} from "@/lib/graphql/queries/submissions";
import type { ObjectiveType } from "@/types/graphql";
import type { MinimalSubmission, ApproverRole } from "./types";
import { deduplicateSubmissions } from "./utils";
import {
  kpiSubmissionsQueryVariables,
  objectiveSubmissionsQueryVariables,
  inboundLevelsForApprover,
  outboundLevelsForTracking,
  DEFAULT_LIMIT,
} from "./submissionQueryVariables";

interface UseSubmissionQueriesOptions {
  shouldFetch: boolean;
  approverRole: ApproverRole;
  /** When false, returns all statuses (for "my submissions" tracking). Default true. */
  pendingOnly?: boolean;
  /** Page size. Defaults to 1000 for approval tables. */
  limit?: number;
}

interface SubmissionQueriesResult {
  submissions: MinimalSubmission[];
  loading: boolean;
  refetch: () => Promise<void>;
}

function mapSubmissionItems(
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

function collectSubmissionItems(
  ...sources: Array<MinimalSubmission[] | undefined>
): MinimalSubmission[] {
  return sources.flatMap((items) => items ?? []);
}

function useLevelSubmissionQuery(
  level: ObjectiveType,
  enabledLevels: ObjectiveType[],
  shouldFetch: boolean,
  pendingOnly: boolean,
  limit: number,
  submissionType: "OBJECTIVE" | "KPI",
) {
  const query =
    submissionType === "OBJECTIVE" ? GET_PENDING_SUBMISSIONS : GET_KPI_SUBMISSIONS;
  const buildVars =
    submissionType === "OBJECTIVE"
      ? objectiveSubmissionsQueryVariables
      : kpiSubmissionsQueryVariables;

  return useQuery(query, {
    variables: buildVars(level, {
      limit,
      status: pendingOnly ? "PENDING" : undefined,
    }),
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    skip: !shouldFetch || !enabledLevels.includes(level),
  });
}

/**
 * Hook to fetch submissions across objective types relevant to the current role.
 */
export const useSubmissionQueries = ({
  shouldFetch,
  approverRole,
  pendingOnly = true,
  limit = DEFAULT_LIMIT,
}: UseSubmissionQueriesOptions): SubmissionQueriesResult => {
  const enabledLevels = useMemo(
    () =>
      pendingOnly
        ? inboundLevelsForApprover(approverRole)
        : outboundLevelsForTracking(),
    [approverRole, pendingOnly],
  );

  const corporateObj = useLevelSubmissionQuery(
    "CORPORATE",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "OBJECTIVE",
  );
  const divisionObj = useLevelSubmissionQuery(
    "DIVISION",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "OBJECTIVE",
  );
  const departmentObj = useLevelSubmissionQuery(
    "DEPARTMENT",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "OBJECTIVE",
  );
  const personnelObj = useLevelSubmissionQuery(
    "PERSONNEL",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "OBJECTIVE",
  );

  const corporateKpi = useLevelSubmissionQuery(
    "CORPORATE",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "KPI",
  );
  const divisionKpi = useLevelSubmissionQuery(
    "DIVISION",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "KPI",
  );
  const departmentKpi = useLevelSubmissionQuery(
    "DEPARTMENT",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "KPI",
  );
  const personnelKpi = useLevelSubmissionQuery(
    "PERSONNEL",
    enabledLevels,
    shouldFetch,
    pendingOnly,
    limit,
    "KPI",
  );

  const objectiveSubmissions = mapSubmissionItems(
    collectSubmissionItems(
      corporateObj.data?.submissions?.items as MinimalSubmission[] | undefined,
      divisionObj.data?.submissions?.items as MinimalSubmission[] | undefined,
      departmentObj.data?.submissions?.items as MinimalSubmission[] | undefined,
      personnelObj.data?.submissions?.items as MinimalSubmission[] | undefined,
    ),
  );

  const kpiSubmissions = mapSubmissionItems(
    collectSubmissionItems(
      corporateKpi.data?.submissions?.items as MinimalSubmission[] | undefined,
      divisionKpi.data?.submissions?.items as MinimalSubmission[] | undefined,
      departmentKpi.data?.submissions?.items as MinimalSubmission[] | undefined,
      personnelKpi.data?.submissions?.items as MinimalSubmission[] | undefined,
    ),
  );

  const allSubmissions = deduplicateSubmissions([
    ...objectiveSubmissions,
    ...kpiSubmissions,
  ]);

  const loading =
    corporateObj.loading ||
    divisionObj.loading ||
    departmentObj.loading ||
    personnelObj.loading ||
    corporateKpi.loading ||
    divisionKpi.loading ||
    departmentKpi.loading ||
    personnelKpi.loading;

  const refetch = useCallback(async () => {
    await Promise.all([
      corporateObj.refetch(),
      divisionObj.refetch(),
      departmentObj.refetch(),
      personnelObj.refetch(),
      corporateKpi.refetch(),
      divisionKpi.refetch(),
      departmentKpi.refetch(),
      personnelKpi.refetch(),
    ]);
  }, [
    corporateObj.refetch,
    divisionObj.refetch,
    departmentObj.refetch,
    personnelObj.refetch,
    corporateKpi.refetch,
    divisionKpi.refetch,
    departmentKpi.refetch,
    personnelKpi.refetch,
  ]);

  return {
    submissions: allSubmissions,
    loading,
    refetch,
  };
};
