import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_INITIATIVES,
  GET_INITIATIVE,
  GET_ACTIVITIES,
  GET_ACTIVITY,
} from '@/lib/graphql/queries/initiatives';
import {
  CREATE_INITIATIVE,
  UPDATE_INITIATIVE,
  REMOVE_INITIATIVE,
  CREATE_ACTIVITY,
  UPDATE_ACTIVITY,
  REMOVE_ACTIVITY,
} from '@/lib/graphql/mutations/initiatives';

// ===================== TYPES =====================

export interface InitiativeOwner {
  employeeId: string;
  fullName: string;
  email?: string;
  picture?: string;
  title?: string;
}

export interface Initiative {
  initiativeId: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  completionPercentage: number;
  startDate?: string;
  dueDate?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  /** ID of the linked strategic objective (if any) */
  strategicObjectiveId?: string;
  owner?: InitiativeOwner;
  createdBy: {
    employeeId: string;
    fullName: string;
    email?: string;
  };
}

export interface Activity {
  activityId: string;
  title: string;
  description?: string;
  status: 'NOT_DONE' | 'DONE' | 'CANCELLED' | 'POSTPONED';
  milestone: boolean;
  startDate?: string;
  dueDate?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  initiative: {
    initiativeId: string;
    title: string;
  };
  assignedTo?: InitiativeOwner;
  createdBy: {
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

export const useInitiatives = (variables: {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  strategicObjectiveId?: string;
  status?: string;
} = {}) => {
  const { page = 1, limit = 20, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_INITIATIVES, {
    variables: { page, limit, ...rest },
    fetchPolicy: 'cache-and-network',
  });

  return {
    initiatives: (data?.initiatives?.items || []) as Initiative[],
    meta: data?.initiatives?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useInitiative = (initiativeId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_INITIATIVE, {
    variables: { initiativeId },
    skip: !initiativeId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    initiative: data?.initiative as Initiative | undefined,
    loading,
    error,
    refetch,
  };
};

export const useActivities = (variables: {
  page?: number;
  limit?: number;
  initiativeId?: string;
  organizationId?: string;
  search?: string;
} = {}) => {
  const { page = 1, limit = 50, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_ACTIVITIES, {
    variables: { page, limit, ...rest },
    skip: !rest.initiativeId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    activities: (data?.activities?.items || []) as Activity[],
    meta: data?.activities?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useActivity = (activityId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_ACTIVITY, {
    variables: { activityId },
    skip: !activityId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    activity: data?.activity as Activity | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const useInitiativeMutations = () => {
  const [createInitiativeMutation, { loading: createLoading }] = useMutation(CREATE_INITIATIVE, {
    onCompleted: (data) => {
      toast.success('Initiative created successfully!', {
        description: `"${data.createInitiative.title}" has been created.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to create initiative', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  const [updateInitiativeMutation, { loading: updateLoading }] = useMutation(UPDATE_INITIATIVE, {
    onCompleted: (data) => {
      toast.success('Initiative updated successfully!', {
        description: `"${data.updateInitiative.title}" has been updated.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to update initiative', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  const [removeInitiativeMutation, { loading: removeLoading }] = useMutation(REMOVE_INITIATIVE, {
    onCompleted: (data) => {
      toast.success('Initiative deleted successfully!', {
        description: `"${data.removeInitiative.title}" has been removed.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to delete initiative', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  // Activity mutations
  const [createActivityMutation, { loading: createActivityLoading }] = useMutation(CREATE_ACTIVITY, {
    onCompleted: (data) => {
      toast.success('Activity created successfully!', {
        description: `"${data.createActivity.title}" has been added.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to create activity', { description: error.message });
    },
  });

  const [updateActivityMutation, { loading: updateActivityLoading }] = useMutation(UPDATE_ACTIVITY, {
    onCompleted: () => {
      toast.success('Activity updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update activity', { description: error.message });
    },
  });

  const [removeActivityMutation, { loading: removeActivityLoading }] = useMutation(REMOVE_ACTIVITY, {
    onCompleted: () => {
      toast.success('Activity deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete activity', { description: error.message });
    },
  });

  return {
    // Initiative actions
    createInitiative: async (input: {
      title: string;
      description?: string;
      organizationId: string;
      strategicObjectiveId: string;
      ownerUserId?: string;
      startDate?: string;
      dueDate?: string;
      status?: string;
    }) => {
      const result = await createInitiativeMutation({
        variables: { createInitiativeInput: input },
      });
      return result.data?.createInitiative;
    },

    updateInitiative: async (input: {
      initiativeId: string;
      title?: string;
      description?: string;
      ownerUserId?: string;
      startDate?: string;
      dueDate?: string;
      status?: string;
      completionPercentage?: number;
      strategicObjectiveId?: string;
      organizationId?: string;
    }) => {
      const result = await updateInitiativeMutation({
        variables: { updateInitiativeInput: input },
      });
      return result.data?.updateInitiative;
    },

    removeInitiative: async (initiativeId: string) => {
      const result = await removeInitiativeMutation({
        variables: { initiativeId },
      });
      return result.data?.removeInitiative;
    },

    // Activity actions
    createActivity: async (input: {
      title: string;
      initiativeId: string;
      organizationId: string;
      description?: string;
      assignedToUserId?: string;
      startDate?: string;
      dueDate?: string;
      milestone?: boolean;
      notes?: string;
      status?: string;
    }) => {
      const result = await createActivityMutation({
        variables: { createActivityInput: input },
        refetchQueries: [
          { query: GET_ACTIVITIES, variables: { page: 1, limit: 50, initiativeId: input.initiativeId } },
        ],
      });
      return result.data?.createActivity;
    },

    updateActivity: async (input: {
      activityId: string;
      title?: string;
      description?: string;
      assignedToUserId?: string;
      startDate?: string;
      dueDate?: string;
      milestone?: boolean;
      notes?: string;
      status?: string;
      initiativeId?: string;
      organizationId?: string;
    }) => {
      const result = await updateActivityMutation({
        variables: { updateActivityInput: input },
        refetchQueries: input.initiativeId
          ? [{ query: GET_ACTIVITIES, variables: { page: 1, limit: 50, initiativeId: input.initiativeId } }]
          : [],
      });
      return result.data?.updateActivity;
    },

    removeActivity: async (activityId: string, initiativeId?: string) => {
      const result = await removeActivityMutation({
        variables: { activityId },
        refetchQueries: initiativeId
          ? [{ query: GET_ACTIVITIES, variables: { page: 1, limit: 50, initiativeId } }]
          : [],
      });
      return result.data?.removeActivity;
    },

    loading: {
      create: createLoading,
      update: updateLoading,
      remove: removeLoading,
      createActivity: createActivityLoading,
      updateActivity: updateActivityLoading,
      removeActivity: removeActivityLoading,
    },
  };
};
