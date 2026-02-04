import { useMutation } from "@apollo/client";
import {
  CREATE_OBJECTIVE,
  UPDATE_OBJECTIVE,
  REMOVE_OBJECTIVE,
} from "@/lib/graphql/mutations/objectives";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import {
  CreateObjectiveMutationVariables,
  UpdateObjectiveMutationVariables,
  RemoveObjectiveMutationVariables,
} from "@/types/graphql";
import { objectiveLogger } from "@/lib/logger";
import { invalidateAfterMutation } from "@/stores/cacheStore";

export const useObjectiveMutations = () => {
  const [createObjective, { loading: createLoading, error: createError }] =
    useMutation(CREATE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        {
          query: GET_OBJECTIVES,
          variables: { page: 1, limit: 10, search: "" },
        },
      ],
    });

  const [updateObjective, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        {
          query: GET_OBJECTIVES,
          variables: { page: 1, limit: 10, search: "" },
        },
      ],
    });

  const [removeObjective, { loading: removeLoading, error: removeError }] =
    useMutation(REMOVE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
        invalidateAfterMutation.submission();
      },
      refetchQueries: [
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        {
          query: GET_OBJECTIVES,
          variables: { page: 1, limit: 10, search: "" },
        },
      ],
    });

  const handleCreateObjective = async (
    variables: CreateObjectiveMutationVariables
  ) => {
    try {
      const result = await createObjective({ variables });
      return result.data?.createObjective;
    } catch (error) {
      objectiveLogger.error("Error creating objective:", error);
      throw error;
    }
  };

  const handleUpdateObjective = async (
    variables: UpdateObjectiveMutationVariables
  ) => {
    try {
      const result = await updateObjective({ variables });
      return result.data?.updateObjective;
    } catch (error) {
      objectiveLogger.error("Error updating objective:", error);
      throw error;
    }
  };

  const handleRemoveObjective = async (
    variables: RemoveObjectiveMutationVariables
  ) => {
    try {
      const result = await removeObjective({ variables });
      return result.data?.removeObjective;
    } catch (error) {
      objectiveLogger.error("Error removing objective:", error);
      throw error;
    }
  };

  return {
    createObjective: handleCreateObjective,
    updateObjective: handleUpdateObjective,
    removeObjective: handleRemoveObjective,
    loading: createLoading || updateLoading || removeLoading,
    error: createError || updateError || removeError,
  };
};
