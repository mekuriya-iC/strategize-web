import { useMutation } from "@apollo/client";
import {
  CREATE_SUBMISSION,
  CREATE_SUBMISSIONS,
  UPDATE_SUBMISSION,
  REMOVE_SUBMISSION,
} from "@/lib/graphql/mutations/submissions";
import { GET_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import {
  CreateSubmissionMutationVariables,
  CreateSubmissionsMutationVariables,
  UpdateSubmissionMutationVariables,
  RemoveSubmissionMutationVariables,
} from "@/types/graphql";

export const useSubmissionMutations = () => {
  const [createSubmission, { loading: createLoading, error: createError }] =
    useMutation(CREATE_SUBMISSION, {
      refetchQueries: [
        // Refetch submissions for all types and common pagination
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "CORPORATE" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DIVISION" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DEPARTMENT" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "PERSONNEL" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "CORPORATE" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "DIVISION" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "DEPARTMENT" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "PERSONNEL" },
        },
        // Refetch objectives and KPIs as their status might change
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        { query: GET_KPIS, variables: { page: 1, limit: 10 } },
        { query: GET_KPIS, variables: { page: 1, limit: 20 } },
        { query: GET_KPIS, variables: { page: 1, limit: 50 } },
      ],
    });

  const [
    createSubmissions,
    { loading: createBulkLoading, error: createBulkError },
  ] = useMutation(CREATE_SUBMISSIONS, {
    refetchQueries: [
      // Same refetch queries as single create
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 10, type: "CORPORATE" },
      },
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 10, type: "DIVISION" },
      },
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 10, type: "DEPARTMENT" },
      },
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 10, type: "PERSONNEL" },
      },
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 20, type: "CORPORATE" },
      },
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 20, type: "DIVISION" },
      },
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 20, type: "DEPARTMENT" },
      },
      {
        query: GET_SUBMISSIONS,
        variables: { page: 1, limit: 20, type: "PERSONNEL" },
      },
      { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
      { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
      { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
      { query: GET_KPIS, variables: { page: 1, limit: 10 } },
      { query: GET_KPIS, variables: { page: 1, limit: 20 } },
      { query: GET_KPIS, variables: { page: 1, limit: 50 } },
    ],
  });

  const [updateSubmission, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_SUBMISSION, {
      refetchQueries: [
        // Refetch submissions
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "CORPORATE" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DIVISION" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DEPARTMENT" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "PERSONNEL" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "CORPORATE" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "DIVISION" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "DEPARTMENT" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "PERSONNEL" },
        },
      ],
    });

  const [removeSubmission, { loading: removeLoading, error: removeError }] =
    useMutation(REMOVE_SUBMISSION, {
      refetchQueries: [
        // Refetch submissions
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "CORPORATE" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DIVISION" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "DEPARTMENT" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 10, type: "PERSONNEL" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "CORPORATE" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "DIVISION" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "DEPARTMENT" },
        },
        {
          query: GET_SUBMISSIONS,
          variables: { page: 1, limit: 20, type: "PERSONNEL" },
        },
        // Also refetch objectives and KPIs as status might change back
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        { query: GET_KPIS, variables: { page: 1, limit: 10 } },
        { query: GET_KPIS, variables: { page: 1, limit: 20 } },
        { query: GET_KPIS, variables: { page: 1, limit: 50 } },
      ],
    });

  const handleCreateSubmission = async (
    variables: CreateSubmissionMutationVariables
  ) => {
    try {
      const result = await createSubmission({ variables });
      return result.data?.createSubmission;
    } catch (error) {
      console.error("Error creating submission:", error);
      throw error;
    }
  };

  const handleCreateSubmissions = async (
    variables: CreateSubmissionsMutationVariables
  ) => {
    try {
      const result = await createSubmissions({ variables });
      return result.data?.createSubmissions;
    } catch (error) {
      console.error("Error creating bulk submissions:", error);
      throw error;
    }
  };

  const handleUpdateSubmission = async (
    variables: UpdateSubmissionMutationVariables
  ) => {
    try {
      const result = await updateSubmission({ variables });
      return result.data?.updateSubmission;
    } catch (error) {
      console.error("Error updating submission:", error);
      throw error;
    }
  };

  const handleRemoveSubmission = async (
    variables: RemoveSubmissionMutationVariables
  ) => {
    try {
      const result = await removeSubmission({ variables });
      return result.data?.removeSubmission;
    } catch (error) {
      console.error("Error removing submission:", error);
      throw error;
    }
  };

  return {
    createSubmission: handleCreateSubmission,
    createSubmissions: handleCreateSubmissions,
    updateSubmission: handleUpdateSubmission,
    removeSubmission: handleRemoveSubmission,
    loading:
      createLoading || createBulkLoading || updateLoading || removeLoading,
    error: createError || createBulkError || updateError || removeError,
  };
};
