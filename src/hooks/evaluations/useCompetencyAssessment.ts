import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_COMPETENCY_ASSESSMENTS,
  GET_COMPETENCY_ASSESSMENT,
  GET_ASSESSMENT_RESPONSES,
} from '@/lib/graphql/queries/evaluations';
import {
  CREATE_COMPETENCY_ASSESSMENT,
  UPDATE_COMPETENCY_ASSESSMENT,
  REMOVE_COMPETENCY_ASSESSMENT,
  CREATE_ASSESSMENT_RESPONSE,
  UPDATE_ASSESSMENT_RESPONSE,
} from '@/lib/graphql/mutations/evaluations';
import type {
  CreateCompetencyAssessmentInput,
  UpdateCompetencyAssessmentInput,
  CreateAssessmentResponseInput,
  UpdateAssessmentResponseInput,
} from '@/types/evaluation';

export const useCompetencyAssessments = (
  page = 1,
  limit = 20,
  evaluationCycleId?: string,
  evaluateeUserId?: string,
  evaluatorUserId?: string
) => {
  const { data, loading, error, refetch } = useQuery(GET_COMPETENCY_ASSESSMENTS, {
    variables: { page, limit, evaluationCycleId, evaluateeUserId, evaluatorUserId },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    assessments: data?.competencyAssessments?.items || [],
    meta: data?.competencyAssessments?.meta,
    loading,
    error,
    refetch,
  };
};

export const useCompetencyAssessment = (competencyAssessmentId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_COMPETENCY_ASSESSMENT, {
    variables: { competencyAssessmentId },
    skip: !competencyAssessmentId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    assessment: data?.competencyAssessment,
    loading,
    error,
    refetch,
  };
};

export const useAssessmentResponses = (assessmentId: string, page = 1, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_ASSESSMENT_RESPONSES, {
    variables: { assessmentId, page, limit },
    skip: !assessmentId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    responses: data?.assessmentResponses?.items || [],
    meta: data?.assessmentResponses?.meta,
    loading,
    error,
    refetch,
  };
};

export const useCompetencyAssessmentMutations = () => {
  const [createAssessment] = useMutation(CREATE_COMPETENCY_ASSESSMENT, {
    onCompleted: () => {
      toast.success('Assessment created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create assessment: ${error.message}`);
    },
    refetchQueries: [GET_COMPETENCY_ASSESSMENTS],
  });

  const [updateAssessment] = useMutation(UPDATE_COMPETENCY_ASSESSMENT, {
    onCompleted: () => {
      toast.success('Assessment updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update assessment: ${error.message}`);
    },
  });

  const [removeAssessment] = useMutation(REMOVE_COMPETENCY_ASSESSMENT, {
    onCompleted: () => {
      toast.success('Assessment removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove assessment: ${error.message}`);
    },
    refetchQueries: [GET_COMPETENCY_ASSESSMENTS],
  });

  const [createResponse] = useMutation(CREATE_ASSESSMENT_RESPONSE, {
    onCompleted: () => {
      toast.success('Response saved');
    },
    onError: (error) => {
      toast.error(`Failed to save response: ${error.message}`);
    },
    refetchQueries: [GET_ASSESSMENT_RESPONSES],
  });

  const [updateResponse] = useMutation(UPDATE_ASSESSMENT_RESPONSE, {
    onCompleted: () => {
      toast.success('Response updated');
    },
    onError: (error) => {
      toast.error(`Failed to update response: ${error.message}`);
    },
  });

  return {
    createAssessment: async (input: CreateCompetencyAssessmentInput) => {
      const result = await createAssessment({
        variables: { createCompetencyAssessmentInput: input },
      });
      return result.data?.createCompetencyAssessment;
    },
    updateAssessment: async (input: UpdateCompetencyAssessmentInput) => {
      const result = await updateAssessment({
        variables: { updateCompetencyAssessmentInput: input },
      });
      return result.data?.updateCompetencyAssessment;
    },
    removeAssessment: async (competencyAssessmentId: string) => {
      const result = await removeAssessment({
        variables: { competencyAssessmentId },
      });
      return result.data?.removeCompetencyAssessment;
    },
    createResponse: async (input: CreateAssessmentResponseInput) => {
      const result = await createResponse({
        variables: { createAssessmentResponseInput: input },
      });
      return result.data?.createAssessmentResponse;
    },
    updateResponse: async (input: UpdateAssessmentResponseInput) => {
      const result = await updateResponse({
        variables: { updateAssessmentResponseInput: input },
      });
      return result.data?.updateAssessmentResponse;
    },
  };
};
