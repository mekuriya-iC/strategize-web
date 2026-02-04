import { useQuery } from "@apollo/client";
import {
  GET_OBJECTIVES,
  GET_OBJECTIVE,
} from "@/lib/graphql/queries/objectives";
import {
  ObjectivesQueryVariables,
  ObjectiveQueryVariables,
  GetObjectivesResponse,
  GetObjectiveResponse,
} from "@/types/graphql";

export const useObjectives = (variables: ObjectivesQueryVariables = {}) => {
  const { data, loading, error, refetch } = useQuery<
    GetObjectivesResponse,
    ObjectivesQueryVariables
  >(GET_OBJECTIVES, {
    variables: {
      page: 1,
      limit: 10,
      ...variables,
    },
    fetchPolicy: "cache-and-network",
  });

  return {
    objectives: data?.objectives?.items || [],
    meta: data?.objectives?.meta,
    loading,
    error,
    refetch,
  };
};

export const useObjective = (variables: ObjectiveQueryVariables) => {
  const { data, loading, error, refetch } = useQuery<
    GetObjectiveResponse,
    ObjectiveQueryVariables
  >(GET_OBJECTIVE, {
    variables,
    fetchPolicy: "cache-and-network",
    // Skip query if objectiveId is empty or undefined
    skip: !variables.objectiveId,
  });

  return {
    objective: data?.objective,
    loading,
    error,
    refetch,
  };
};
