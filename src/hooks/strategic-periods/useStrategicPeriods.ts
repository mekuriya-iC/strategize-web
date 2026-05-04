import { useQuery, useMutation } from "@apollo/client";
import {
  GET_STRATEGIC_PERIODS,
  GET_STRATEGIC_PERIOD,
} from "@/lib/graphql/queries/strategicPeriods";
import {
  CREATE_STRATEGIC_PERIOD,
  UPDATE_STRATEGIC_PERIOD,
  REMOVE_STRATEGIC_PERIOD,
} from "@/lib/graphql/mutations/strategicPeriods";
import { toast } from "sonner";

export const useStrategicPeriods = (
  page: number = 1,
  limit: number = 20,
  strategicPlanId?: string,
  organizationId?: string
) => {
  const { data, loading, error, refetch } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page, limit, strategicPlanId, organizationId },
    fetchPolicy: "cache-and-network",
  });

  return {
    strategicPeriods: data?.strategicPeriods?.items || [],
    meta: data?.strategicPeriods?.meta || {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: limit,
    },
    loading,
    error,
    refetch,
  };
};

export const useStrategicPeriod = (strategicPeriodId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_STRATEGIC_PERIOD, {
    variables: { strategicPeriodId },
    skip: !strategicPeriodId,
    fetchPolicy: "cache-and-network",
  });

  return {
    strategicPeriod: data?.strategicPeriod,
    loading,
    error,
    refetch,
  };
};

export const useStrategicPeriodMutations = () => {
  const [createMutation, { loading: creating }] = useMutation(
    CREATE_STRATEGIC_PERIOD,
    {
      refetchQueries: [{ query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 100 } }],
      onCompleted: () => {
        toast.success("✅ Strategic period created successfully");
      },
      onError: (error) => {
        toast.error(`Failed to create strategic period: ${error.message}`);
      },
    }
  );

  const [updateMutation, { loading: updating }] = useMutation(
    UPDATE_STRATEGIC_PERIOD,
    {
      refetchQueries: [{ query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 100 } }],
      onCompleted: () => {
        toast.success("✅ Strategic period updated successfully");
      },
      onError: (error) => {
        toast.error(`Failed to update strategic period: ${error.message}`);
      },
    }
  );

  const [removeMutation, { loading: removing }] = useMutation(
    REMOVE_STRATEGIC_PERIOD,
    {
      refetchQueries: [{ query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 100 } }],
      onCompleted: () => {
        toast.success("🗑️ Strategic period deleted successfully");
      },
      onError: (error) => {
        toast.error(`Failed to delete strategic period: ${error.message}`);
      },
    }
  );

  const createStrategicPeriod = async (input: any) => {
    try {
      const result = await createMutation({ variables: { input } });
      return result.data?.createStrategicPeriod;
    } catch (error) {
      console.error("Error creating strategic period:", error);
      throw error;
    }
  };

  const updateStrategicPeriod = async (input: any) => {
    try {
      const result = await updateMutation({ variables: { input } });
      return result.data?.updateStrategicPeriod;
    } catch (error) {
      console.error("Error updating strategic period:", error);
      throw error;
    }
  };

  const removeStrategicPeriod = async (strategicPeriodId: string) => {
    try {
      const result = await removeMutation({ variables: { strategicPeriodId } });
      return result.data?.removeStrategicPeriod;
    } catch (error) {
      console.error("Error deleting strategic period:", error);
      throw error;
    }
  };

  return {
    createStrategicPeriod,
    updateStrategicPeriod,
    removeStrategicPeriod,
    loading: creating || updating || removing,
  };
};
