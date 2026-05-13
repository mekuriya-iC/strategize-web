import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { GET_EVALUATION_WEIGHT_CONFIGS } from '@/lib/graphql/queries/evaluations';
import {
  CREATE_EVALUATION_WEIGHT_CONFIG,
  UPDATE_EVALUATION_WEIGHT_CONFIG,
} from '@/lib/graphql/mutations/evaluations';

export const useEvaluationWeightConfigs = (evaluationCycleId?: string, page = 1, limit = 10) => {
  const { data, loading, error, refetch } = useQuery(GET_EVALUATION_WEIGHT_CONFIGS, {
    variables: { evaluationCycleId, page, limit },
    skip: !evaluationCycleId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    weightConfigs: data?.evaluationWeightConfigs?.items || [],
    meta: data?.evaluationWeightConfigs?.meta,
    loading,
    error,
    refetch,
  };
};

export const useEvaluationWeightMutations = () => {
  const [createWeightConfig] = useMutation(CREATE_EVALUATION_WEIGHT_CONFIG, {
    onError: (error) => {
      toast.error(`Failed to save weight: ${error.message}`);
    },
    refetchQueries: [{ 
      query: GET_EVALUATION_WEIGHT_CONFIGS,
      variables: { page: 1, limit: 10 }
    }],
    awaitRefetchQueries: true,
  });

  const [updateWeightConfig] = useMutation(UPDATE_EVALUATION_WEIGHT_CONFIG, {
    onError: (error) => {
      toast.error(`Failed to update weight: ${error.message}`);
    },
    refetchQueries: [{ 
      query: GET_EVALUATION_WEIGHT_CONFIGS,
      variables: { page: 1, limit: 10 }
    }],
    awaitRefetchQueries: true,
  });

  return {
    createWeightConfig: async (input: any) => {
      const result = await createWeightConfig({
        variables: { createEvaluationWeightConfigInput: input },
      });
      return result.data?.createEvaluationWeightConfig;
    },
    updateWeightConfig: async (input: any) => {
      const result = await updateWeightConfig({
        variables: { updateEvaluationWeightConfigInput: input },
      });
      return result.data?.updateEvaluationWeightConfig;
    },
  };
};
