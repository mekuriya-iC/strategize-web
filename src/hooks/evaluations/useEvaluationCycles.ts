import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_EVALUATION_CYCLES,
  GET_EVALUATION_CYCLE,
} from '@/lib/graphql/queries/evaluations';
import {
  CREATE_EVALUATION_CYCLE,
  UPDATE_EVALUATION_CYCLE,
  REMOVE_EVALUATION_CYCLE,
} from '@/lib/graphql/mutations/evaluations';
import type {
  EvaluationCycleStatus,
  CreateEvaluationCycleInput,
  UpdateEvaluationCycleInput,
} from '@/types/evaluation';

export const useEvaluationCycles = (
  page = 1,
  limit = 20,
  search = '',
  status?: EvaluationCycleStatus
) => {
  const { data, loading, error, refetch } = useQuery(GET_EVALUATION_CYCLES, {
    variables: { page, limit, search, status },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    cycles: data?.evaluationCycles?.items || [],
    meta: data?.evaluationCycles?.meta,
    loading,
    error,
    refetch,
  };
};

export const useEvaluationCycle = (evaluationCycleId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_EVALUATION_CYCLE, {
    variables: { evaluationCycleId },
    skip: !evaluationCycleId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    cycle: data?.evaluationCycle,
    loading,
    error,
    refetch,
  };
};

export const useEvaluationCycleMutations = () => {
  const [createCycle] = useMutation(CREATE_EVALUATION_CYCLE, {
    onError: (error) => {
      toast.error(`Failed to create cycle: ${error.message}`);
    },
    refetchQueries: ['GetEvaluationCycles'],
    awaitRefetchQueries: true,
  });

  const [updateCycle] = useMutation(UPDATE_EVALUATION_CYCLE, {
    onError: (error) => {
      toast.error(`Failed to update cycle: ${error.message}`);
    },
    refetchQueries: ['GetEvaluationCycles'],
    awaitRefetchQueries: true,
  });

  const [removeCycle] = useMutation(REMOVE_EVALUATION_CYCLE, {
    onError: (error) => {
      toast.error(`Failed to remove cycle: ${error.message}`);
    },
    refetchQueries: ['GetEvaluationCycles'],
    awaitRefetchQueries: true,
  });

  return {
    createCycle: async (input: CreateEvaluationCycleInput) => {
      const result = await createCycle({
        variables: { createEvaluationCycleInput: input },
      });
      return result.data?.createEvaluationCycle;
    },
    updateCycle: async (input: UpdateEvaluationCycleInput) => {
      const result = await updateCycle({
        variables: { updateEvaluationCycleInput: input },
      });
      return result.data?.updateEvaluationCycle;
    },
    removeCycle: async (evaluationCycleId: string) => {
      const result = await removeCycle({
        variables: { evaluationCycleId },
      });
      return result.data?.removeEvaluationCycle;
    },
  };
};
