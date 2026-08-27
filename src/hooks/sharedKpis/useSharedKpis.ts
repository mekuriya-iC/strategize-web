import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_SHARED_KPI_PARTICIPANTS,
  GET_SHARED_KPI_PARTICIPANT,
} from '@/lib/graphql/queries/sharedKpis';
import {
  CREATE_SHARED_KPI_PARTICIPANT,
  REMOVE_SHARED_KPI_PARTICIPANT,
} from '@/lib/graphql/mutations/sharedKpis';

// ===================== TYPES =====================

export interface SharedKpiParticipant {
  sharedKpiParticipantId: string;
  contributionWeight?: number;
  createdAt: string;
  kpi: {
    kpiId: string;
    name: string;
    description?: string;
    targetValue?: number;
    currentValue?: number;
    progress?: number;
    unit?: string;
    status?: string;
  };
  participant: {
    employeeId: string;
    fullName: string;
    email?: string;
    picture?: string;
    title?: string;
    department?: {
      departmentId: string;
      name: string;
    };
  };
  assignedBy?: {
    employeeId: string;
    fullName: string;
    email?: string;
  };
  strategicPeriod: {
    strategicPeriodId: string;
    name: string;
    startDate: string;
    endDate: string;
    periodType?: string;
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

export const useSharedKpiParticipants = (variables: {
  page?: number;
  limit?: number;
  kpiId?: string;
  participantUserId?: string;
  strategicPeriodId?: string;
} = {}) => {
  const { page = 1, limit = 50, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_SHARED_KPI_PARTICIPANTS, {
    variables: { page, limit, ...rest },
    skip: !rest.kpiId && !rest.participantUserId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    participants: (data?.sharedKpiParticipants?.items || []) as SharedKpiParticipant[],
    meta: data?.sharedKpiParticipants?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useSharedKpiParticipant = (sharedKpiParticipantId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_SHARED_KPI_PARTICIPANT, {
    variables: { sharedKpiParticipantId },
    skip: !sharedKpiParticipantId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    participant: data?.sharedKpiParticipant as SharedKpiParticipant | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const useSharedKpiMutations = () => {
  const [createParticipantMutation, { loading: createLoading }] = useMutation(
    CREATE_SHARED_KPI_PARTICIPANT,
    {
      onCompleted: (data) => {
        toast.success('Participant added successfully!', {
          description: `${data.createSharedKpiParticipant.participant.fullName} has been added to the KPI.`,
        });
      },
      onError: (error) => {
        toast.error('Failed to add participant', { description: error.message });
      },
    }
  );

  const [removeParticipantMutation, { loading: removeLoading }] = useMutation(
    REMOVE_SHARED_KPI_PARTICIPANT,
    {
      onCompleted: (data) => {
        toast.success('Participant removed successfully!', {
          description: `${data.removeSharedKpiParticipant.participant.fullName} has been removed from the KPI.`,
        });
      },
      onError: (error) => {
        toast.error('Failed to remove participant', { description: error.message });
      },
    }
  );

  return {
    createParticipant: async (input: {
      kpiId: string;
      participantUserId: string;
      strategicPeriodId: string;
      contributionWeight?: number;
      assignedById?: string;
    }) => {
      const result = await createParticipantMutation({
        variables: { createSharedKpiParticipantInput: input },
      });
      return result.data?.createSharedKpiParticipant;
    },

    removeParticipant: async (sharedKpiParticipantId: string) => {
      const result = await removeParticipantMutation({
        variables: { sharedKpiParticipantId },
      });
      return result.data?.removeSharedKpiParticipant;
    },

    loading: {
      create: createLoading,
      remove: removeLoading,
    },
  };
};
