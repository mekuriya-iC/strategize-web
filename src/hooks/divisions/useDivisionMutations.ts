import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  CREATE_DIVISION,
  UPDATE_DIVISION,
  REMOVE_DIVISION,
} from "@/lib/graphql/mutations/divisions";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import type {
  CreateDivisionMutationVariables,
  UpdateDivisionMutationVariables,
  RemoveDivisionMutationVariables,
} from "@/types/graphql";
import logger from "@/lib/logger";

const divLogger = logger.createChild("Division");

export const useDivisionMutations = () => {
  const [createDivisionMutation, { loading: createLoading }] = useMutation(
    CREATE_DIVISION,
    {
      update: (cache, { data }) => {
        if (data?.createDivision) {
          cache.modify({
            fields: {
              divisions(existingDivisions = null) {
                if (!existingDivisions) return existingDivisions;
                const items = existingDivisions.items || [];
                return {
                  ...existingDivisions,
                  items: [data.createDivision, ...items],
                  meta: {
                    ...existingDivisions.meta,
                    totalItems: (existingDivisions.meta?.totalItems || 0) + 1,
                  },
                };
              },
            },
          });
        }
      },
      onCompleted: (data) => {
        toast.success("Division created successfully!", {
          description: `${data.createDivision.name} has been added to the system.`,
        });
      },
      onError: (error) => {
        divLogger.error("Error creating division:", error);
        toast.error("Failed to create division", {
          description: error.message,
        });
      },
      refetchQueries: 'active',
      awaitRefetchQueries: true,
    }
  );

  const [updateDivisionMutation, { loading: updateLoading }] = useMutation(
    UPDATE_DIVISION,
    {
      update: (cache, { data }) => {
        if (data?.updateDivision) {
          const updated = data.updateDivision;
          cache.modify({
            fields: {
              divisions(existingDivisions = null, { readField }) {
                if (!existingDivisions) return existingDivisions;
                const items = existingDivisions.items || [];
                return {
                  ...existingDivisions,
                  items: items.map((item: any) =>
                    readField('divisionId', item) === updated.divisionId ? updated : item
                  ),
                };
              },
            },
          });
        }
      },
      onCompleted: (data) => {
        toast.success("Division updated successfully!", {
          description: `${data.updateDivision.name} has been updated.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to update division", {
          description: error.message,
        });
      },
      refetchQueries: 'active',
      awaitRefetchQueries: true,
    }
  );

  const [removeDivisionMutation, { loading: removeLoading }] = useMutation(
    REMOVE_DIVISION,
    {
      update: (cache, { data }, { variables }) => {
        if (variables?.divisionId || data?.removeDivision) {
          const deletedId = variables?.divisionId || data?.removeDivision?.divisionId;
          if (deletedId) {
            cache.modify({
              fields: {
                divisions(existingDivisions = null, { readField }) {
                  if (!existingDivisions) return existingDivisions;
                  const items = existingDivisions.items || [];
                  return {
                    ...existingDivisions,
                    items: items.filter((item: any) => readField('divisionId', item) !== deletedId),
                    meta: {
                      ...existingDivisions.meta,
                      totalItems: Math.max(0, (existingDivisions.meta?.totalItems || 0) - 1),
                    },
                  };
                },
              },
            });
            
            // Also evict the specific division from cache
            cache.evict({ id: cache.identify({ __typename: 'Division', divisionId: deletedId }) });
            cache.gc();
          }
        }
      },
      onCompleted: (data) => {
        toast.success("Division deleted successfully!", {
          description: data?.removeDivision?.name ? `${data.removeDivision.name} has been removed from the system.` : 'Division has been removed.',
        });
      },
      onError: (error) => {
        let errorMessage = error.message;

        if (
          error.message?.includes("foreign key constraint") ||
          error.message?.includes("FK_") ||
          error.message?.includes("Department")
        ) {
          errorMessage =
            "Cannot delete division because it still has departments assigned. Please move all departments to other divisions first.";
        }

        toast.error("Failed to delete division", {
          description: errorMessage,
        });
      },
      refetchQueries: 'active',
      awaitRefetchQueries: true,
    }
  );

  const createDivision = async (variables: CreateDivisionMutationVariables) => {
    try {
      const result = await createDivisionMutation({ 
        variables: { createDivisionInput: variables.input } 
      });
      return result.data?.createDivision;
    } catch (error) {
      divLogger.error("Error creating division:", error);
      throw error;
    }
  };

  const updateDivision = async (variables: UpdateDivisionMutationVariables) => {
    try {
      const result = await updateDivisionMutation({ 
        variables: { updateDivisionInput: variables.input } 
      });
      return result.data?.updateDivision;
    } catch (error) {
      divLogger.error("Error updating division:", error);
      throw error;
    }
  };

  const removeDivision = async (variables: RemoveDivisionMutationVariables) => {
    try {
      const result = await removeDivisionMutation({ 
        variables: { divisionId: variables.id || variables.divisionId } 
      });
      return result.data?.removeDivision;
    } catch (error) {
      divLogger.error("Error removing division:", error);
      throw error;
    }
  };

  return {
    createDivision,
    updateDivision,
    removeDivision,
    loading: {
      create: createLoading,
      update: updateLoading,
      remove: removeLoading,
    },
  };
};
