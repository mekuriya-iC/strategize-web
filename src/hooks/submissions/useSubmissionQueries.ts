/**
 * Submission Queries Hook
 * Handles fetching submissions across all objective types
 */

import { useQuery } from "@apollo/client";
import {
  GET_PENDING_SUBMISSIONS,
  GET_KPI_SUBMISSIONS,
} from "@/lib/graphql/queries/submissions";
import type { MinimalSubmission, ApproverRole } from "./types";
import { deduplicateSubmissions } from "./utils";
import {
  kpiSubmissionsQueryVariables,
  objectiveSubmissionsQueryVariables,
} from "./submissionQueryVariables";

interface UseSubmissionQueriesOptions {
  shouldFetch: boolean;
  approverRole: ApproverRole;
  /** When false, returns all statuses (for "my submissions" tracking). Default true. */
  pendingOnly?: boolean;
}

interface SubmissionQueriesResult {
  submissions: MinimalSubmission[];
  loading: boolean;
  refetch: () => void;
}

function mapSubmissionItems(
  items: MinimalSubmission[] | undefined
): MinimalSubmission[] {
  return (items ?? []).map((item) => ({
    ...item,
    objective: item.objective
      ? {
          ...item.objective,
          name: item.objective.name ?? (item.objective as { title?: string }).title,
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

function pendingOnlyStatus(items: MinimalSubmission[]): MinimalSubmission[] {
  return items.filter((s) => s.status === "PENDING");
}

function collectSubmissionItems(
  ...sources: Array<MinimalSubmission[] | undefined>
): MinimalSubmission[] {
  return sources.flatMap((items) => items ?? []);
}

/**
 * Hook to fetch submissions across all objective types
 */
export const useSubmissionQueries = ({
  shouldFetch,
  approverRole,
  pendingOnly = true,
}: UseSubmissionQueriesOptions): SubmissionQueriesResult => {
  const isCorporate = approverRole === "CORPORATE";

  const {
    data: corporateObjData,
    loading: corporateObjLoading,
    refetch: corporateObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: objectiveSubmissionsQueryVariables("CORPORATE"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch || !isCorporate,
  });

  const {
    data: divisionObjData,
    loading: divisionObjLoading,
    refetch: divisionObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: objectiveSubmissionsQueryVariables("DIVISION"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  const {
    data: departmentObjData,
    loading: departmentObjLoading,
    refetch: departmentObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: objectiveSubmissionsQueryVariables("DEPARTMENT"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  const {
    data: personnelObjData,
    loading: personnelObjLoading,
    refetch: personnelObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: objectiveSubmissionsQueryVariables("PERSONNEL"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  const {
    data: corporateKpiData,
    loading: corporateKpiLoading,
    refetch: corporateKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: kpiSubmissionsQueryVariables("CORPORATE"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch || !isCorporate,
  });

  const {
    data: divisionKpiData,
    loading: divisionKpiLoading,
    refetch: divisionKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: kpiSubmissionsQueryVariables("DIVISION"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  const {
    data: departmentKpiData,
    loading: departmentKpiLoading,
    refetch: departmentKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: kpiSubmissionsQueryVariables("DEPARTMENT"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  const {
    data: personnelKpiData,
    loading: personnelKpiLoading,
    refetch: personnelKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: kpiSubmissionsQueryVariables("PERSONNEL"),
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  const applyStatusFilter = (items: MinimalSubmission[]) =>
    pendingOnly ? pendingOnlyStatus(items) : items;

  const objectiveSubmissions = applyStatusFilter(
    mapSubmissionItems(
      collectSubmissionItems(
        corporateObjData?.submissions?.items as MinimalSubmission[] | undefined,
        divisionObjData?.submissions?.items as MinimalSubmission[] | undefined,
        departmentObjData?.submissions?.items as MinimalSubmission[] | undefined,
        personnelObjData?.submissions?.items as MinimalSubmission[] | undefined
      )
    )
  );

  const kpiSubmissions = applyStatusFilter(
    mapSubmissionItems(
      collectSubmissionItems(
        corporateKpiData?.submissions?.items as MinimalSubmission[] | undefined,
        divisionKpiData?.submissions?.items as MinimalSubmission[] | undefined,
        departmentKpiData?.submissions?.items as MinimalSubmission[] | undefined,
        personnelKpiData?.submissions?.items as MinimalSubmission[] | undefined
      )
    )
  );

  const allSubmissions = deduplicateSubmissions([
    ...objectiveSubmissions,
    ...kpiSubmissions,
  ]);

  const loading =
    corporateObjLoading ||
    divisionObjLoading ||
    departmentObjLoading ||
    personnelObjLoading ||
    corporateKpiLoading ||
    divisionKpiLoading ||
    departmentKpiLoading ||
    personnelKpiLoading;

  const refetch = () => {
    corporateObjRefetch();
    divisionObjRefetch();
    departmentObjRefetch();
    personnelObjRefetch();
    corporateKpiRefetch();
    divisionKpiRefetch();
    departmentKpiRefetch();
    personnelKpiRefetch();
  };

  return {
    submissions: allSubmissions,
    loading,
    refetch,
  };
};
