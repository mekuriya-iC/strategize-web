import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_AGGREGATE_PERFORMANCE_RESULTS,
  GET_AGGREGATE_PERFORMANCE_RESULT,
  GET_PERFORMANCE_WEIGHT_CONFIGS,
} from '@/lib/graphql/queries/performance';
import {
  CREATE_AGGREGATE_PERFORMANCE_RESULT,
  UPDATE_AGGREGATE_PERFORMANCE_RESULT,
  REMOVE_AGGREGATE_PERFORMANCE_RESULT,
  CREATE_PERFORMANCE_WEIGHT_CONFIG,
  UPDATE_PERFORMANCE_WEIGHT_CONFIG,
} from '@/lib/graphql/mutations/performance';

// ===================== TYPES =====================

export interface AggregatePerformanceResult {
  aggregatePerformanceResultId: string;
  aggregateScore: number;
  competencyScore?: number;
  individualKpiScore?: number;
  sharedKpiScore?: number;
  computedAt: string;
  createdAt: string;
  user: {
    employeeId: string;
    fullName: string;
    email?: string;
    picture?: string;
    title?: string;
    department?: {
      departmentId: string;
      name: string;
    };
  };
  strategicPeriod: {
    strategicPeriodId: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  weightConfig: {
    performanceWeightConfigId: string;
    competencyWeight: number;
    individualKpiWeight: number;
    sharedKpiWeight: number;
  };
}

export interface PerformanceWeightConfig {
  performanceWeightConfigId: string;
  competencyWeight: number;
  individualKpiWeight: number;
  sharedKpiWeight: number;
  createdAt: string;
  strategicPeriod: {
    strategicPeriodId: string;
    name: string;
  };
  configuredBy: {
    employeeId: string;
    fullName: string;
  };
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemCount: number;
}

// ===================== QUERY HOOKS =====================

export const useAggregatePerformanceResults = (variables: {
  page?: number;
  limit?: number;
  strategicPeriodId?: string;
  userId?: string;
} = {}) => {
  const { page = 1, limit = 50, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_AGGREGATE_PERFORMANCE_RESULTS, {
    variables: { page, limit, ...rest },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    results: (data?.aggregatePerformanceResults?.items || []) as AggregatePerformanceResult[],
    meta: data?.aggregatePerformanceResults?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const usePerformanceWeightConfigs = (variables: {
  page?: number;
  limit?: number;
  strategicPeriodId?: string;
} = {}) => {
  const { page = 1, limit = 20, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_PERFORMANCE_WEIGHT_CONFIGS, {
    variables: { page, limit, ...rest },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    configs: (data?.performanceWeightConfigs?.items || []) as PerformanceWeightConfig[],
    meta: data?.performanceWeightConfigs?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const usePerformanceMutations = () => {
  const [createResultMutation, { loading: createLoading }] = useMutation(
    CREATE_AGGREGATE_PERFORMANCE_RESULT,
    {
      onCompleted: () => {
        toast.success('Performance result created successfully!');
      },
      onError: (error) => {
        toast.error('Failed to create performance result', { description: error.message });
      },
      refetchQueries: [{ query: GET_AGGREGATE_PERFORMANCE_RESULTS, variables: { page: 1, limit: 50 } }],
    }
  );

  const [updateResultMutation, { loading: updateLoading }] = useMutation(
    UPDATE_AGGREGATE_PERFORMANCE_RESULT,
    {
      onCompleted: () => {
        toast.success('Performance result updated successfully!');
      },
      onError: (error) => {
        toast.error('Failed to update performance result', { description: error.message });
      },
    }
  );

  const [createWeightConfigMutation, { loading: createWeightLoading }] = useMutation(
    CREATE_PERFORMANCE_WEIGHT_CONFIG,
    {
      onCompleted: () => {
        toast.success('Weight configuration created successfully!');
      },
      onError: (error) => {
        toast.error('Failed to create weight configuration', { description: error.message });
      },
      refetchQueries: [{ query: GET_PERFORMANCE_WEIGHT_CONFIGS, variables: { page: 1, limit: 20 } }],
    }
  );

  const [updateWeightConfigMutation, { loading: updateWeightLoading }] = useMutation(
    UPDATE_PERFORMANCE_WEIGHT_CONFIG,
    {
      onCompleted: () => {
        toast.success('Weight configuration updated successfully!');
      },
      onError: (error) => {
        toast.error('Failed to update weight configuration', { description: error.message });
      },
    }
  );

  return {
    createResult: async (input: {
      aggregateScore: number;
      userId: string;
      strategicPeriodId: string;
      weightConfigId: string;
      organizationId: string;
      competencyScore?: number;
      individualKpiScore?: number;
      sharedKpiScore?: number;
    }) => {
      const result = await createResultMutation({
        variables: { createAggregatePerformanceResultInput: input },
      });
      return result.data?.createAggregatePerformanceResult;
    },

    updateResult: async (input: {
      aggregatePerformanceResultId: string;
      aggregateScore?: number;
      competencyScore?: number;
      individualKpiScore?: number;
      sharedKpiScore?: number;
    }) => {
      const result = await updateResultMutation({
        variables: { updateAggregatePerformanceResultInput: input },
      });
      return result.data?.updateAggregatePerformanceResult;
    },

    createWeightConfig: async (input: {
      competencyWeight: number;
      individualKpiWeight: number;
      sharedKpiWeight: number;
      strategicPeriodId: string;
      organizationId: string;
    }) => {
      const result = await createWeightConfigMutation({
        variables: { createPerformanceWeightConfigInput: input },
      });
      return result.data?.createPerformanceWeightConfig;
    },

    updateWeightConfig: async (input: {
      performanceWeightConfigId: string;
      competencyWeight?: number;
      individualKpiWeight?: number;
      sharedKpiWeight?: number;
    }) => {
      const result = await updateWeightConfigMutation({
        variables: { updatePerformanceWeightConfigInput: input },
      });
      return result.data?.updatePerformanceWeightConfig;
    },

    loading: {
      createResult: createLoading,
      updateResult: updateLoading,
      createWeightConfig: createWeightLoading,
      updateWeightConfig: updateWeightLoading,
    },
  };
};
