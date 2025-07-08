import { useMutation } from "@apollo/client";
import {
  CREATE_STRATEGIC_PERIOD,
  UPDATE_STRATEGIC_PERIOD,
  REMOVE_STRATEGIC_PERIOD,
} from "@/lib/graphql/mutations/strategic-periods";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategic-periods";
import {
  CreateStrategicPeriodMutationVariables,
  UpdateStrategicPeriodMutationVariables,
  RemoveStrategicPeriodMutationVariables,
} from "@/types/graphql";

export const useStrategicPeriodMutations = () => {
  const [
    createStrategicPeriod,
    { loading: createLoading, error: createError },
  ] = useMutation(CREATE_STRATEGIC_PERIOD, {
    refetchQueries: [
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 10 } },
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 20 } },
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 50 } },
    ],
  });

  const [
    updateStrategicPeriod,
    { loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_STRATEGIC_PERIOD, {
    refetchQueries: [
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 10 } },
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 20 } },
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 50 } },
    ],
  });

  const [
    removeStrategicPeriod,
    { loading: removeLoading, error: removeError },
  ] = useMutation(REMOVE_STRATEGIC_PERIOD, {
    refetchQueries: [
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 10 } },
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 20 } },
      { query: GET_STRATEGIC_PERIODS, variables: { page: 1, limit: 50 } },
    ],
  });

  const handleCreateStrategicPeriod = async (
    variables: CreateStrategicPeriodMutationVariables
  ) => {
    try {
      const result = await createStrategicPeriod({ variables });
      return result.data?.createStrategicPeriod;
    } catch (error) {
      console.error("Error creating strategic period:", error);
      throw error;
    }
  };

  const handleUpdateStrategicPeriod = async (
    variables: UpdateStrategicPeriodMutationVariables
  ) => {
    try {
      const result = await updateStrategicPeriod({ variables });
      return result.data?.updateStrategicPeriod;
    } catch (error) {
      console.error("Error updating strategic period:", error);
      throw error;
    }
  };

  const handleRemoveStrategicPeriod = async (
    variables: RemoveStrategicPeriodMutationVariables
  ) => {
    try {
      const result = await removeStrategicPeriod({ variables });
      return result.data?.removeStrategicPeriod;
    } catch (error) {
      console.error("Error removing strategic period:", error);
      throw error;
    }
  };

  return {
    createStrategicPeriod: handleCreateStrategicPeriod,
    updateStrategicPeriod: handleUpdateStrategicPeriod,
    removeStrategicPeriod: handleRemoveStrategicPeriod,
    loading: createLoading || updateLoading || removeLoading,
    error: createError || updateError || removeError,
  };
};
