import { useMutation } from "@apollo/client";
import {
  CREATE_KPI,
  UPDATE_KPI,
  REMOVE_KPI,
} from "@/lib/graphql/mutations/kpis";
import { GET_KPIS } from "@/lib/graphql/queries/kpis";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import {
  CreateKpiMutationVariables,
  UpdateKpiMutationVariables,
  RemoveKpiMutationVariables,
} from "@/types/graphql";

export const useKPIMutations = () => {
  const [createKpi, { loading: createLoading, error: createError }] =
    useMutation(CREATE_KPI, {
      refetchQueries: [
        // Refetch KPIs for KPI tables
        { query: GET_KPIS, variables: { page: 1, limit: 10 } },
        { query: GET_KPIS, variables: { page: 1, limit: 20 } },
        { query: GET_KPIS, variables: { page: 1, limit: 50 } },
        { query: GET_KPIS, variables: { page: 1, limit: 10, search: "" } },
        // Refetch Objectives for approval tables (since KPIs are nested in objectives)
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        {
          query: GET_OBJECTIVES,
          variables: { page: 1, limit: 10, search: "" },
        },
      ],
    });

  const [updateKpi, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_KPI, {
      refetchQueries: "all",
      // Force Apollo to completely ignore cache
      fetchPolicy: "no-cache",
      // Clear cache after update
      update: (cache) => {
        cache.evict({ fieldName: "kpis" });
        cache.evict({ fieldName: "objectives" });
        cache.gc();
      },
    });

  const [removeKpi, { loading: removeLoading, error: removeError }] =
    useMutation(REMOVE_KPI, {
      refetchQueries: [
        // Refetch KPIs for KPI tables
        { query: GET_KPIS, variables: { page: 1, limit: 10 } },
        { query: GET_KPIS, variables: { page: 1, limit: 20 } },
        { query: GET_KPIS, variables: { page: 1, limit: 50 } },
        { query: GET_KPIS, variables: { page: 1, limit: 10, search: "" } },
        // Refetch Objectives for approval tables (since KPIs are nested in objectives)
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 10 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 20 } },
        { query: GET_OBJECTIVES, variables: { page: 1, limit: 50 } },
        {
          query: GET_OBJECTIVES,
          variables: { page: 1, limit: 10, search: "" },
        },
      ],
    });

  const handleCreateKpi = async (variables: CreateKpiMutationVariables) => {
    try {
      const result = await createKpi({ variables });
      return result.data?.createKpi;
    } catch (error) {
      console.error("Error creating KPI:", error);
      throw error;
    }
  };

  const handleUpdateKpi = async (variables: UpdateKpiMutationVariables) => {
    try {
      const result = await updateKpi({ variables });
      return result.data?.updateKpi;
    } catch (error) {
      console.error("Error updating KPI:", error);
      throw error;
    }
  };

  const handleRemoveKpi = async (variables: RemoveKpiMutationVariables) => {
    try {
      const result = await removeKpi({ variables });
      return result.data?.removeKpi;
    } catch (error) {
      console.error("Error removing KPI:", error);
      throw error;
    }
  };

  return {
    createKpi: handleCreateKpi,
    updateKpi: handleUpdateKpi,
    removeKpi: handleRemoveKpi,
    loading: createLoading || updateLoading || removeLoading,
    error: createError || updateError || removeError,
  };
};
