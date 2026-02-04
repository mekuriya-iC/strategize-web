import { useMutation } from "@apollo/client";
import { UPDATE_OBJECTIVES_ORDER } from "@/lib/graphql/mutations/objectives";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { toast } from "sonner";

interface OrderUpdate {
  objectiveId: string;
  order: number;
}

export function useObjectivesOrder() {
  const [updateObjectivesOrder, { loading }] = useMutation(UPDATE_OBJECTIVES_ORDER, {
    refetchQueries: [{ query: GET_OBJECTIVES }],
    onError: (error) => {
      console.error("Failed to update objectives order:", error);
      toast.error("Failed to save order. Please try again.");
    },
  });

  const saveOrder = async (updates: OrderUpdate[]) => {
    if (updates.length === 0) return;

    try {
      await updateObjectivesOrder({
        variables: {
          input: updates.map(({ objectiveId, order }) => ({
            objectiveId,
            order,
          })),
        },
      });
      toast.success("Order saved successfully");
    } catch (error) {
      // Error already handled in onError
      throw error;
    }
  };

  return {
    saveOrder,
    isSaving: loading,
  };
}

