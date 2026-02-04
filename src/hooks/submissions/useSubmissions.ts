"use client";

import { useQuery } from "@apollo/client";
import { GET_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
import type {
  SubmissionsQueryVariables,
  PaginatedSubmissions,
} from "@/types/graphql";

interface UseSubmissionsResult {
  submissions: PaginatedSubmissions["items"];
  loading: boolean;
  error?: Error;
  meta?: PaginatedSubmissions["meta"];
  refetch: () => void;
}

export const useSubmissions = (
  variables: SubmissionsQueryVariables
): UseSubmissionsResult => {
  const { data, loading, error, refetch } = useQuery(GET_SUBMISSIONS, {
    variables,
    errorPolicy: "all",
  });

  return {
    submissions: data?.submissions?.items || [],
    loading,
    error: error || undefined,
    meta: data?.submissions?.meta,
    refetch,
  };
};
