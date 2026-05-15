import { useMutation } from "@apollo/client";
import {
  CREATE_OBJECTIVE,
  UPDATE_OBJECTIVE,
  DELETE_OBJECTIVE,
  APPROVE_OBJECTIVE,
  REJECT_OBJECTIVE,
  CASCADE_OBJECTIVE,
  ASSIGN_OBJECTIVE,
  UPDATE_OBJECTIVE_STATUS,
} from "@/lib/graphql/mutations/objectives";
import { GET_OBJECTIVES, GET_OBJECTIVE } from "@/lib/graphql/queries/objectives";
import {
  CreateObjectiveMutationVariables,
  UpdateObjectiveMutationVariables,
  DeleteObjectiveMutationVariables,
  ApproveObjectiveMutationVariables,
  RejectObjectiveMutationVariables,
  CascadeObjectiveMutationVariables,
  AssignObjectiveMutationVariables,
  UpdateObjectiveStatusMutationVariables,
} from "@/types/graphql";
import { objectiveLogger } from "@/lib/logger";
import { invalidateAfterMutation } from "@/stores/cacheStore";

const OBJECTIVES_REFETCH = [
  { query: GET_OBJECTIVES, variables: { page: 1, limit: 1000 } },
  "GetObjectives",
];

export const useObjectiveMutations = () => {
  const [createObjective, { loading: createLoading, error: createError }] =
    useMutation(CREATE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [...OBJECTIVES_REFETCH],
    });

  const [updateObjective, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: (result) => {
        const id = result.data?.updateObjective?.objectiveId;
        const queries: Array<
          | (typeof OBJECTIVES_REFETCH)[number]
          | { query: typeof GET_OBJECTIVE; variables: { objectiveId: string } }
        > = [...OBJECTIVES_REFETCH];
        if (id) {
          queries.push({ query: GET_OBJECTIVE, variables: { objectiveId: id } });
        }
        return queries;
      },
    });

  const [deleteObjective, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
        invalidateAfterMutation.submission();
      },
      refetchQueries: [...OBJECTIVES_REFETCH],
    });

  const [approveObjective, { loading: approveLoading, error: approveError }] =
    useMutation(APPROVE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [...OBJECTIVES_REFETCH],
    });

  const [rejectObjective, { loading: rejectLoading, error: rejectError }] =
    useMutation(REJECT_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [...OBJECTIVES_REFETCH],
    });

  const [cascadeObjective, { loading: cascadeLoading, error: cascadeError }] =
    useMutation(CASCADE_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [...OBJECTIVES_REFETCH],
    });

  const [assignObjective, { loading: assignLoading, error: assignError }] =
    useMutation(ASSIGN_OBJECTIVE, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [...OBJECTIVES_REFETCH],
    });

  const [updateObjectiveStatus, { loading: statusLoading, error: statusError }] =
    useMutation(UPDATE_OBJECTIVE_STATUS, {
      onCompleted: () => {
        invalidateAfterMutation.objective();
      },
      refetchQueries: [...OBJECTIVES_REFETCH],
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

  const handleDeleteObjective = async (
    variables: DeleteObjectiveMutationVariables
  ) => {
    try {
      const result = await deleteObjective({ variables });
      return result.data?.deleteObjective;
    } catch (error) {
      objectiveLogger.error("Error deleting objective:", error);
      throw error;
    }
  };

  const handleApproveObjective = async (
    variables: ApproveObjectiveMutationVariables
  ) => {
    try {
      const result = await approveObjective({ variables });
      return result.data?.approveObjective;
    } catch (error) {
      objectiveLogger.error("Error approving objective:", error);
      throw error;
    }
  };

  const handleRejectObjective = async (
    variables: RejectObjectiveMutationVariables
  ) => {
    try {
      const result = await rejectObjective({ variables });
      return result.data?.rejectObjective;
    } catch (error) {
      objectiveLogger.error("Error rejecting objective:", error);
      throw error;
    }
  };

  const handleCascadeObjective = async (
    variables: CascadeObjectiveMutationVariables
  ) => {
    try {
      const result = await cascadeObjective({ variables });
      return result.data?.cascadeObjective;
    } catch (error) {
      objectiveLogger.error("Error cascading objective:", error);
      throw error;
    }
  };

  const handleAssignObjective = async (
    variables: AssignObjectiveMutationVariables
  ) => {
    try {
      const result = await assignObjective({ variables });
      return result.data?.assignObjective;
    } catch (error) {
      objectiveLogger.error("Error assigning objective:", error);
      throw error;
    }
  };

  const handleUpdateObjectiveStatus = async (
    variables: UpdateObjectiveStatusMutationVariables
  ) => {
    try {
      const result = await updateObjectiveStatus({ variables });
      return result.data?.updateObjectiveStatus;
    } catch (error) {
      objectiveLogger.error("Error updating objective status:", error);
      throw error;
    }
  };

  return {
    createObjective: handleCreateObjective,
    updateObjective: handleUpdateObjective,
    deleteObjective: handleDeleteObjective,
    approveObjective: handleApproveObjective,
    rejectObjective: handleRejectObjective,
    cascadeObjective: handleCascadeObjective,
    assignObjective: handleAssignObjective,
    updateObjectiveStatus: handleUpdateObjectiveStatus,
    loading: createLoading || updateLoading || deleteLoading || approveLoading || rejectLoading || cascadeLoading || assignLoading || statusLoading,
    error: createError || updateError || deleteError || approveError || rejectError || cascadeError || assignError || statusError,
  };
};
