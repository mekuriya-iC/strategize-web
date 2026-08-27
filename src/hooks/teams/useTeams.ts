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
  members?: {
    teamMemberId: string;
    employee: {
      employeeId: string;
      fullName: string;
      email?: string;
      picture?: string;
      title?: string;
    };
  }[];
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
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
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
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
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
    update: (cache, { data }) => {
      if (data?.createTeam) {
        cache.modify({
          fields: {
            teams(existingTeams = null) {
              if (!existingTeams) return existingTeams;
              const items = existingTeams.items || [];
              return {
                ...existingTeams,
                items: [data.createTeam, ...items],
                meta: {
                  ...existingTeams.meta,
                  totalItems: (existingTeams.meta?.totalItems || 0) + 1,
                },
              };
            },
          },
        });
      }
    },
    onCompleted: (data) => {
      toast.success('Team created successfully!', {
        description: `"${data.createTeam.name}" has been created.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to create team', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  const [updateTeamMutation, { loading: updateLoading }] = useMutation(UPDATE_TEAM, {
    update: (cache, { data }) => {
      if (data?.updateTeam) {
        const updated = data.updateTeam;
        cache.modify({
          fields: {
            teams(existingTeams = null, { readField }) {
              if (!existingTeams) return existingTeams;
              const items = existingTeams.items || [];
              return {
                ...existingTeams,
                items: items.map((item: any) =>
                  readField('teamId', item) === updated.teamId ? updated : item
                ),
              };
            },
          },
        });
      }
    },
    onCompleted: (data) => {
      toast.success('Team updated successfully!', {
        description: `"${data.updateTeam.name}" has been updated.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to update team', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  const [removeTeamMutation, { loading: removeLoading }] = useMutation(REMOVE_TEAM, {
    update: (cache, { data }, { variables }) => {
      if (variables?.teamId) {
        const deletedId = variables.teamId;
        cache.modify({
          fields: {
            teams(existingTeams = null, { readField }) {
              if (!existingTeams) return existingTeams;
              const items = existingTeams.items || [];
              return {
                ...existingTeams,
                items: items.filter((item: any) => readField('teamId', item) !== deletedId),
                meta: {
                  ...existingTeams.meta,
                  totalItems: Math.max(0, (existingTeams.meta?.totalItems || 0) - 1),
                },
              };
            },
          },
        });
        
        // Also evict the specific team from cache
        cache.evict({ id: cache.identify({ __typename: 'Team', teamId: deletedId }) });
        cache.gc();
      }
    },
    onCompleted: (data) => {
      toast.success('Team deleted successfully!', {
        description: data?.removeTeam?.name ? `"${data.removeTeam.name}" has been removed.` : 'Team has been removed.',
      });
    },
    onError: (error) => {
      toast.error('Failed to delete team', { description: error.message });
    },
    refetchQueries: 'active',
    awaitRefetchQueries: true,
  });

  return {
    createTeam: async (input: {
      name: string;
      organizationId: string;
      description?: string;
      departmentId?: string;
      teamLeadUserId?: string;
      memberIds?: string[];
    }) => {
      const { memberIds, ...teamInput } = input;
      const result = await createTeamMutation({
        variables: { createTeamInput: teamInput, memberIds: memberIds?.length ? memberIds : undefined },
      });
      return result.data?.createTeam;
    },

    updateTeam: async (input: {
      teamId: string;
      name?: string;
      description?: string;
      departmentId?: string;
      teamLeadUserId?: string;
      memberIds?: string[];
      isActive?: boolean;
      organizationId?: string;
    }) => {
      const { memberIds, ...teamInput } = input;
      const result = await updateTeamMutation({
        variables: { updateTeamInput: teamInput, memberIds: memberIds?.length ? memberIds : undefined },
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
