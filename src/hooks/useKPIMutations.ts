import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  CREATE_KPI,
  UPDATE_KPI,
  REMOVE_KPI,
} from "@/lib/graphql/mutations/kpis";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import {
  GET_PENDING_SUBMISSIONS,
  GET_KPI_SUBMISSIONS,
} from "@/lib/graphql/queries/submissions";
import type {
  CreateKpiInput,
  UpdateKpiInput,
  KpiTargetInput,
} from "@/types/graphql";

export const useKPIMutations = () => {
  const [createKpiMutation, { loading: createLoading }] = useMutation(
    CREATE_KPI,
    {
      onCompleted: (data) => {
        const createdKpi = data.createKpi;
        toast.success("KPI created successfully!", {
          description: `"${createdKpi.name}" has been created.`,
        });
      },
      onError: (error) => {
        console.error("Error creating KPI:", error);
        toast.error("Failed to create KPI", {
          description: error.message,
        });
      },
      refetchQueries: [{ query: GET_KPIS }],
      awaitRefetchQueries: true,
    }
  );

  const [updateKpiMutation, { loading: updateLoading }] = useMutation(
    UPDATE_KPI,
    {
      onCompleted: (data) => {
        const updatedKpi = data.updateKpi;
        toast.success("KPI updated successfully!", {
          description: `"${updatedKpi.name}" has been updated.`,
        });
      },
      onError: (error) => {
        console.error("Error updating KPI:", error);
        toast.error("Failed to update KPI", {
          description: error.message,
        });
      },
      refetchQueries: [
        { query: GET_KPIS },
        { query: GET_PENDING_SUBMISSIONS },
        { query: GET_KPI_SUBMISSIONS },
      ],
      awaitRefetchQueries: true,
    }
  );

  const [removeKpiMutation, { loading: removeLoading }] = useMutation(
    REMOVE_KPI,
    {
      onCompleted: (data) => {
        const removedKpi = data.removeKpi;
        toast.success("KPI removed successfully!", {
          description: `"${removedKpi.name}" has been removed.`,
        });
      },
      onError: (error) => {
        console.error("Error removing KPI:", error);
        toast.error("Failed to remove KPI", {
          description: error.message,
        });
      },
      refetchQueries: [{ query: GET_KPIS }],
      awaitRefetchQueries: true,
    }
  );

  const createKpi = async (input: CreateKpiInput) => {
    try {
      const result = await createKpiMutation({ variables: { input } });
      return result.data?.createKpi;
    } catch (error) {
      console.error("Error in createKpi:", error);
      throw error;
    }
  };

  const updateKpi = async (input: UpdateKpiInput) => {
    try {
      const result = await updateKpiMutation({ variables: { input } });
      return result.data?.updateKpi;
    } catch (error) {
      console.error("Error in updateKpi:", error);
      throw error;
    }
  };

  const removeKpi = async (kpiId: string) => {
    try {
      const result = await removeKpiMutation({ variables: { id: kpiId } });
      return result.data?.removeKpi;
    } catch (error) {
      console.error("Error in removeKpi:", error);
      throw error;
    }
  };

  // New function to update KPI targets for assignment
  const updateKpiTargets = async (kpiId: string, targets: KpiTargetInput[]) => {
    console.log("🔧 updateKpiTargets called:", {
      kpiId,
      targets,
      input: {
        kpiId,
        targets,
      },
    });

    try {
      const result = await updateKpiMutation({
        variables: {
          input: {
            kpiId,
            targets,
          },
        },
      });

      console.log("🔧 updateKpiTargets result:", {
        success: !!result.data?.updateKpi,
        updatedKpi: result.data?.updateKpi,
        targets: result.data?.updateKpi?.targets,
      });

      return result.data?.updateKpi;
    } catch (error) {
      console.error("Error in updateKpiTargets:", error);
      throw error;
    }
  };

  return {
    createKpi,
    updateKpi,
    removeKpi,
    updateKpiTargets, // New function for target updates
    loading: createLoading || updateLoading || removeLoading,
  };
};
