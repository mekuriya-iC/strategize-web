import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_KPIS, GET_KPI } from "@/lib/graphql/queries/kpis";
import {
  CREATE_KPI,
  UPDATE_KPI,
  DELETE_KPI,
} from "@/lib/graphql/mutations/kpis";
import {
  evictDeletedEntity,
  evictRootFields,
} from "@/lib/graphql/cache-invalidation";

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
  calculationType?:
    | "MANUAL_VALUE"
    | "RATIO_FORMULA"
    | "SCALAR_FORMULA"
    | "WEIGHTED_INDEX";
  zeroDenominatorPolicy?: "NOT_CALCULABLE" | "ZERO" | "BLOCK" | null;
  calculationBasisSource?: "NONE" | "DIRECT_VALUE" | "LINKED_KPI";
  actualBasisSource?:
    | "USE_APPROVED_BASIS"
    | "ENTER_ACTUAL_BASIS"
    | "LINKED_KPI_ACTUAL";
  directBasisValue?: string | null;
  directBasisTargets?: Array<{ timeline: string; value: string }>;
  numeratorLabel?: string | null;
  denominatorLabel?: string | null;
  basisUnitType?: string | null;
  quarterPlans?: Array<{
    quarterNumber: number;
    directBasisTarget?: string | null;
  }>;
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
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
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
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
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
      update: (cache, { data }) => {
        if (data?.createKpi) evictRootFields(cache, ["kpis", "objectives"]);
      },
      onCompleted: (data) => {
        toast.success("KPI created successfully!", {
          description: `"${data.createKpi.name}" has been created.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to create KPI", { description: error.message });
      },
    },
  );

  const [updateKpiMutation, { loading: updateLoading }] = useMutation(
    UPDATE_KPI,
    {
      update: (cache, { data }) => {
        if (data?.updateKpi) evictRootFields(cache, ["kpis", "objectives"]);
      },
      onCompleted: (data) => {
        toast.success("KPI updated successfully!", {
          description: `"${data.updateKpi.name}" has been updated.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to update KPI", { description: error.message });
      },
    },
  );

  const [deleteKpiMutation, { loading: deleteLoading }] = useMutation(
    DELETE_KPI,
    {
      update: (cache, { data }, { variables }) => {
        const kpiId = variables?.kpiId ?? data?.removeKpi?.kpiId;
        if (kpiId) {
          evictDeletedEntity(cache, ["kpis", "kpisByObjective", "objectives"], {
            __typename: "Kpi",
            kpiId,
          });
        }
      },
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
