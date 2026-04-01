"use client";

import { useQuery } from "@apollo/client";
import { GET_SUBMISSION } from "@/lib/graphql/queries/submissions";
import type { SubmissionQueryVariables, Submission } from "@/types/graphql";

interface UseSubmissionResult {
  submission: Submission | null;
  loading: boolean;
  error?: Error;
  refetch: () => void;
}

export const useSubmission = (
  variables: SubmissionQueryVariables
): UseSubmissionResult => {
  const { data, loading, error, refetch } = useQuery(GET_SUBMISSION, {
    variables,
    errorPolicy: "all",
    skip: !variables.id, // Skip query if no ID provided
  });

  return {
    submission: data?.submission || null,
    loading,
    error: error || undefined,
    refetch,
  };
};
