import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import { ASSIGN_OBJECTIVE } from "@/lib/graphql/mutations/objectives";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import type { AssignObjectiveMutationVariables } from "@/types/graphql";

export const useObjectiveAssignment = () => {
  const [assignObjectiveMutation, { loading }] = useMutation(ASSIGN_OBJECTIVE, {
    onCompleted: (data) => {
      const assignedObjective = data.assignObjective;
      toast.success("Objective assigned successfully!", {
        description: `"${
          assignedObjective.parent?.name
        }" has been assigned with ${assignedObjective.kpis?.length || 0} KPIs.`,
      });
    },
    onError: (error) => {
      console.error("Error assigning objective:", error);
      toast.error("Failed to assign objective", {
        description: error.message,
      });
    },
    // Refetch objectives and KPIs to update the UI
    refetchQueries: [{ query: GET_OBJECTIVES }, { query: GET_KPIS }],
    awaitRefetchQueries: true,
  });

  const assignObjective = async (
    input: AssignObjectiveMutationVariables["input"]
  ) => {
    try {
      const result = await assignObjectiveMutation({ variables: { input } });
      return result.data?.assignObjective;
    } catch (error) {
      console.error("Error in assignObjective:", error);
      throw error;
    }
  };

  return {
    assignObjective,
    loading,
  };
};
