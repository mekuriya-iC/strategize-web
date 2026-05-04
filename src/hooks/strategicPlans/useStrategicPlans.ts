import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { GET_STRATEGIC_PLANS, GET_STRATEGIC_PLAN, GET_STRATEGIC_PILLARS } from '@/lib/graphql/queries/strategicPlans';
import {
  CREATE_STRATEGIC_PLAN,
  UPDATE_STRATEGIC_PLAN,
  REMOVE_STRATEGIC_PLAN,
  CREATE_STRATEGIC_PILLAR,
  UPDATE_STRATEGIC_PILLAR,
  REMOVE_STRATEGIC_PILLAR,
  ACTIVATE_STRATEGIC_PLAN,
  DEACTIVATE_STRATEGIC_PLAN,
} from '@/lib/graphql/mutations/strategicPlans';

export interface StrategicPlan {
  strategicPlanId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  version?: string;
  createdAt: string;
  organization: {
    organizationId: string;
    name: string;
  };
  pillars?: StrategicPillar[];
}

export interface StrategicPillar {
  strategicPillarId: string;
  name: string;
  description?: string;
  createdAt: string;
  strategicPlan?: {
    strategicPlanId: string;
    title: string;
  };
}

export const useStrategicPlans = (page = 1, limit = 20, search?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_STRATEGIC_PLANS, {
    variables: { page, limit, search },
    fetchPolicy: 'cache-and-network',
  });

  return {
    strategicPlans: (data?.strategicPlans?.items || []) as StrategicPlan[],
    meta: data?.strategicPlans?.meta,
    loading,
    error,
    refetch,
  };
};

export const useStrategicPlan = (strategicPlanId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_STRATEGIC_PLAN, {
    variables: { strategicPlanId },
    skip: !strategicPlanId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    strategicPlan: data?.strategicPlan as StrategicPlan | undefined,
    loading,
    error,
    refetch,
  };
};

export const useStrategicPillars = (strategicPlanId?: string, page = 1, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_STRATEGIC_PILLARS, {
    variables: { page, limit, strategicPlanId },
    fetchPolicy: 'cache-and-network',
  });

  return {
    strategicPillars: (data?.strategicPillars?.items || []) as StrategicPillar[],
    meta: data?.strategicPillars?.meta,
    loading,
    error,
    refetch,
  };
};

export const useStrategicPlanMutations = () => {
  const [createStrategicPlan] = useMutation(CREATE_STRATEGIC_PLAN, {
    onCompleted: () => toast.success('Strategic Plan created successfully'),
    onError: (error) => toast.error(`Failed to create plan: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PLANS],
  });

  const [updateStrategicPlan] = useMutation(UPDATE_STRATEGIC_PLAN, {
    onCompleted: () => toast.success('Strategic Plan updated successfully'),
    onError: (error) => toast.error(`Failed to update plan: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PLANS, GET_STRATEGIC_PLAN],
  });

  const [removeStrategicPlan] = useMutation(REMOVE_STRATEGIC_PLAN, {
    onCompleted: () => toast.success('Strategic Plan removed successfully'),
    onError: (error) => toast.error(`Failed to remove plan: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PLANS],
  });

  const [createStrategicPillar] = useMutation(CREATE_STRATEGIC_PILLAR, {
    onCompleted: () => toast.success('Strategic Pillar created successfully'),
    onError: (error) => toast.error(`Failed to create pillar: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PILLARS, GET_STRATEGIC_PLAN],
  });

  const [updateStrategicPillar] = useMutation(UPDATE_STRATEGIC_PILLAR, {
    onCompleted: () => toast.success('Strategic Pillar updated successfully'),
    onError: (error) => toast.error(`Failed to update pillar: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PILLARS, GET_STRATEGIC_PLAN],
  });

  const [removeStrategicPillar] = useMutation(REMOVE_STRATEGIC_PILLAR, {
    onCompleted: () => toast.success('Strategic Pillar removed successfully'),
    onError: (error) => toast.error(`Failed to remove pillar: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PILLARS, GET_STRATEGIC_PLAN],
  });

  const [activateStrategicPlan] = useMutation(ACTIVATE_STRATEGIC_PLAN, {
    onCompleted: () => toast.success('Strategic Plan activated successfully'),
    onError: (error) => toast.error(`Failed to activate plan: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PLANS, GET_STRATEGIC_PLAN],
  });

  const [deactivateStrategicPlan] = useMutation(DEACTIVATE_STRATEGIC_PLAN, {
    onCompleted: () => toast.success('Strategic Plan deactivated successfully'),
    onError: (error) => toast.error(`Failed to deactivate plan: ${error.message}`),
    refetchQueries: [GET_STRATEGIC_PLANS, GET_STRATEGIC_PLAN],
  });

  return {
    createStrategicPlan: async (input: any) => {
      const { data } = await createStrategicPlan({ variables: { input } });
      return data?.createStrategicPlan;
    },
    updateStrategicPlan: async (input: any) => {
      const { data } = await updateStrategicPlan({ variables: { input } });
      return data?.updateStrategicPlan;
    },
    removeStrategicPlan: async (strategicPlanId: string) => {
      const { data } = await removeStrategicPlan({ variables: { strategicPlanId } });
      return data?.removeStrategicPlan;
    },
    createStrategicPillar: async (input: any) => {
      const { data } = await createStrategicPillar({ variables: { input } });
      return data?.createStrategicPillar;
    },
    updateStrategicPillar: async (input: any) => {
      const { data } = await updateStrategicPillar({ variables: { input } });
      return data?.updateStrategicPillar;
    },
    removeStrategicPillar: async (strategicPillarId: string) => {
      const { data } = await removeStrategicPillar({ variables: { strategicPillarId } });
      return data?.removeStrategicPillar;
    },
    activateStrategicPlan: async (strategicPlanId: string) => {
      const { data } = await activateStrategicPlan({ variables: { strategicPlanId } });
      return data?.updateStrategicPlan;
    },
    deactivateStrategicPlan: async (strategicPlanId: string) => {
      const { data } = await deactivateStrategicPlan({ variables: { strategicPlanId } });
      return data?.updateStrategicPlan;
    },
  };
};
