import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { GET_TEAMS, GET_TEAM } from '@/lib/graphql/queries/teams';
import { CREATE_TEAM, UPDATE_TEAM, REMOVE_TEAM } from '@/lib/graphql/mutations/teams';

// ===================== TYPES =====================

export interface Team {
  teamId: string;
  name: string;
  description?: string;
  isActive: boolean;
  department?: {
    departmentId: string;
    name: string;
    division?: {
      divisionId: string;
      name: string;
    };
  };
  teamLead?: {
    employeeId: string;
    fullName: string;
    email?: string;
    picture?: string;
    title?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemCount: number;
}

// ===================== QUERY HOOKS =====================

export const useTeams = (variables: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
} = {}) => {
  const { page = 1, limit = 20, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_TEAMS, {
    variables: { page, limit, ...rest },
    fetchPolicy: 'cache-and-network',
  });

  return {
    teams: (data?.teams?.items || []) as Team[],
    meta: data?.teams?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useTeam = (teamId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_TEAM, {
    variables: { teamId },
    skip: !teamId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    team: data?.team as Team | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const useTeamMutations = () => {
  const [createTeamMutation, { loading: createLoading }] = useMutation(CREATE_TEAM, {
    onCompleted: (data) => {
      toast.success('Team created successfully!', {
        description: `"${data.createTeam.name}" has been created.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to create team', { description: error.message });
    },
    refetchQueries: [{ query: GET_TEAMS, variables: { page: 1, limit: 20 } }],
    awaitRefetchQueries: true,
  });

  const [updateTeamMutation, { loading: updateLoading }] = useMutation(UPDATE_TEAM, {
    onCompleted: (data) => {
      toast.success('Team updated successfully!', {
        description: `"${data.updateTeam.name}" has been updated.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to update team', { description: error.message });
    },
    refetchQueries: [{ query: GET_TEAMS, variables: { page: 1, limit: 20 } }],
    awaitRefetchQueries: true,
  });

  const [removeTeamMutation, { loading: removeLoading }] = useMutation(REMOVE_TEAM, {
    onCompleted: (data) => {
      toast.success('Team deleted successfully!', {
        description: `"${data.removeTeam.name}" has been removed.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to delete team', { description: error.message });
    },
    refetchQueries: [{ query: GET_TEAMS, variables: { page: 1, limit: 20 } }],
    awaitRefetchQueries: true,
  });

  return {
    createTeam: async (input: {
      name: string;
      organizationId: string;
      description?: string;
      departmentId?: string;
      teamLeadUserId?: string;
    }) => {
      const result = await createTeamMutation({
        variables: { createTeamInput: input },
      });
      return result.data?.createTeam;
    },

    updateTeam: async (input: {
      teamId: string;
      name?: string;
      description?: string;
      departmentId?: string;
      teamLeadUserId?: string;
      isActive?: boolean;
      organizationId?: string;
    }) => {
      const result = await updateTeamMutation({
        variables: { updateTeamInput: input },
      });
      return result.data?.updateTeam;
    },

    removeTeam: async (teamId: string) => {
      const result = await removeTeamMutation({
        variables: { teamId },
      });
      return result.data?.removeTeam;
    },

    loading: {
      create: createLoading,
      update: updateLoading,
      remove: removeLoading,
    },
  };
};
