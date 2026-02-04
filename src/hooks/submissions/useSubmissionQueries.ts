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

interface UseSubmissionQueriesOptions {
  shouldFetch: boolean;
  approverRole: ApproverRole;
}

interface SubmissionQueriesResult {
  submissions: MinimalSubmission[];
  loading: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch submissions across all objective types
 * Combines CORPORATE, DIVISION, and DEPARTMENT type queries
 */
export const useSubmissionQueries = ({
  shouldFetch,
  approverRole,
}: UseSubmissionQueriesOptions): SubmissionQueriesResult => {
  const isCorporate = approverRole === "CORPORATE";

  // Query for CORPORATE type objectives (only for corporate approvers)
  const {
    data: corporateObjData,
    loading: corporateObjLoading,
    refetch: corporateObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "CORPORATE" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch || !isCorporate,
  });

  // Query for DIVISION type objectives
  const {
    data: divisionObjData,
    loading: divisionObjLoading,
    refetch: divisionObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DIVISION" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  // Query for DEPARTMENT type objectives
  const {
    data: departmentObjData,
    loading: departmentObjLoading,
    refetch: departmentObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DEPARTMENT" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  // Query for PERSONNEL type objectives
  const {
    data: personnelObjData,
    loading: personnelObjLoading,
    refetch: personnelObjRefetch,
  } = useQuery(GET_PENDING_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "PERSONNEL" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  // Query for KPI submissions - CORPORATE
  const {
    data: corporateKpiData,
    loading: corporateKpiLoading,
    refetch: corporateKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "CORPORATE" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch || !isCorporate,
  });

  // Query for KPI submissions - DIVISION
  const {
    data: divisionKpiData,
    loading: divisionKpiLoading,
    refetch: divisionKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DIVISION" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  // Query for KPI submissions - DEPARTMENT
  const {
    data: departmentKpiData,
    loading: departmentKpiLoading,
    refetch: departmentKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "DEPARTMENT" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  // Query for KPI submissions - PERSONNEL
  const {
    data: personnelKpiData,
    loading: personnelKpiLoading,
    refetch: personnelKpiRefetch,
  } = useQuery(GET_KPI_SUBMISSIONS, {
    variables: { page: 1, limit: 1000, type: "PERSONNEL" },
    fetchPolicy: "cache-and-network",
    skip: !shouldFetch,
  });

  // Combine all objective submissions
  const objectiveSubmissions: MinimalSubmission[] = [
    ...((corporateObjData?.submissions?.items as MinimalSubmission[]) || []),
    ...((divisionObjData?.submissions?.items as MinimalSubmission[]) || []),
    ...((departmentObjData?.submissions?.items as MinimalSubmission[]) || []),
    ...((personnelObjData?.submissions?.items as MinimalSubmission[]) || []),
  ];

  // Combine all KPI submissions
  const kpiSubmissions: MinimalSubmission[] = [
    ...((corporateKpiData?.submissions?.items as MinimalSubmission[]) || []),
    ...((divisionKpiData?.submissions?.items as MinimalSubmission[]) || []),
    ...((departmentKpiData?.submissions?.items as MinimalSubmission[]) || []),
    ...((personnelKpiData?.submissions?.items as MinimalSubmission[]) || []),
  ];

  // Combine and deduplicate
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

