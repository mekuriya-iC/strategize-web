import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_KPIS, GET_KPI } from "@/lib/graphql/queries/kpis";
import {
  CREATE_KPI,
  UPDATE_KPI,
  DELETE_KPI,
} from "@/lib/graphql/mutations/kpis";

// ===================== TYPES =====================

export interface KpiObjective {
  objectiveId: string;
  title: string;
  level?: string;
  status?: string;
  type?: string;
  assigneeType?: string;
}

export interface KpiCreatedBy {
  employeeId: string;
  fullName: string;
  email?: string;
  title?: string;
}

export interface KpiTarget {
  timeline: string;
  target: number;
}

export interface Kpi {
  kpiId: string;
  name: string;
  description?: string;
  kpiType: string;
  measurementUnit: string;
  unitType?: string;
  customUnitLabel?: string;
  targetValue: number;
  baselineValue?: number;
  baseline?: number;
  weight?: number;
  frequency: string;
  status?: string;
  targetStatus?: string;
  isActive: boolean;
  isDeleted?: boolean;
  order: number;
  assigneeType?: string;
  assigneeId?: string;
  assignerId?: string;
  kpiMode?: string;
  managerRetentionPercent?: number;
  aggregationMethod?: "SUM" | "SIMPLE_AVERAGE" | "DENOMINATOR_WEIGHTED_AVERAGE";
  weightingBasisKpiId?: string | null;
  aggregationWeightSource?: "PLANNED_TARGET" | "APPROVED_ACTUAL";
  carryPolicy?: "ADDITIVE" | "NONE";
  weightingBasisKpi?: { kpiId: string; name: string; unitType?: string } | null;
  objective?: KpiObjective;
  createdBy?: KpiCreatedBy;
  parent?: { kpiId: string; name: string };
  targets?: KpiTarget[];
  assignedTargetValue?: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemCount: number;
}

// ===================== QUERY HOOKS =====================

export const useKpis = (
  variables: {
    page?: number;
    limit?: number;
    search?: string;
    organizationId?: string;
    strategicObjectiveId?: string;
  } = {},
) => {
  const { page = 1, limit = 20, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_KPIS, {
    variables: { page, limit, ...rest },
    fetchPolicy: "cache-and-network",
  });

  return {
    kpis: (data?.kpis?.items || []) as Kpi[],
    meta: data?.kpis?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useKpi = (kpiId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_KPI, {
    variables: { kpiId },
    skip: !kpiId,
    fetchPolicy: "cache-and-network",
  });

  return {
    kpi: data?.kpi as Kpi | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const useKpiMutations = () => {
  const [createKpiMutation, { loading: createLoading }] = useMutation(
    CREATE_KPI,
    {
      onCompleted: (data) => {
        toast.success("KPI created successfully!", {
          description: `"${data.createKpi.name}" has been created.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to create KPI", { description: error.message });
      },
      refetchQueries: "active",
      awaitRefetchQueries: true,
    },
  );

  const [updateKpiMutation, { loading: updateLoading }] = useMutation(
    UPDATE_KPI,
    {
      onCompleted: (data) => {
        toast.success("KPI updated successfully!", {
          description: `"${data.updateKpi.name}" has been updated.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to update KPI", { description: error.message });
      },
      refetchQueries: "active",
      awaitRefetchQueries: true,
    },
  );

  const [deleteKpiMutation, { loading: deleteLoading }] = useMutation(
    DELETE_KPI,
    {
      onCompleted: (data) => {
        toast.success("KPI deleted successfully!", {
          description: data?.removeKpi?.name
            ? `"${data.removeKpi.name}" has been removed.`
            : "KPI has been removed.",
        });
      },
      onError: (error) => {
        toast.error("Failed to delete KPI", { description: error.message });
      },
      refetchQueries: "active",
      awaitRefetchQueries: true,
    },
  );

  return {
    createKpi: async (input: {
      organizationId: string;
      name: string;
      measurementUnit: string;
      frequency: string;
      targetValue: number;
      description?: string;
      kpiType?: string;
      baselineValue?: number;
      weight?: number;
      strategicObjectiveId?: string;
      customUnitLabel?: string;
      parentId?: string;
      unitType?: string;
      kpiMode?: string;
      managerRetentionPercent?: number;
      aggregationMethod?: "SUM" | "SIMPLE_AVERAGE" | "DENOMINATOR_WEIGHTED_AVERAGE";
      weightingBasisKpiId?: string | null;
      aggregationWeightSource?: "PLANNED_TARGET" | "APPROVED_ACTUAL";
      carryPolicy?: "ADDITIVE" | "NONE";
    }) => {
      const result = await createKpiMutation({
        variables: { input },
      });
      return result.data?.createKpi;
    },

    updateKpi: async (input: {
      kpiId: string;
      name?: string;
      description?: string;
      measurementUnit?: string;
      frequency?: string;
      targetValue?: number;
      baselineValue?: number;
      weight?: number;
      strategicObjectiveId?: string;
      isActive?: boolean;
      customUnitLabel?: string;
      parentId?: string;
      unitType?: string;
      kpiMode?: string;
      managerRetentionPercent?: number;
      aggregationMethod?: "SUM" | "SIMPLE_AVERAGE" | "DENOMINATOR_WEIGHTED_AVERAGE";
      weightingBasisKpiId?: string | null;
      aggregationWeightSource?: "PLANNED_TARGET" | "APPROVED_ACTUAL";
      carryPolicy?: "ADDITIVE" | "NONE";
    }) => {
      const result = await updateKpiMutation({
        variables: { input },
      });
      return result.data?.updateKpi;
    },

    deleteKpi: async (kpiId: string) => {
      const result = await deleteKpiMutation({
        variables: { kpiId },
      });
      return result.data?.removeKpi;
    },

    loading: {
      create: createLoading,
      update: updateLoading,
      delete: deleteLoading,
    },
  };
};
