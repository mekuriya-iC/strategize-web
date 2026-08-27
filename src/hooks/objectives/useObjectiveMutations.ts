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
import {
  evictDeletedEntity,
  evictRootFields,
} from "@/lib/graphql/cache-invalidation";
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


export const useObjectiveMutations = () => {
  const invalidateLists = (cache: Parameters<typeof evictRootFields>[0]) =>
    evictRootFields(cache, ["objectives", "objectivesForApproval"]);

  const [createObjective, { loading: createLoading, error: createError }] =
    useMutation(CREATE_OBJECTIVE, { update: invalidateLists });

  const [updateObjective, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_OBJECTIVE, { update: invalidateLists });

  const [deleteObjective, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_OBJECTIVE, {
      update: (cache, { data }, { variables }) => {
        const objectiveId = variables?.objectiveId ?? data?.removeObjective?.objectiveId;
        if (objectiveId) {
          evictDeletedEntity(cache, ["objectives", "objectivesForApproval", "submissions", "kpis"], {
            __typename: "Objective",
            objectiveId,
          });
        }
      },
    });

  const [approveObjective, { loading: approveLoading, error: approveError }] =
    useMutation(APPROVE_OBJECTIVE, { update: invalidateLists });

  const [rejectObjective, { loading: rejectLoading, error: rejectError }] =
    useMutation(REJECT_OBJECTIVE, { update: invalidateLists });

  const [cascadeObjective, { loading: cascadeLoading, error: cascadeError }] =
    useMutation(CASCADE_OBJECTIVE, { update: invalidateLists });

  const [assignObjective, { loading: assignLoading, error: assignError }] =
    useMutation(ASSIGN_OBJECTIVE, { update: invalidateLists });

  const [updateObjectiveStatus, { loading: statusLoading, error: statusError }] =
    useMutation(UPDATE_OBJECTIVE_STATUS, { update: invalidateLists });

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
