import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import { ASSIGN_OBJECTIVE } from "@/lib/graphql/mutations/objectives";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import type { AssignObjectiveMutationVariables } from "@/types/graphql";
import { objectiveLogger } from "@/lib/logger";

export const useObjectiveAssignment = () => {
  const [assignObjectiveMutation, { loading }] = useMutation(ASSIGN_OBJECTIVE, {
    onCompleted: (data) => {
      const assignedObjective = data?.assignObjective;

      toast.success("Objective assigned successfully!", {
        description: `"${assignedObjective?.parent?.name ?? assignedObjective?.name ?? "Objective"}" has been assigned with ${assignedObjective?.kpis?.length ?? 0} KPIs.`,
      });
    },
    onError: (error) => {
      objectiveLogger.error("Error assigning objective:", error);
      toast.error("Failed to assign objective", { description: error.message });
    },
    refetchQueries: [{ query: GET_OBJECTIVES }, { query: GET_KPIS }],
    awaitRefetchQueries: true,
  });

  const assignObjective = async (
    input: AssignObjectiveMutationVariables["input"]
  ) => {
    try {
      const result = await assignObjectiveMutation({ variables: { input } });
      const assigned = result.data?.assignObjective;

      return assigned;
    } catch (error) {
      objectiveLogger.error("Error in assignObjective:", error);
      throw error;
    }
  };

  return {
    assignObjective,
    loading,
  };
};
