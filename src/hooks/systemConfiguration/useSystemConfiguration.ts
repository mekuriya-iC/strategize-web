import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_SYSTEM_CONFIGURATIONS,
  GET_SYSTEM_CONFIGURATION,
  GET_SYSTEM_CONFIGURATION_BY_ORG,
} from '@/lib/graphql/queries/systemConfiguration';
import {
  CREATE_SYSTEM_CONFIGURATION,
  UPDATE_SYSTEM_CONFIGURATION,
  REMOVE_SYSTEM_CONFIGURATION,
} from '@/lib/graphql/mutations/systemConfiguration';

// ===================== TYPES =====================

export type KpiTargetRangeOutsidePolicy =
  | "ZERO_OUTSIDE"
  | "NEAREST_BOUND_RATIO";

export interface SystemConfiguration {
  systemConfigurationId: string;
  timezone: string;
  fiscalYearStartMonth: number;
  defaultRatingScaleMin: number;
  defaultRatingScaleMax: number;
  checkinDayOfWeek: number;
  checkoutDayOfWeek: number;
  enableEmailNotifications: boolean;
  enableSharedKpis: boolean;
  enableLogbookAttachments: boolean;
  enableFormulaKpis: boolean;
  defaultKpiZeroDenominatorPolicy: "NOT_CALCULABLE" | "ZERO" | "BLOCK";
  defaultKpiResultDirection: "HIGHER_IS_BETTER" | "LOWER_IS_BETTER" | "TARGET_RANGE";
  defaultKpiTargetRangeOutsidePolicy: KpiTargetRangeOutsidePolicy;
  createdAt: string;
  updatedAt: string;
  updatedBy?: {
    employeeId: string;
    fullName: string;
    email?: string;
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

export const useSystemConfigurations = (variables: {
  page?: number;
  limit?: number;
} = {}) => {
  const { page = 1, limit = 50 } = variables;
  const { data, loading, error, refetch } = useQuery(GET_SYSTEM_CONFIGURATIONS, {
    variables: { page, limit },
    fetchPolicy: 'cache-and-network',
  });

  return {
    configurations: (data?.systemConfigurations?.items || []) as SystemConfiguration[],
    meta: data?.systemConfigurations?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useSystemConfiguration = (systemConfigurationId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_SYSTEM_CONFIGURATION, {
    variables: { systemConfigurationId },
    skip: !systemConfigurationId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    configuration: data?.systemConfiguration as SystemConfiguration | undefined,
    loading,
    error,
    refetch,
  };
};

export const useSystemConfigurationByOrg = (organizationId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_SYSTEM_CONFIGURATION_BY_ORG, {
    variables: { organizationId },
    skip: !organizationId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    configuration: data?.systemConfigurationByOrg as SystemConfiguration | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const useSystemConfigurationMutations = () => {
  const [createMutation, { loading: createLoading }] = useMutation(
    CREATE_SYSTEM_CONFIGURATION,
    {
      onCompleted: () => {
        toast.success('Configuration created successfully!');
      },
      onError: (error) => {
        toast.error('Failed to create configuration', { description: error.message });
      },
      refetchQueries: [{ query: GET_SYSTEM_CONFIGURATIONS, variables: { page: 1, limit: 50 } }],
    }
  );

  const [updateMutation, { loading: updateLoading }] = useMutation(
    UPDATE_SYSTEM_CONFIGURATION,
    {
      onCompleted: () => {
        toast.success('Configuration updated successfully!');
      },
      onError: (error) => {
        toast.error('Failed to update configuration', { description: error.message });
      },
    }
  );

  const [removeMutation, { loading: removeLoading }] = useMutation(
    REMOVE_SYSTEM_CONFIGURATION,
    {
      onCompleted: () => {
        toast.success('Configuration deleted successfully!', {
          position: 'top-center',
        });
      },
      onError: (error) => {
        toast.error('Failed to delete configuration', { description: error.message });
      },
      refetchQueries: [{ query: GET_SYSTEM_CONFIGURATIONS, variables: { page: 1, limit: 50 } }],
    }
  );

  return {
    createConfiguration: async (input: {
      organizationId: string;
      timezone?: string;
      fiscalYearStartMonth?: number;
      defaultRatingScaleMin?: number;
      defaultRatingScaleMax?: number;
      checkinDayOfWeek?: number;
      checkoutDayOfWeek?: number;
      enableEmailNotifications?: boolean;
      enableSharedKpis?: boolean;
      enableLogbookAttachments?: boolean;
      enableFormulaKpis?: boolean;
      defaultKpiZeroDenominatorPolicy?: "NOT_CALCULABLE" | "ZERO" | "BLOCK";
      defaultKpiResultDirection?: "HIGHER_IS_BETTER" | "LOWER_IS_BETTER" | "TARGET_RANGE";
      defaultKpiTargetRangeOutsidePolicy?: KpiTargetRangeOutsidePolicy;
    }) => {
      const result = await createMutation({
        variables: { createSystemConfigurationInput: input },
      });
      return result.data?.createSystemConfiguration;
    },

    updateConfiguration: async (input: {
      systemConfigurationId: string;
      timezone?: string;
      fiscalYearStartMonth?: number;
      defaultRatingScaleMin?: number;
      defaultRatingScaleMax?: number;
      checkinDayOfWeek?: number;
      checkoutDayOfWeek?: number;
      enableEmailNotifications?: boolean;
      enableSharedKpis?: boolean;
      enableLogbookAttachments?: boolean;
      enableFormulaKpis?: boolean;
      defaultKpiZeroDenominatorPolicy?: "NOT_CALCULABLE" | "ZERO" | "BLOCK";
      defaultKpiResultDirection?: "HIGHER_IS_BETTER" | "LOWER_IS_BETTER" | "TARGET_RANGE";
      defaultKpiTargetRangeOutsidePolicy?: KpiTargetRangeOutsidePolicy;
    }) => {
      const result = await updateMutation({
        variables: { updateSystemConfigurationInput: input },
      });
      return result.data?.updateSystemConfiguration;
    },

    removeConfiguration: async (systemConfigurationId: string) => {
      const result = await removeMutation({
        variables: { systemConfigurationId },
      });
      return result.data?.removeSystemConfiguration;
    },

    loading: {
      create: createLoading,
      update: updateLoading,
      remove: removeLoading,
    },
  };
};
