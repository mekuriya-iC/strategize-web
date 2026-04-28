import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_COMPETENCIES,
  GET_COMPETENCY,
  GET_CORE_COMPETENCIES,
  GET_COMPETENCY_INDICATORS,
  GET_POSITION_COMPETENCIES,
} from '@/lib/graphql/queries/competencies';
import {
  CREATE_CORE_COMPETENCY,
  UPDATE_CORE_COMPETENCY,
  REMOVE_CORE_COMPETENCY,
  CREATE_COMPETENCY,
  UPDATE_COMPETENCY,
  REMOVE_COMPETENCY,
  CREATE_COMPETENCY_INDICATOR,
  UPDATE_COMPETENCY_INDICATOR,
  REMOVE_COMPETENCY_INDICATOR,
  CREATE_COMPETENCY_POSITION_ASSIGNMENT,
  REMOVE_COMPETENCY_POSITION_ASSIGNMENT,
} from '@/lib/graphql/mutations/competencies';
import type {
  CreateCoreCompetencyInput,
  UpdateCoreCompetencyInput,
  CreateCompetencyInput,
  UpdateCompetencyInput,
  CreateCompetencyIndicatorInput,
  UpdateCompetencyIndicatorInput,
  CreateCompetencyPositionAssignmentInput,
} from '@/types/evaluation';

export const useCompetencies = (page = 1, limit = 50, search = '') => {
  const { data, loading, error, refetch } = useQuery(GET_COMPETENCIES, {
    variables: { page, limit, search },
    fetchPolicy: 'cache-and-network',
  });

  return {
    competencies: data?.competencies?.items || [],
    meta: data?.competencies?.meta,
    loading,
    error,
    refetch,
  };
};

export const useCompetency = (competencyId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_COMPETENCY, {
    variables: { competencyId },
    skip: !competencyId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    competency: data?.competency,
    loading,
    error,
    refetch,
  };
};

export const useCoreCompetencies = (page = 1, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_CORE_COMPETENCIES, {
    variables: { page, limit },
    fetchPolicy: 'cache-and-network',
  });

  return {
    coreCompetencies: data?.coreCompetencies?.items || [],
    meta: data?.coreCompetencies?.meta,
    loading,
    error,
    refetch,
  };
};

export const useCompetencyIndicators = (competencyId: string, page = 1, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_COMPETENCY_INDICATORS, {
    variables: { competencyId, page, limit },
    skip: !competencyId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    indicators: data?.competencyIndicators?.items || [],
    meta: data?.competencyIndicators?.meta,
    loading,
    error,
    refetch,
  };
};

export const usePositionCompetencies = (positionId: string, page = 1, limit = 50) => {
  const { data, loading, error, refetch } = useQuery(GET_POSITION_COMPETENCIES, {
    variables: { positionId, page, limit },
    skip: !positionId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    assignments: data?.competencyPositionAssignments?.items || [],
    meta: data?.competencyPositionAssignments?.meta,
    loading,
    error,
    refetch,
  };
};

export const useCompetencyMutations = () => {
  const [createCoreCompetency] = useMutation(CREATE_CORE_COMPETENCY, {
    onCompleted: () => toast.success('Core competency created'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_CORE_COMPETENCIES],
  });

  const [updateCoreCompetency] = useMutation(UPDATE_CORE_COMPETENCY, {
    onCompleted: () => toast.success('Core competency updated'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const [removeCoreCompetency] = useMutation(REMOVE_CORE_COMPETENCY, {
    onCompleted: () => toast.success('Core competency removed'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_CORE_COMPETENCIES],
  });

  const [createCompetency] = useMutation(CREATE_COMPETENCY, {
    onCompleted: () => toast.success('Competency created'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_COMPETENCIES],
  });

  const [updateCompetency] = useMutation(UPDATE_COMPETENCY, {
    onCompleted: () => toast.success('Competency updated'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const [removeCompetency] = useMutation(REMOVE_COMPETENCY, {
    onCompleted: () => toast.success('Competency removed'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_COMPETENCIES],
  });

  const [createIndicator] = useMutation(CREATE_COMPETENCY_INDICATOR, {
    onCompleted: () => toast.success('Indicator created'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_COMPETENCY_INDICATORS],
  });

  const [updateIndicator] = useMutation(UPDATE_COMPETENCY_INDICATOR, {
    onCompleted: () => toast.success('Indicator updated'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const [removeIndicator] = useMutation(REMOVE_COMPETENCY_INDICATOR, {
    onCompleted: () => toast.success('Indicator removed'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_COMPETENCY_INDICATORS],
  });

  const [createPositionAssignment] = useMutation(CREATE_COMPETENCY_POSITION_ASSIGNMENT, {
    onCompleted: () => toast.success('Competency assigned to position'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_POSITION_COMPETENCIES],
  });

  const [removePositionAssignment] = useMutation(REMOVE_COMPETENCY_POSITION_ASSIGNMENT, {
    onCompleted: () => toast.success('Assignment removed'),
    onError: (error) => toast.error(`Failed: ${error.message}`),
    refetchQueries: [GET_POSITION_COMPETENCIES],
  });

  return {
    createCoreCompetency: async (input: CreateCoreCompetencyInput) => {
      const result = await createCoreCompetency({
        variables: { createCoreCompetencyInput: input },
      });
      return result.data?.createCoreCompetency;
    },
    updateCoreCompetency: async (input: UpdateCoreCompetencyInput) => {
      const result = await updateCoreCompetency({
        variables: { updateCoreCompetencyInput: input },
      });
      return result.data?.updateCoreCompetency;
    },
    removeCoreCompetency: async (coreCompetencyId: string) => {
      const result = await removeCoreCompetency({ variables: { coreCompetencyId } });
      return result.data?.removeCoreCompetency;
    },
    createCompetency: async (input: CreateCompetencyInput) => {
      const result = await createCompetency({
        variables: { createCompetencyInput: input },
      });
      return result.data?.createCompetency;
    },
    updateCompetency: async (input: UpdateCompetencyInput) => {
      const result = await updateCompetency({
        variables: { updateCompetencyInput: input },
      });
      return result.data?.updateCompetency;
    },
    removeCompetency: async (competencyId: string) => {
      const result = await removeCompetency({ variables: { competencyId } });
      return result.data?.removeCompetency;
    },
    createIndicator: async (input: CreateCompetencyIndicatorInput) => {
      const result = await createIndicator({
        variables: { createCompetencyIndicatorInput: input },
      });
      return result.data?.createCompetencyIndicator;
    },
    updateIndicator: async (input: UpdateCompetencyIndicatorInput) => {
      const result = await updateIndicator({
        variables: { updateCompetencyIndicatorInput: input },
      });
      return result.data?.updateCompetencyIndicator;
    },
    removeIndicator: async (competencyIndicatorId: string) => {
      const result = await removeIndicator({ variables: { competencyIndicatorId } });
      return result.data?.removeCompetencyIndicator;
    },
    createPositionAssignment: async (input: CreateCompetencyPositionAssignmentInput) => {
      const result = await createPositionAssignment({
        variables: { createCompetencyPositionAssignmentInput: input },
      });
      return result.data?.createCompetencyPositionAssignment;
    },
    removePositionAssignment: async (competencyPositionAssignmentId: string) => {
      const result = await removePositionAssignment({
        variables: { competencyPositionAssignmentId },
      });
      return result.data?.removeCompetencyPositionAssignment;
    },
  };
};
