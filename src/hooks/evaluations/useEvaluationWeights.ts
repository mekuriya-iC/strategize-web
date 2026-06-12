import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { EvaluationRelationType } from "@/types/evaluation";
import { 
  GET_EVALUATION_WEIGHT_CONFIGS,
  GET_EVALUATION_WEIGHTS_FOR_CYCLE 
} from "@/lib/graphql/queries/evaluations";
import {
  CREATE_EVALUATION_WEIGHT_CONFIG,
  UPDATE_EVALUATION_WEIGHT_CONFIG,
  BULK_UPDATE_EVALUATION_WEIGHTS,
} from "@/lib/graphql/mutations/evaluations";

export const useEvaluationWeightConfigs = (
  evaluationCycleId?: string,
  page = 1,
  limit = 10,
) => {
  const { data, loading, error, refetch } = useQuery(
    GET_EVALUATION_WEIGHT_CONFIGS,
    {
      variables: { evaluationCycleId, page, limit },
      skip: !evaluationCycleId,
      fetchPolicy: "cache-and-network",
    },
  );

  return {
    weightConfigs: data?.evaluationWeightConfigs?.items || [],
    meta: data?.evaluationWeightConfigs?.meta,
    loading,
    error,
    refetch,
  };
};

export const useEvaluationWeightsForCycle = (evaluationCycleId?: string) => {
  const { data, loading, error, refetch } = useQuery(
    GET_EVALUATION_WEIGHTS_FOR_CYCLE,
    {
      variables: { evaluationCycleId },
      skip: !evaluationCycleId,
      fetchPolicy: "cache-and-network",
    },
  );

  return {
    configs: data?.getEvaluationWeightsForCycle?.configs || [],
    totalWeight: data?.getEvaluationWeightsForCycle?.totalWeight || 0,
    isValid: data?.getEvaluationWeightsForCycle?.isValid || false,
    message: data?.getEvaluationWeightsForCycle?.message || "",
    loading,
    error,
    refetch,
  };
};

type CreateEvaluationWeightConfigInput = {
  evaluationCycleId: string;
  relationType: EvaluationRelationType;
  weightPercent: number;
  isEnabled?: boolean;
};

type UpdateEvaluationWeightConfigInput =
  Partial<CreateEvaluationWeightConfigInput> & {
    evaluationWeightConfigId: string;
  };

type EvaluatorWeightInput = {
  relationType: EvaluationRelationType;
  weightPercent: number;
  isEnabled: boolean;
};

type BulkUpdateWeightsInput = {
  evaluationCycleId: string;
  weights: EvaluatorWeightInput[];
};

export const useEvaluationWeightMutations = () => {
  const [createWeightConfig] = useMutation(CREATE_EVALUATION_WEIGHT_CONFIG, {
    onCompleted: () => {
      toast.success("Weight configuration saved");
    },
    onError: (error) => {
      toast.error(`Failed to save weight: ${error.message}`);
    },
    refetchQueries: [
      {
        query: GET_EVALUATION_WEIGHT_CONFIGS,
        variables: { page: 1, limit: 10 },
      },
    ],
    awaitRefetchQueries: true,
  });

  const [updateWeightConfig] = useMutation(UPDATE_EVALUATION_WEIGHT_CONFIG, {
    onCompleted: () => {
      toast.success("Weight configuration updated");
    },
    onError: (error) => {
      toast.error(`Failed to update weight: ${error.message}`);
    },
    refetchQueries: [
      {
        query: GET_EVALUATION_WEIGHT_CONFIGS,
        variables: { page: 1, limit: 10 },
      },
    ],
    awaitRefetchQueries: true,
  });

  const [bulkUpdateWeights] = useMutation(BULK_UPDATE_EVALUATION_WEIGHTS, {
    onCompleted: (data) => {
      if (data?.bulkUpdateEvaluationWeights?.isValid) {
        toast.success("Weight configuration saved successfully");
      } else {
        toast.warning(data?.bulkUpdateEvaluationWeights?.message || "Weight configuration saved with warnings");
      }
    },
    onError: (error) => {
      toast.error(`Failed to save weights: ${error.message}`);
    },
    refetchQueries: [
      GET_EVALUATION_WEIGHT_CONFIGS,
      GET_EVALUATION_WEIGHTS_FOR_CYCLE,
    ],
    awaitRefetchQueries: true,
  });

  return {
    createWeightConfig: async (input: CreateEvaluationWeightConfigInput) => {
      const result = await createWeightConfig({
        variables: { createEvaluationWeightConfigInput: input },
      });
      return result.data?.createEvaluationWeightConfig;
    },
    updateWeightConfig: async (input: UpdateEvaluationWeightConfigInput) => {
      const result = await updateWeightConfig({
        variables: { updateEvaluationWeightConfigInput: input },
      });
      return result.data?.updateEvaluationWeightConfig;
    },
    bulkUpdateWeights: async (input: BulkUpdateWeightsInput) => {
      const result = await bulkUpdateWeights({
        variables: { bulkUpdateWeightsInput: input },
      });
      return result.data?.bulkUpdateEvaluationWeights;
    },
  };
};
