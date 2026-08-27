import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_POSITIONS,
  GET_POSITION,
  GET_COMPETENCY_POSITION_ASSIGNMENTS,
} from '@/lib/graphql/queries/positions';
import {
  CREATE_POSITION,
  UPDATE_POSITION,
  REMOVE_POSITION,
  CREATE_COMPETENCY_POSITION_ASSIGNMENT,
  UPDATE_COMPETENCY_POSITION_ASSIGNMENT,
  REMOVE_COMPETENCY_POSITION_ASSIGNMENT,
} from '@/lib/graphql/mutations/positions';

// ===================== TYPES =====================

export interface Position {
  positionId: string;
  title: string;
  description?: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyPositionAssignment {
  competencyPositionAssignmentId: string;
  isMandatory: boolean;
  createdAt: string;
  competency: {
    competencyId: string;
    name: string;
    description?: string;
    coreCompetency?: {
      coreCompetencyId: string;
      name: string;
    };
  };
  position: {
    positionId: string;
    title: string;
  };
  createdBy: {
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

export const usePositions = (variables: {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
} = {}) => {
  const { page = 1, limit = 20, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_POSITIONS, {
    variables: { page, limit, ...rest },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    positions: (data?.positions?.items || []) as Position[],
    meta: data?.positions?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const usePosition = (positionId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_POSITION, {
    variables: { positionId },
    skip: !positionId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    position: data?.position as Position | undefined,
    loading,
    error,
    refetch,
  };
};

export const useCompetencyPositionAssignments = (variables: {
  page?: number;
  limit?: number;
  positionId?: string;
  competencyId?: string;
} = {}) => {
  const { page = 1, limit = 100, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_COMPETENCY_POSITION_ASSIGNMENTS, {
    variables: { page, limit, ...rest },
    skip: !rest.positionId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    assignments: (data?.competencyPositionAssignments?.items || []) as CompetencyPositionAssignment[],
    meta: data?.competencyPositionAssignments?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const usePositionMutations = () => {
  const [createPositionMutation, { loading: createLoading }] = useMutation(CREATE_POSITION, {
    update: (cache, { data }) => {
      if (data?.createPosition) {
        cache.modify({
          fields: {
            positions(existingPositions = null) {
              if (!existingPositions) return existingPositions;
              const items = existingPositions.items || [];
              return {
                ...existingPositions,
                items: [data.createPosition, ...items],
                meta: {
                  ...existingPositions.meta,
                  totalItems: (existingPositions.meta?.totalItems || 0) + 1,
                },
              };
            },
          },
        });
      }
    },
    onCompleted: (data) => {
      toast.success('Position created successfully!', {
        description: `"${data.createPosition.title}" has been created.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to create position', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  const [updatePositionMutation, { loading: updateLoading }] = useMutation(UPDATE_POSITION, {
    update: (cache, { data }) => {
      if (data?.updatePosition) {
        const updated = data.updatePosition;
        cache.modify({
          fields: {
            positions(existingPositions = null, { readField }) {
              if (!existingPositions) return existingPositions;
              const items = existingPositions.items || [];
              return {
                ...existingPositions,
                items: items.map((item: any) =>
                  readField('positionId', item) === updated.positionId ? updated : item
                ),
              };
            },
          },
        });
      }
    },
    onCompleted: (data) => {
      toast.success('Position updated successfully!', {
        description: `"${data.updatePosition.title}" has been updated.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to update position', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  const [removePositionMutation, { loading: removeLoading }] = useMutation(REMOVE_POSITION, {
    update: (cache, { data }, { variables }) => {
      if (variables?.positionId) {
        const deletedId = variables.positionId;
        cache.modify({
          fields: {
            positions(existingPositions = null, { readField }) {
              if (!existingPositions) return existingPositions;
              const items = existingPositions.items || [];
              return {
                ...existingPositions,
                items: items.filter(
                  (item: any) => readField('positionId', item) !== deletedId
                ),
                meta: {
                  ...existingPositions.meta,
                  totalItems: Math.max(0, (existingPositions.meta?.totalItems || 0) - 1),
                },
              };
            },
          },
        });
        
        // Also evict the specific position from cache
        cache.evict({ id: cache.identify({ __typename: 'Position', positionId: deletedId }) });
        cache.gc();
      }
    },
    onCompleted: (data) => {
      toast.success('Position deleted successfully!', {
        description: data?.removePosition?.title ? `"${data.removePosition.title}" has been removed.` : 'Position has been removed.',
      });
    },
    onError: (error) => {
      toast.error('Failed to delete position', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  const [assignCompetencyMutation, { loading: assignLoading }] = useMutation(
    CREATE_COMPETENCY_POSITION_ASSIGNMENT,
    {
      onCompleted: () => {
        toast.success('Competency assigned to position!');
      },
      onError: (error) => {
        toast.error('Failed to assign competency', { description: error.message });
      },
    }
  );

  const [updateAssignmentMutation, { loading: updateAssignmentLoading }] = useMutation(
    UPDATE_COMPETENCY_POSITION_ASSIGNMENT,
    {
      onCompleted: () => {
        toast.success('Assignment updated!');
      },
      onError: (error) => {
        toast.error('Failed to update assignment', { description: error.message });
      },
    }
  );

  const [removeAssignmentMutation, { loading: removeAssignmentLoading }] = useMutation(
    REMOVE_COMPETENCY_POSITION_ASSIGNMENT,
    {
      onCompleted: () => {
        toast.success('Competency removed from position!');
      },
      onError: (error) => {
        toast.error('Failed to remove competency assignment', { description: error.message });
      },
    }
  );

  return {
    createPosition: async (input: {
      title: string;
      organizationId: string;
      description?: string;
      grade?: string;
    }) => {
      const result = await createPositionMutation({
        variables: { createPositionInput: input },
      });
      return result.data?.createPosition;
    },

    updatePosition: async (input: {
      positionId: string;
      title?: string;
      description?: string;
      grade?: string;
      organizationId?: string;
    }) => {
      const result = await updatePositionMutation({
        variables: { updatePositionInput: input },
      });
      return result.data?.updatePosition;
    },

    removePosition: async (positionId: string) => {
      const result = await removePositionMutation({
        variables: { positionId },
      });
      return result.data?.removePosition;
    },

    assignCompetency: async (input: {
      positionId: string;
      competencyId: string;
      isMandatory?: boolean;
    }) => {
      const result = await assignCompetencyMutation({
        variables: { createCompetencyPositionAssignmentInput: input },
        refetchQueries: [
          {
            query: GET_COMPETENCY_POSITION_ASSIGNMENTS,
            variables: { page: 1, limit: 100, positionId: input.positionId },
          },
        ],
      });
      return result.data?.createCompetencyPositionAssignment;
    },

    updateAssignment: async (input: {
      competencyPositionAssignmentId: string;
      isMandatory?: boolean;
    }) => {
      const result = await updateAssignmentMutation({
        variables: { updateCompetencyPositionAssignmentInput: input },
      });
      return result.data?.updateCompetencyPositionAssignment;
    },

    removeAssignment: async (competencyPositionAssignmentId: string, positionId?: string) => {
      const result = await removeAssignmentMutation({
        variables: { competencyPositionAssignmentId },
        refetchQueries: positionId
          ? [
              {
                query: GET_COMPETENCY_POSITION_ASSIGNMENTS,
                variables: { page: 1, limit: 100, positionId },
              },
            ]
          : [],
      });
      return result.data?.removeCompetencyPositionAssignment;
    },

    loading: {
      create: createLoading,
      update: updateLoading,
      remove: removeLoading,
      assign: assignLoading,
      updateAssignment: updateAssignmentLoading,
      removeAssignment: removeAssignmentLoading,
    },
  };
};
