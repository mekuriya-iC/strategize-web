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

export const useDivisionMutations = () => {
  const [createDivisionMutation, { loading: createLoading }] = useMutation(
    CREATE_DIVISION,
    {
      onCompleted: (data) => {
        toast.success("Division created successfully!", {
          description: `${data.createDivision.name} has been added to the system.`,
        });
      },
      onError: (error) => {
        console.error("GraphQL Error:", error);
        toast.error("Failed to create division", {
          description: error.message,
        });
      },
      refetchQueries: [
        {
          query: GET_DIVISIONS,
          variables: { page: 1, limit: 10 },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const [updateDivisionMutation, { loading: updateLoading }] = useMutation(
    UPDATE_DIVISION,
    {
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
      refetchQueries: [
        {
          query: GET_DIVISIONS,
          variables: { page: 1, limit: 10 },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const [removeDivisionMutation, { loading: removeLoading }] = useMutation(
    REMOVE_DIVISION,
    {
      onCompleted: (data) => {
        toast.success("Division deleted successfully!", {
          description: `${data.removeDivision.name} has been removed from the system.`,
        });
      },
      onError: (error) => {
        let errorMessage = error.message;

        // Provide user-friendly message for foreign key constraint errors
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
      refetchQueries: [
        {
          query: GET_DIVISIONS,
          variables: { page: 1, limit: 10 },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const createDivision = async (variables: CreateDivisionMutationVariables) => {
    try {
      const result = await createDivisionMutation({ variables });
      return result.data?.createDivision;
    } catch (error) {
      console.error("Error creating division:", error);
      throw error;
    }
  };

  const updateDivision = async (variables: UpdateDivisionMutationVariables) => {
    try {
      const result = await updateDivisionMutation({ variables });
      return result.data?.updateDivision;
    } catch (error) {
      console.error("Error updating division:", error);
      throw error;
    }
  };

  const removeDivision = async (variables: RemoveDivisionMutationVariables) => {
    try {
      const result = await removeDivisionMutation({ variables });
      return result.data?.removeDivision;
    } catch (error) {
      console.error("Error removing division:", error);
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
